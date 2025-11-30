import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  requires_maintenance: z.boolean().optional(),
  maintenance_interval_days: z.number().optional().nullable(),
  is_consumable: z.boolean().optional(),
});

// GET /api/warehouse/categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/warehouse/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If changing parent, recalculate path and level
    let path, level;
    if (validated.parent_id !== undefined) {
      if (validated.parent_id) {
        const { data: parent } = await supabase
          .from('asset_categories')
          .select('path, level')
          .eq('id', validated.parent_id)
          .single();

        if (parent) {
          const { data: current } = await supabase
            .from('asset_categories')
            .select('code')
            .eq('id', id)
            .single();

          const code = validated.code || current?.code || '';
          path = `${parent.path}/${code}`;
          level = parent.level + 1;
        }
      } else {
        // Moving to root
        const { data: current } = await supabase
          .from('asset_categories')
          .select('code')
          .eq('id', id)
          .single();

        path = validated.code || current?.code || '';
        level = 0;
      }
    }

    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    if (path !== undefined) updateData.path = path;
    if (level !== undefined) updateData.level = level;

    const { data, error } = await supabase
      .from('asset_categories')
      .update(updateData)
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

// DELETE /api/warehouse/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if category has children
    const { data: children } = await supabase
      .from('asset_categories')
      .select('id')
      .eq('parent_id', id)
      .is('deleted_at', null)
      .limit(1);

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    // Check if category has assets
    const { data: assets } = await supabase
      .from('assets')
      .select('id')
      .eq('category_id', id)
      .is('deleted_at', null)
      .limit(1);

    if (assets && assets.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with assets. Move assets first.' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('asset_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
