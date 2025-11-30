import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/warehouse/assets/low-stock
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const warehouse_id = searchParams.get('warehouse_id');

    // Get all consumable assets
    let query = supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(id, name),
        warehouse:warehouses(id, name, code)
      `)
      .eq('is_consumable', true)
      .is('deleted_at', null);

    if (warehouse_id) {
      query = query.eq('current_warehouse_id', warehouse_id);
    }

    const { data: assets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter low stock items
    const lowStock = assets?.filter((asset: any) => {
      const available = asset.quantity_available || 0;
      const reorderPoint = asset.reorder_point || asset.min_quantity || 0;
      return available <= reorderPoint && reorderPoint > 0;
    }).map((asset: any) => {
      const available = asset.quantity_available || 0;
      const reorderPoint = asset.reorder_point || asset.min_quantity || 0;
      const stockPercent = reorderPoint > 0 ? (available / reorderPoint * 100) : 0;

      return {
        ...asset,
        stock_percent: Math.round(stockPercent),
        shortage: reorderPoint - available,
        urgency: stockPercent <= 25 ? 'critical' : stockPercent <= 50 ? 'warning' : 'low'
      };
    }).sort((a: any, b: any) => a.stock_percent - b.stock_percent);

    return NextResponse.json({
      data: lowStock,
      summary: {
        total: lowStock?.length || 0,
        critical: lowStock?.filter((a: any) => a.urgency === 'critical').length || 0,
        warning: lowStock?.filter((a: any) => a.urgency === 'warning').length || 0,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
