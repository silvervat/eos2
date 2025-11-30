import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for adding item by QR code
const addItemByQRSchema = z.object({
  qrCode: z.string().min(1),
  quantity: z.number().positive().default(1),
});

// Schema for adding item by asset ID
const addItemByIdSchema = z.object({
  assetId: z.string().uuid(),
  quantity: z.number().positive().default(1),
});

// Schema for updating item quantity
const updateItemSchema = z.object({
  assetId: z.string().uuid(),
  quantity: z.number().positive(),
});

// Schema for removing item
const removeItemSchema = z.object({
  assetId: z.string().uuid(),
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

// Helper function to look up asset by QR code
async function lookupAssetByQR(supabase: Awaited<ReturnType<typeof createClient>>, qrCode: string) {
  // Try exact match on qr_code field
  let { data: asset, error } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      qr_code,
      barcode,
      asset_code,
      current_warehouse_id,
      quantity_available,
      quantity_reserved,
      status,
      is_consumable,
      thumbnail_url,
      current_warehouse:warehouses!current_warehouse_id(id, name)
    `)
    .eq('qr_code', qrCode)
    .is('deleted_at', null)
    .single();

  // If not found, try barcode
  if (!asset) {
    const barcodeResult = await supabase
      .from('assets')
      .select(`
        id,
        name,
        qr_code,
        barcode,
        asset_code,
        current_warehouse_id,
        quantity_available,
        quantity_reserved,
        status,
        is_consumable,
        thumbnail_url,
        current_warehouse:warehouses!current_warehouse_id(id, name)
      `)
      .eq('barcode', qrCode)
      .is('deleted_at', null)
      .single();

    asset = barcodeResult.data;
    error = barcodeResult.error;
  }

  // If still not found, try asset_code
  if (!asset) {
    const assetCodeResult = await supabase
      .from('assets')
      .select(`
        id,
        name,
        qr_code,
        barcode,
        asset_code,
        current_warehouse_id,
        quantity_available,
        quantity_reserved,
        status,
        is_consumable,
        thumbnail_url,
        current_warehouse:warehouses!current_warehouse_id(id, name)
      `)
      .eq('asset_code', qrCode)
      .is('deleted_at', null)
      .single();

    asset = assetCodeResult.data;
    error = assetCodeResult.error;
  }

  return { asset, error };
}

// POST /api/warehouse/transfer-basket/[id]/items
// Add an item to the basket (by QR code scan or asset ID)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: basketId } = await params;
    const supabase = await createClient();

    const body = await request.json();

    // Determine which schema to use
    let qrCode: string | null = null;
    let assetId: string | null = null;
    let quantity = 1;

    if (body.qrCode) {
      const validated = addItemByQRSchema.parse(body);
      qrCode = validated.qrCode;
      quantity = validated.quantity;
    } else if (body.assetId) {
      const validated = addItemByIdSchema.parse(body);
      assetId = validated.assetId;
      quantity = validated.quantity;
    } else {
      return NextResponse.json(
        { error: 'Either qrCode or assetId is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the basket
    const { data: basket, error: basketError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('id, status, items, from_warehouse_id')
      .eq('id', basketId)
      .is('deleted_at', null)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (basket.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify a non-draft basket' },
        { status: 400 }
      );
    }

    // Look up the asset
    let asset;
    if (qrCode) {
      const result = await lookupAssetByQR(supabase, qrCode);
      asset = result.asset;
    } else if (assetId) {
      const { data } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          qr_code,
          barcode,
          asset_code,
          current_warehouse_id,
          quantity_available,
          quantity_reserved,
          status,
          is_consumable,
          thumbnail_url,
          current_warehouse:warehouses!current_warehouse_id(id, name)
        `)
        .eq('id', assetId)
        .is('deleted_at', null)
        .single();
      asset = data;
    }

    if (!asset) {
      return NextResponse.json(
        {
          error: 'Asset not found',
          scannedCode: qrCode || assetId,
          suggestions: [] // Could add fuzzy matching here
        },
        { status: 404 }
      );
    }

    // Build warnings
    const warnings: string[] = [];
    const availableQuantity = asset.is_consumable
      ? (asset.quantity_available || 0) - (asset.quantity_reserved || 0)
      : 1;

    // Check if asset is in the source warehouse
    if (basket.from_warehouse_id && asset.current_warehouse_id !== basket.from_warehouse_id) {
      warnings.push('Asset is not in the source warehouse');
    }

    // Check if enough stock
    if (availableQuantity <= 0) {
      warnings.push('No stock available');
    } else if (availableQuantity < quantity) {
      warnings.push(`Only ${availableQuantity} available`);
    }

    // Check if reserved
    if (asset.quantity_reserved && asset.quantity_reserved > 0) {
      warnings.push(`${asset.quantity_reserved} units reserved for other projects`);
    }

    // Check status
    if (asset.status !== 'available') {
      warnings.push(`Asset status: ${asset.status}`);
    }

    // Parse existing items
    const existingItems: TransferBasketItem[] = Array.isArray(basket.items) ? basket.items : [];

    // Check if item already in basket
    const existingItemIndex = existingItems.findIndex(item => item.assetId === asset.id);

    let updatedItems: TransferBasketItem[];

    if (existingItemIndex >= 0) {
      // Increment quantity
      updatedItems = existingItems.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.requestedQuantity + quantity;
          return {
            ...item,
            requestedQuantity: newQuantity,
            warnings: newQuantity > availableQuantity
              ? [...item.warnings.filter(w => !w.startsWith('Only')), `Only ${availableQuantity} available`]
              : item.warnings,
          };
        }
        return item;
      });
    } else {
      // Add new item
      const warehouse = asset.current_warehouse as { id: string; name: string } | null;
      const newItem: TransferBasketItem = {
        assetId: asset.id,
        assetName: asset.name,
        qrCode: asset.qr_code || asset.barcode || asset.asset_code || '',
        currentWarehouse: warehouse?.name || null,
        currentStock: asset.is_consumable ? (asset.quantity_available || 0) : 1,
        requestedQuantity: quantity,
        availableQuantity,
        thumbnailUrl: asset.thumbnail_url || null,
        isValid: availableQuantity > 0 && asset.status === 'available',
        warnings,
      };
      updatedItems = [...existingItems, newItem];
    }

    // Update the basket
    const { data: updatedBasket, error: updateError } = await supabase
      .from('warehouse_transfer_baskets')
      .update({ items: updatedItems })
      .eq('id', basketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating basket items:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Return the added/updated item info for fast UI feedback
    const addedItem = updatedItems.find(item => item.assetId === asset.id);

    return NextResponse.json({
      data: {
        basket: updatedBasket,
        item: addedItem,
        action: existingItemIndex >= 0 ? 'incremented' : 'added',
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in POST /transfer-basket/[id]/items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/warehouse/transfer-basket/[id]/items
// Update an item's quantity in the basket
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: basketId } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = updateItemSchema.parse(body);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the basket
    const { data: basket, error: basketError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('id, status, items')
      .eq('id', basketId)
      .is('deleted_at', null)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (basket.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify a non-draft basket' },
        { status: 400 }
      );
    }

    // Parse existing items
    const existingItems: TransferBasketItem[] = Array.isArray(basket.items) ? basket.items : [];

    // Find and update the item
    const itemIndex = existingItems.findIndex(item => item.assetId === validated.assetId);
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in basket' }, { status: 404 });
    }

    const updatedItems = existingItems.map((item, index) => {
      if (index === itemIndex) {
        const warnings = [...item.warnings.filter(w => !w.startsWith('Only'))];
        if (validated.quantity > item.availableQuantity) {
          warnings.push(`Only ${item.availableQuantity} available`);
        }
        return {
          ...item,
          requestedQuantity: validated.quantity,
          warnings,
        };
      }
      return item;
    });

    // Update the basket
    const { data: updatedBasket, error: updateError } = await supabase
      .from('warehouse_transfer_baskets')
      .update({ items: updatedItems })
      .eq('id', basketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating basket items:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        basket: updatedBasket,
        item: updatedItems[itemIndex],
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in PATCH /transfer-basket/[id]/items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/transfer-basket/[id]/items
// Remove an item from the basket
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: basketId } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = removeItemSchema.parse(body);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the basket
    const { data: basket, error: basketError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('id, status, items')
      .eq('id', basketId)
      .is('deleted_at', null)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (basket.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify a non-draft basket' },
        { status: 400 }
      );
    }

    // Parse existing items and remove the specified item
    const existingItems: TransferBasketItem[] = Array.isArray(basket.items) ? basket.items : [];
    const updatedItems = existingItems.filter(item => item.assetId !== validated.assetId);

    if (updatedItems.length === existingItems.length) {
      return NextResponse.json({ error: 'Item not found in basket' }, { status: 404 });
    }

    // Update the basket
    const { data: updatedBasket, error: updateError } = await supabase
      .from('warehouse_transfer_baskets')
      .update({ items: updatedItems })
      .eq('id', basketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing item from basket:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        basket: updatedBasket,
        removedAssetId: validated.assetId,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in DELETE /transfer-basket/[id]/items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
