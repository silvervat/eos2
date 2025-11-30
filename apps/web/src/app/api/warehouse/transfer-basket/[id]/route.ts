import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for basket item
const basketItemSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  qrCode: z.string(),
  currentWarehouse: z.string().optional(),
  currentStock: z.number().default(0),
  requestedQuantity: z.number().positive().default(1),
  availableQuantity: z.number().default(0),
  thumbnailUrl: z.string().optional(),
  isValid: z.boolean().default(true),
  warnings: z.array(z.string()).default([]),
});

// Schema for updating a basket
const updateBasketSchema = z.object({
  from_warehouse_id: z.string().uuid().optional().nullable(),
  to_project_id: z.string().optional().nullable(),
  to_warehouse_id: z.string().uuid().optional().nullable(),
  to_user_id: z.string().uuid().optional().nullable(),
  items: z.array(basketItemSchema).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['draft', 'pending', 'cancelled']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/warehouse/transfer-basket/[id]
// Get a specific transfer basket by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('warehouse_transfer_baskets')
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name, code, type),
        to_project:projects!to_project_id(id, name, code),
        to_warehouse:warehouses!to_warehouse_id(id, name, code, type),
        to_user:user_profiles!to_user_id(id, full_name, email),
        created_by_user:user_profiles!created_by(id, full_name, email)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
      }
      console.error('Error fetching transfer basket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /transfer-basket/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/warehouse/transfer-basket/[id]
// Update a specific transfer basket
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = updateBasketSchema.parse(body);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check basket exists and is in draft/pending status
    const { data: existing, error: fetchError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('id, status, created_by')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot update a completed or cancelled basket' },
        { status: 400 }
      );
    }

    // Update the basket
    const { data, error } = await supabase
      .from('warehouse_transfer_baskets')
      .update(validated)
      .eq('id', id)
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name, code),
        to_project:projects!to_project_id(id, name, code),
        to_warehouse:warehouses!to_warehouse_id(id, name, code),
        to_user:user_profiles!to_user_id(id, full_name)
      `)
      .single();

    if (error) {
      console.error('Error updating transfer basket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in PATCH /transfer-basket/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/transfer-basket/[id]
// Soft delete a transfer basket (only draft baskets)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check basket exists, is draft, and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('warehouse_transfer_baskets')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft baskets can be deleted' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('warehouse_transfer_baskets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting transfer basket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Basket deleted' });
  } catch (error) {
    console.error('Unexpected error in DELETE /transfer-basket/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
