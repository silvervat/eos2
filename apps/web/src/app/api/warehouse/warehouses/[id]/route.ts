import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const warehouseUpdateSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(['main', 'mobile', 'external', 'vehicle']).optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  capacity_m3: z.number().optional(),
  temperature_controlled: z.boolean().optional(),
  security_level: z.enum(['low', 'standard', 'high', 'maximum']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  notes: z.string().optional(),
});

// GET /api/warehouse/warehouses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        manager:user_profiles(id, full_name, email, avatar_url)
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

// PUT /api/warehouse/warehouses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = warehouseUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('warehouses')
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

// DELETE /api/warehouse/warehouses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Soft delete
    const { data, error } = await supabase
      .from('warehouses')
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
