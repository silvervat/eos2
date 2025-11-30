import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const assetSchema = z.object({
  category_id: z.string().uuid().optional(),
  asset_code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['asset', 'consumable', 'tool']).default('asset'),
  current_warehouse_id: z.string().uuid().optional(),
  current_location_id: z.string().uuid().optional(),
  is_consumable: z.boolean().default(false),
  quantity_available: z.number().default(0),
  quantity_unit: z.string().default('tk'),
  min_quantity: z.number().optional(),
  max_quantity: z.number().optional(),
  reorder_point: z.number().optional(),
  purchase_price: z.number().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/warehouse/assets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const warehouse_id = searchParams.get('warehouse_id');
    const category_id = searchParams.get('category_id');
    const status = searchParams.get('status');
    const is_consumable = searchParams.get('is_consumable');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(id, name, path),
        warehouse:warehouses(id, name, code),
        assigned_user:user_profiles(id, full_name, email)
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,asset_code.ilike.%${search}%,serial_number.ilike.%${search}%,manufacturer.ilike.%${search}%`);
    }

    if (warehouse_id) query = query.eq('current_warehouse_id', warehouse_id);
    if (category_id) query = query.eq('category_id', category_id);
    if (status) query = query.eq('status', status);
    if (is_consumable !== null && is_consumable !== undefined) {
      query = query.eq('is_consumable', is_consumable === 'true');
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query.order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/assets
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = assetSchema.parse(body);

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

    // Generate QR code
    const qrCode = `ASSET-${validated.asset_code}`;

    const { data, error } = await supabase
      .from('assets')
      .insert({
        ...validated,
        tenant_id: profile.tenant_id,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create initial stock movement if consumable
    if (validated.is_consumable && validated.quantity_available && validated.quantity_available > 0) {
      await supabase.from('stock_movements').insert({
        tenant_id: profile.tenant_id,
        asset_id: data.id,
        warehouse_id: validated.current_warehouse_id,
        movement_type: 'in',
        quantity: validated.quantity_available,
        quantity_before: 0,
        quantity_after: validated.quantity_available,
        reference_type: 'initial',
        user_id: profile.id,
        reason: 'Esialgne laoseis'
      });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
