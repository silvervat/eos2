import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/warehouse/categories/export - Export categories to CSV/Excel format
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all categories with stock info
    const { data: categories, error } = await supabase
      .from('asset_categories')
      .select('*')
      .is('deleted_at', null)
      .order('path');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get stock counts per category
    const categoryIds = categories?.map(c => c.id) || [];
    const { data: stockData } = await supabase
      .from('assets')
      .select('category_id, current_quantity')
      .in('category_id', categoryIds)
      .is('deleted_at', null);

    const stockByCategory = new Map<string, number>();
    stockData?.forEach(asset => {
      if (asset.category_id) {
        const current = stockByCategory.get(asset.category_id) || 0;
        stockByCategory.set(asset.category_id, current + (asset.current_quantity || 0));
      }
    });

    // Build export data
    const exportData = categories?.map(cat => ({
      code: cat.code,
      name: cat.name,
      path: cat.path,
      description: cat.description || '',
      is_consumable: cat.is_consumable ? 'Jah' : 'Ei',
      min_stock_quantity: cat.min_stock_quantity || 0,
      reorder_point: cat.reorder_point || 0,
      unit_of_measure: cat.unit_of_measure || 'tk',
      current_stock: stockByCategory.get(cat.id) || 0,
      requires_maintenance: cat.requires_maintenance ? 'Jah' : 'Ei',
      maintenance_interval_days: cat.maintenance_interval_days || '',
      color: cat.color || '',
    })) || [];

    if (format === 'json') {
      return NextResponse.json({ data: exportData });
    }

    // Generate CSV
    const headers = [
      'Kood', 'Nimi', 'Tee', 'Kirjeldus', 'Tükikaup',
      'Min kogus', 'Tellimispunkt', 'Ühik', 'Laoseis',
      'Hooldust vajav', 'Hooldusintervall (päeva)', 'Värv'
    ];

    const csvRows = [
      headers.join(';'),
      ...exportData.map(row => [
        row.code,
        row.name,
        row.path,
        `"${row.description.replace(/"/g, '""')}"`,
        row.is_consumable,
        row.min_stock_quantity,
        row.reorder_point,
        row.unit_of_measure,
        row.current_stock,
        row.requires_maintenance,
        row.maintenance_interval_days,
        row.color,
      ].join(';'))
    ];

    const csv = csvRows.join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kategooriad_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
