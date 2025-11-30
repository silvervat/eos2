import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const stockMovementSchema = z.object({
  movement_type: z.enum(['in', 'out', 'adjustment', 'transfer', 'lost', 'found', 'damaged']),
  quantity: z.number(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
});

// GET /api/warehouse/assets/[id]/stock - Get stock movements
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        warehouse:warehouses(id, name),
        user:user_profiles(id, full_name)
      `)
      .eq('asset_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/assets/[id]/stock - Create stock movement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = stockMovementSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    // Get current asset
    const { data: asset } = await supabase
      .from('assets')
      .select('quantity_available, current_warehouse_id, is_consumable')
      .eq('id', id)
      .single();

    if (!asset?.is_consumable) {
      return NextResponse.json({ error: 'Asset is not a consumable' }, { status: 400 });
    }

    const quantityBefore = asset.quantity_available || 0;
    let quantityAfter = quantityBefore;

    // Calculate new quantity
    if (validated.movement_type === 'in' || validated.movement_type === 'found') {
      quantityAfter = quantityBefore + validated.quantity;
    } else if (validated.movement_type === 'out' || validated.movement_type === 'lost' || validated.movement_type === 'damaged') {
      quantityAfter = quantityBefore - validated.quantity;
      if (quantityAfter < 0) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }
    } else if (validated.movement_type === 'adjustment') {
      quantityAfter = validated.quantity; // Direct set
    }

    // Create movement record
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        tenant_id: profile?.tenant_id,
        asset_id: id,
        warehouse_id: asset.current_warehouse_id,
        movement_type: validated.movement_type,
        quantity: validated.quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reference_type: validated.reference_type,
        reference_id: validated.reference_id,
        user_id: profile?.id,
        reason: validated.reason,
        notes: validated.notes,
      })
      .select()
      .single();

    if (movementError) {
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    // Update asset quantity
    await supabase
      .from('assets')
      .update({ quantity_available: quantityAfter })
      .eq('id', id);

    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
