import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const transferSchema = z.object({
  asset_id: z.string().uuid(),
  quantity: z.number().positive().default(1),
  transfer_type: z.enum(['warehouse', 'user', 'project', 'rental_out', 'rental_return']),
  from_warehouse_id: z.string().uuid().optional(),
  to_warehouse_id: z.string().uuid().optional(),
  from_user_id: z.string().uuid().optional(),
  to_user_id: z.string().uuid().optional(),
  from_project_id: z.string().uuid().optional(),
  to_project_id: z.string().uuid().optional(),
  expected_return_date: z.string().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

// GET /api/warehouse/transfers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const transfer_type = searchParams.get('transfer_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('asset_transfers')
      .select(`
        *,
        asset:assets(id, name, asset_code, status),
        from_warehouse:warehouses!from_warehouse_id(id, name),
        to_warehouse:warehouses!to_warehouse_id(id, name),
        from_user:user_profiles!from_user_id(id, full_name),
        to_user:user_profiles!to_user_id(id, full_name),
        requested_by:user_profiles!requested_by_user_id(id, full_name)
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (status) query = query.eq('status', status);
    if (transfer_type) query = query.eq('transfer_type', transfer_type);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query.order('created_at', { ascending: false });

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

// POST /api/warehouse/transfers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = transferSchema.parse(body);

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

    const { data, error } = await supabase
      .from('asset_transfers')
      .insert({
        ...validated,
        tenant_id: profile.tenant_id,
        requested_by_user_id: profile.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
