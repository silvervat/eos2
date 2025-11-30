import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const warehouseSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1),
  type: z.enum(['main', 'mobile', 'external', 'vehicle']).default('main'),
  location: z.string().optional(),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional(),
  capacity_m3: z.number().optional(),
  temperature_controlled: z.boolean().optional(),
  security_level: z.enum(['low', 'standard', 'high', 'maximum']).default('standard'),
  notes: z.string().optional(),
});

// GET /api/warehouse/warehouses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('warehouses')
      .select(`
        *,
        manager:user_profiles(id, full_name, email)
      `)
      .is('deleted_at', null);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query.order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/warehouses
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = warehouseSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        ...validated,
        tenant_id: profile.tenant_id,
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
