import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for completing a transfer
const completeTransferSchema = z.object({
  notes: z.string().optional(),
  checkOutPhotos: z.array(z.string()).optional(), // URLs to photos
});

interface TransferBasketItem {
  assetId: string;
  assetName: string;
  qrCode: string;
  currentWarehouse: string | null;
  currentStock: number;
  requestedQuantity: number;
  availableQuantity: number;
  thumbnailUrl: string | null;
  isValid: boolean;
  warnings: string[];
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/warehouse/transfer-basket/[id]/complete
// Complete the transfer, creating actual transfer records
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: basketId } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = completeTransferSchema.parse(body);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get the basket with all details
    const { data: basket, error: basketError } = await supabase
      .from('warehouse_transfer_baskets')
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name),
        to_project:projects!to_project_id(id, name),
        to_warehouse:warehouses!to_warehouse_id(id, name),
        to_user:user_profiles!to_user_id(id, full_name)
      `)
      .eq('id', basketId)
      .is('deleted_at', null)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (basket.status !== 'draft' && basket.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot complete a basket with status: ${basket.status}` },
        { status: 400 }
      );
    }

    // Parse items
    const items: TransferBasketItem[] = Array.isArray(basket.items) ? basket.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot complete an empty basket' },
        { status: 400 }
      );
    }

    // Validate all items are valid
    const invalidItems = items.filter(item => !item.isValid);
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot complete basket with invalid items',
          invalidItems: invalidItems.map(item => ({
            assetId: item.assetId,
            assetName: item.assetName,
            warnings: item.warnings,
          }))
        },
        { status: 400 }
      );
    }

    // Determine transfer type
    let transferType: 'warehouse' | 'project' | 'user' = 'warehouse';
    if (basket.to_project_id) {
      transferType = 'project';
    } else if (basket.to_user_id) {
      transferType = 'user';
    }

    // Store created transfers
    const createdTransfers: Array<{ id: string; asset_id: string }> = [];
    const stockMovements: Array<Record<string, unknown>> = [];
    const errors: Array<{ assetId: string; error: string }> = [];

    // Process each item
    for (const item of items) {
      try {
        // Create transfer record
        const transferData = {
          tenant_id: profile.tenant_id,
          asset_id: item.assetId,
          quantity: item.requestedQuantity,
          transfer_type: transferType,
          from_warehouse_id: basket.from_warehouse_id,
          to_warehouse_id: basket.to_warehouse_id,
          to_user_id: basket.to_user_id,
          to_project_id: basket.to_project_id,
          status: 'delivered', // Complete immediately
          requested_by_user_id: profile.id,
          requested_at: new Date().toISOString(),
          approved_by_user_id: profile.id, // Self-approved for fast transfers
          approved_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
          check_out_photos: validated.checkOutPhotos || [],
          notes: validated.notes || basket.notes,
        };

        const { data: transfer, error: transferError } = await supabase
          .from('asset_transfers')
          .insert(transferData)
          .select()
          .single();

        if (transferError) {
          console.error(`Error creating transfer for asset ${item.assetId}:`, transferError);
          errors.push({ assetId: item.assetId, error: transferError.message });
          continue;
        }

        createdTransfers.push({ id: transfer.id, asset_id: item.assetId });

        // Get the asset to check if it's consumable
        const { data: asset } = await supabase
          .from('assets')
          .select('id, is_consumable, quantity_available')
          .eq('id', item.assetId)
          .single();

        // Update asset based on transfer type
        const assetUpdate: Record<string, unknown> = {};

        if (basket.to_warehouse_id) {
          assetUpdate.current_warehouse_id = basket.to_warehouse_id;
        }

        if (basket.to_user_id) {
          assetUpdate.assigned_to_user_id = basket.to_user_id;
          assetUpdate.assigned_at = new Date().toISOString();
          assetUpdate.status = 'in_use';
        }

        if (basket.to_project_id) {
          assetUpdate.assigned_to_project_id = basket.to_project_id;
          assetUpdate.assigned_at = new Date().toISOString();
          assetUpdate.status = 'in_use';
        }

        // For consumables, update quantity
        if (asset?.is_consumable) {
          const newQuantity = (asset.quantity_available || 0) - item.requestedQuantity;
          assetUpdate.quantity_available = Math.max(0, newQuantity);

          // Create stock movement
          stockMovements.push({
            tenant_id: profile.tenant_id,
            asset_id: item.assetId,
            movement_type: 'transfer',
            quantity: -item.requestedQuantity, // Negative for outgoing
            reference_type: 'transfer',
            reference_id: transfer.id,
            from_warehouse_id: basket.from_warehouse_id,
            to_warehouse_id: basket.to_warehouse_id,
            to_project_id: basket.to_project_id,
            performed_by: profile.id,
            notes: `Transfer to ${basket.to_project_id ? 'project' : basket.to_warehouse_id ? 'warehouse' : 'user'}`,
          });
        }

        // Update the asset
        if (Object.keys(assetUpdate).length > 0) {
          const { error: updateError } = await supabase
            .from('assets')
            .update(assetUpdate)
            .eq('id', item.assetId);

          if (updateError) {
            console.error(`Error updating asset ${item.assetId}:`, updateError);
            // Don't fail the whole transfer, just log it
          }
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.assetId}:`, itemError);
        errors.push({ assetId: item.assetId, error: 'Unexpected error' });
      }
    }

    // Create stock movements in batch
    if (stockMovements.length > 0) {
      const { error: stockError } = await supabase
        .from('stock_movements')
        .insert(stockMovements);

      if (stockError) {
        console.error('Error creating stock movements:', stockError);
        // Don't fail - transfers were still created
      }
    }

    // Update basket status to completed
    const { data: completedBasket, error: completeError } = await supabase
      .from('warehouse_transfer_baskets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: validated.notes || basket.notes,
      })
      .eq('id', basketId)
      .select()
      .single();

    if (completeError) {
      console.error('Error updating basket status:', completeError);
      // Transfers were still created, so we should inform the user
    }

    // Return success response
    const successCount = createdTransfers.length;
    const failedCount = errors.length;

    return NextResponse.json({
      data: {
        basket: completedBasket,
        transfers: createdTransfers,
        summary: {
          totalItems: items.length,
          successfulTransfers: successCount,
          failedTransfers: failedCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
      message: failedCount > 0
        ? `Transfer completed with ${failedCount} errors`
        : `Successfully transferred ${successCount} items`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in POST /transfer-basket/[id]/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/warehouse/transfer-basket/[id]/complete
// Get validation status before completing (pre-flight check)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: basketId } = await params;
    const supabase = await createClient();

    // Get the basket
    const { data: basket, error: basketError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('*')
      .eq('id', basketId)
      .is('deleted_at', null)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Parse items
    const items: TransferBasketItem[] = Array.isArray(basket.items) ? basket.items : [];

    // Validate each item's current stock (real-time check)
    const validationResults = await Promise.all(
      items.map(async (item) => {
        const { data: asset } = await supabase
          .from('assets')
          .select('id, quantity_available, quantity_reserved, status')
          .eq('id', item.assetId)
          .is('deleted_at', null)
          .single();

        if (!asset) {
          return {
            assetId: item.assetId,
            assetName: item.assetName,
            isValid: false,
            error: 'Asset no longer exists',
          };
        }

        const available = (asset.quantity_available || 1) - (asset.quantity_reserved || 0);
        const isValid = available >= item.requestedQuantity && asset.status === 'available';

        return {
          assetId: item.assetId,
          assetName: item.assetName,
          requestedQuantity: item.requestedQuantity,
          availableQuantity: available,
          isValid,
          error: !isValid
            ? available < item.requestedQuantity
              ? `Only ${available} available`
              : `Asset status: ${asset.status}`
            : null,
        };
      })
    );

    const invalidItems = validationResults.filter(r => !r.isValid);
    const isValid = invalidItems.length === 0 && items.length > 0;

    return NextResponse.json({
      data: {
        basketId,
        status: basket.status,
        totalItems: items.length,
        isValid,
        validationResults,
        invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
        canComplete: isValid && (basket.status === 'draft' || basket.status === 'pending'),
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /transfer-basket/[id]/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
