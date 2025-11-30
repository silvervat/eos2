import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/warehouse/assets/export
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const ids = searchParams.get('ids'); // Optional comma-separated list of asset IDs

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('assets')
      .select(`
        id,
        asset_code,
        name,
        type,
        status,
        condition,
        is_consumable,
        quantity_available,
        quantity_unit,
        min_quantity,
        reorder_point,
        manufacturer,
        model,
        serial_number,
        purchase_price,
        current_value,
        description,
        notes,
        created_at,
        updated_at,
        category:asset_categories(name),
        warehouse:warehouses(name),
        assigned_user:user_profiles(full_name),
        assigned_project:projects(name)
      `)
      .is('deleted_at', null);

    if (ids) {
      const idList = ids.split(',');
      query = query.in('id', idList);
    }

    const { data, error } = await query.order('asset_code');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (format === 'json') {
      return NextResponse.json({ data });
    }

    // Generate CSV
    const headers = [
      'Kood',
      'Nimi',
      'Tüüp',
      'Staatus',
      'Seisukord',
      'Tükikaup',
      'Kogus',
      'Ühik',
      'Min kogus',
      'Tellimispunkt',
      'Tootja',
      'Mudel',
      'Seerianumber',
      'Ostuhind',
      'Praegune väärtus',
      'Kategooria',
      'Ladu',
      'Kasutaja',
      'Projekt',
      'Kirjeldus',
      'Märkmed',
      'Loodud',
      'Muudetud',
    ];

    const statusLabels: Record<string, string> = {
      available: 'Saadaval',
      in_use: 'Kasutuses',
      maintenance: 'Hoolduses',
      rented: 'Rendis',
      retired: 'Välja arvatud',
      lost: 'Kadunud',
      damaged: 'Kahjustatud',
    };

    const conditionLabels: Record<string, string> = {
      excellent: 'Suurepärane',
      good: 'Hea',
      fair: 'Rahuldav',
      poor: 'Halb',
    };

    const typeLabels: Record<string, string> = {
      asset: 'Vara',
      consumable: 'Tükikaup',
      tool: 'Tööriist',
    };

    const rows = data.map((asset: any) => [
      asset.asset_code,
      asset.name,
      typeLabels[asset.type] || asset.type,
      statusLabels[asset.status] || asset.status,
      conditionLabels[asset.condition] || asset.condition,
      asset.is_consumable ? 'Jah' : 'Ei',
      asset.quantity_available || '',
      asset.quantity_unit || '',
      asset.min_quantity || '',
      asset.reorder_point || '',
      asset.manufacturer || '',
      asset.model || '',
      asset.serial_number || '',
      asset.purchase_price || '',
      asset.current_value || '',
      asset.category?.name || '',
      asset.warehouse?.name || '',
      asset.assigned_user?.full_name || '',
      asset.assigned_project?.name || '',
      (asset.description || '').replace(/[\n\r]/g, ' '),
      (asset.notes || '').replace(/[\n\r]/g, ' '),
      asset.created_at ? new Date(asset.created_at).toLocaleDateString('et-EE') : '',
      asset.updated_at ? new Date(asset.updated_at).toLocaleDateString('et-EE') : '',
    ]);

    // Escape and format CSV
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(escapeCSV).join(';'))
    ].join('\n');

    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="varad-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
