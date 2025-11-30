import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const categorySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  requires_maintenance: z.boolean().default(false),
  maintenance_interval_days: z.number().optional().nullable(),
  is_consumable: z.boolean().default(false),
  min_stock_quantity: z.number().optional().nullable(),
  reorder_point: z.number().optional().nullable(),
  unit_of_measure: z.string().optional(),
});

// GET /api/warehouse/categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const parent_id = searchParams.get('parent_id');
    const flat = searchParams.get('flat') === 'true';
    const withStock = searchParams.get('with_stock') === 'true';

    let query = supabase
      .from('asset_categories')
      .select('*')
      .is('deleted_at', null)
      .order('order_index')
      .order('name');

    if (!flat && parent_id) {
      query = query.eq('parent_id', parent_id);
    } else if (!flat && !parent_id) {
      // Only root categories
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Categories API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If stock info requested, get stock summaries
    if (withStock && data) {
      const categoryIds = data.map(c => c.id);

      // Get stock counts per category
      const { data: stockData } = await supabase
        .from('assets')
        .select('category_id, current_quantity')
        .in('category_id', categoryIds)
        .is('deleted_at', null);

      // Calculate stock per category
      const stockByCategory = new Map<string, { total: number; count: number }>();
      stockData?.forEach(asset => {
        if (asset.category_id) {
          const current = stockByCategory.get(asset.category_id) || { total: 0, count: 0 };
          current.total += asset.current_quantity || 0;
          current.count += 1;
          stockByCategory.set(asset.category_id, current);
        }
      });

      // Merge stock data into categories
      const dataWithStock = data.map(category => {
        const stock = stockByCategory.get(category.id) || { total: 0, count: 0 };
        const minStock = category.min_stock_quantity || 0;
        const reorderPoint = category.reorder_point || 0;

        let stockStatus = 'ok';
        if (category.is_consumable && minStock > 0 && stock.total < minStock) {
          stockStatus = 'critical';
        } else if (category.is_consumable && reorderPoint > 0 && stock.total < reorderPoint) {
          stockStatus = 'low';
        }

        return {
          ...category,
          total_stock: stock.total,
          asset_count: stock.count,
          stock_status: stockStatus,
        };
      });

      return NextResponse.json({ data: dataWithStock });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/categories
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = categorySchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Calculate path and level
    let path = validated.code;
    let level = 0;

    if (validated.parent_id) {
      const { data: parent } = await supabase
        .from('asset_categories')
        .select('path, level')
        .eq('id', validated.parent_id)
        .single();

      if (parent) {
        path = `${parent.path}/${validated.code}`;
        level = parent.level + 1;
      }
    }

    const { data, error } = await supabase
      .from('asset_categories')
      .insert({
        ...validated,
        tenant_id: profile.tenant_id,
        path,
        level,
      })
      .select()
      .single();

    if (error) {
      console.error('Category creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Category creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
