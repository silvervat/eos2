import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ImportRow {
  code: string;
  name: string;
  parent_code?: string;
  description?: string;
  is_consumable?: string | boolean;
  min_stock_quantity?: number | string;
  reorder_point?: number | string;
  unit_of_measure?: string;
  requires_maintenance?: string | boolean;
  maintenance_interval_days?: number | string;
  color?: string;
}

// POST /api/warehouse/categories/import - Import categories from CSV
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const contentType = request.headers.get('content-type') || '';
    let rows: ImportRow[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      rows = body.data || body;
    } else if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      const text = await request.text();
      rows = parseCSV(text);
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!rows.length) {
      return NextResponse.json({ error: 'No data to import' }, { status: 400 });
    }

    // Get existing categories for parent lookup
    const { data: existingCategories } = await supabase
      .from('asset_categories')
      .select('id, code, path, level')
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null);

    const categoryByCode = new Map(existingCategories?.map(c => [c.code, c]) || []);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { row: number; code: string; error: string }[],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.code || !row.name) {
        results.errors.push({ row: i + 1, code: row.code || '', error: 'Kood ja nimi on kohustuslikud' });
        continue;
      }

      try {
        // Determine parent
        let parent_id: string | null = null;
        let path = row.code;
        let level = 0;

        if (row.parent_code) {
          const parent = categoryByCode.get(row.parent_code);
          if (parent) {
            parent_id = parent.id;
            path = `${parent.path}/${row.code}`;
            level = parent.level + 1;
          } else {
            results.errors.push({ row: i + 1, code: row.code, error: `Ülemkategooriat "${row.parent_code}" ei leitud` });
            continue;
          }
        }

        const categoryData = {
          code: row.code,
          name: row.name,
          parent_id,
          path,
          level,
          description: row.description || null,
          is_consumable: parseBoolean(row.is_consumable),
          min_stock_quantity: parseInt(String(row.min_stock_quantity)) || 0,
          reorder_point: parseInt(String(row.reorder_point)) || 0,
          unit_of_measure: row.unit_of_measure || 'tk',
          requires_maintenance: parseBoolean(row.requires_maintenance),
          maintenance_interval_days: parseInt(String(row.maintenance_interval_days)) || null,
          color: row.color || '#3b82f6',
          tenant_id: profile.tenant_id,
        };

        // Check if exists
        const existing = categoryByCode.get(row.code);

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('asset_categories')
            .update(categoryData)
            .eq('id', existing.id);

          if (error) {
            results.errors.push({ row: i + 1, code: row.code, error: error.message });
          } else {
            results.updated++;
          }
        } else {
          // Create new
          const { data, error } = await supabase
            .from('asset_categories')
            .insert(categoryData)
            .select('id, code, path, level')
            .single();

          if (error) {
            results.errors.push({ row: i + 1, code: row.code, error: error.message });
          } else {
            results.created++;
            // Add to map for subsequent parent lookups
            if (data) {
              categoryByCode.set(data.code, data);
            }
          }
        }
      } catch (err) {
        results.errors.push({ row: i + 1, code: row.code, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imporditud: ${results.created} uut, ${results.updated} uuendatud${results.errors.length ? `, ${results.errors.length} viga` : ''}`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header (handle both comma and semicolon)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Map Estonian headers to field names
  const headerMap: Record<string, keyof ImportRow> = {
    'kood': 'code',
    'code': 'code',
    'nimi': 'name',
    'name': 'name',
    'ülemkategooria': 'parent_code',
    'parent_code': 'parent_code',
    'parent': 'parent_code',
    'kirjeldus': 'description',
    'description': 'description',
    'tükikaup': 'is_consumable',
    'is_consumable': 'is_consumable',
    'min kogus': 'min_stock_quantity',
    'min_stock_quantity': 'min_stock_quantity',
    'tellimispunkt': 'reorder_point',
    'reorder_point': 'reorder_point',
    'ühik': 'unit_of_measure',
    'unit_of_measure': 'unit_of_measure',
    'hooldust vajav': 'requires_maintenance',
    'requires_maintenance': 'requires_maintenance',
    'hooldusintervall (päeva)': 'maintenance_interval_days',
    'maintenance_interval_days': 'maintenance_interval_days',
    'värv': 'color',
    'color': 'color',
  };

  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    const row: ImportRow = { code: '', name: '' };

    headers.forEach((header, index) => {
      const fieldName = headerMap[header];
      if (fieldName && values[index] !== undefined) {
        (row as unknown as Record<string, unknown>)[fieldName] = values[index].replace(/^"|"$/g, '').trim();
      }
    });

    if (row.code && row.name) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  const lower = String(value).toLowerCase();
  return lower === 'true' || lower === 'jah' || lower === 'yes' || lower === '1';
}
