import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const assetUpdateSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  asset_code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(['asset', 'consumable', 'tool']).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'rented', 'retired', 'lost', 'damaged']).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  current_warehouse_id: z.string().uuid().nullable().optional(),
  current_location_id: z.string().uuid().nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  assigned_to_project_id: z.string().uuid().nullable().optional(),
  is_consumable: z.boolean().optional(),
  quantity_available: z.number().optional(),
  quantity_unit: z.string().optional(),
  min_quantity: z.number().nullable().optional(),
  max_quantity: z.number().nullable().optional(),
  reorder_point: z.number().nullable().optional(),
  purchase_price: z.number().nullable().optional(),
  current_value: z.number().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  requires_maintenance: z.boolean().optional(),
  maintenance_interval_days: z.number().nullable().optional(),
}).partial();

// GET /api/warehouse/assets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(*),
        warehouse:warehouses(*),
        location:warehouse_locations(*),
        assigned_user:user_profiles(id, full_name, email, avatar_url),
        assigned_project:projects(id, name, code, status),
        photos:asset_photos(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/warehouse/assets/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = assetUpdateSchema.parse(body);

    // If assigning to user/project, update assigned_at
    if (validated.assigned_to_user_id || validated.assigned_to_project_id) {
      (validated as any).assigned_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('assets')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/assets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Soft delete
    const { data, error } = await supabase
      .from('assets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
