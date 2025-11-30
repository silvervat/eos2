import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const maintenanceSchema = z.object({
  asset_id: z.string().uuid(),
  maintenance_type: z.enum(['routine', 'repair', 'inspection', 'calibration', 'certification']),
  scheduled_date: z.string(),
  due_date: z.string().optional(),
  performed_by_user_id: z.string().uuid().optional(),
  performed_by_company: z.string().optional(),
  description: z.string().optional(),
  cost: z.number().optional(),
  labor_cost: z.number().optional(),
  parts_cost: z.number().optional(),
  external_service_cost: z.number().optional(),
});

// GET /api/warehouse/maintenance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const maintenance_type = searchParams.get('maintenance_type');
    const asset_id = searchParams.get('asset_id');
    const upcoming = searchParams.get('upcoming');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('asset_maintenances')
      .select(`
        *,
        asset:assets(id, name, asset_code, status, current_warehouse_id),
        performed_by:user_profiles!performed_by_user_id(id, full_name)
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (status) {
      query = query.eq('status', status);
    }

    if (maintenance_type) {
      query = query.eq('maintenance_type', maintenance_type);
    }

    if (asset_id) {
      query = query.eq('asset_id', asset_id);
    }

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query
        .gte('scheduled_date', today)
        .lte('scheduled_date', thirtyDaysLater)
        .in('status', ['scheduled', 'overdue']);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Maintenance API error:', error);
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
    console.error('Maintenance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/maintenance
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = maintenanceSchema.parse(body);

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

    // Calculate total cost
    const total_cost = (validated.labor_cost || 0) +
                       (validated.parts_cost || 0) +
                       (validated.external_service_cost || 0) +
                       (validated.cost || 0);

    const { data, error } = await supabase
      .from('asset_maintenances')
      .insert({
        ...validated,
        tenant_id: profile.tenant_id,
        status: 'scheduled',
        total_cost,
      })
      .select()
      .single();

    if (error) {
      console.error('Maintenance creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Maintenance creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
