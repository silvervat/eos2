// =============================================
// WAREHOUSE MANAGEMENT - API ROUTES NÄITED
// =============================================
// Kaust: apps/web/src/app/api/warehouse/

// =============================================
// 1. WAREHOUSES API
// =============================================

// apps/web/src/app/api/warehouse/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const warehouseSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1),
  type: z.enum(['main', 'mobile', 'external', 'vehicle']),
  location: z.string().optional(),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional(),
  capacity_m3: z.number().optional(),
  temperature_controlled: z.boolean().optional(),
  security_level: z.enum(['low', 'standard', 'high', 'maximum']).optional(),
});

// GET /api/warehouse/warehouses
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  
  let query = supabase
    .from('warehouses')
    .select(`
      *,
      manager:user_profiles(id, full_name, email),
      _count:assets(count)
    `)
    .is('deleted_at', null);
  
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  
  const { data, error } = await query.order('name');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// POST /api/warehouse/warehouses
export async function POST(request: NextRequest) {
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
}

// apps/web/src/app/api/warehouse/warehouses/[id]/route.ts
// GET /api/warehouse/warehouses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select(`
      *,
      manager:user_profiles(id, full_name, email, avatar_url),
      assets(count)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  
  return NextResponse.json({ data });
}

// PUT /api/warehouse/warehouses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const body = await request.json();
  const validated = warehouseSchema.partial().parse(body);
  
  const { data, error } = await supabase
    .from('warehouses')
    .update(validated)
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// DELETE /api/warehouse/warehouses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // Soft delete
  const { data, error } = await supabase
    .from('warehouses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// apps/web/src/app/api/warehouse/warehouses/[id]/stats/route.ts
// GET /api/warehouse/warehouses/[id]/stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // Get warehouse stats
  const { data: stats, error } = await supabase.rpc('get_warehouse_stats', {
    warehouse_id: params.id
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: stats });
}

// =============================================
// 2. ASSETS API
// =============================================

// apps/web/src/app/api/warehouse/assets/route.ts
const assetSchema = z.object({
  category_id: z.string().uuid().optional(),
  asset_code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['asset', 'consumable', 'tool']),
  current_warehouse_id: z.string().uuid().optional(),
  is_consumable: z.boolean().optional(),
  quantity_available: z.number().optional(),
  min_quantity: z.number().optional(),
  max_quantity: z.number().optional(),
  purchase_price: z.number().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
});

// GET /api/warehouse/assets
export async function GET(request: NextRequest) {
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
      assigned_user:user_profiles(id, full_name, email),
      assigned_project:projects(id, name, code)
    `, { count: 'exact' })
    .is('deleted_at', null);
  
  // Filters
  if (search) {
    query = query.or(`
      name.ilike.%${search}%,
      asset_code.ilike.%${search}%,
      serial_number.ilike.%${search}%,
      manufacturer.ilike.%${search}%
    `);
  }
  
  if (warehouse_id) query = query.eq('current_warehouse_id', warehouse_id);
  if (category_id) query = query.eq('category_id', category_id);
  if (status) query = query.eq('status', status);
  if (is_consumable) query = query.eq('is_consumable', is_consumable === 'true');
  
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
      total: count,
      totalPages: Math.ceil(count / limit),
    }
  });
}

// POST /api/warehouse/assets
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const body = await request.json();
  const validated = assetSchema.parse(body);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single();
  
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
  if (validated.is_consumable && validated.quantity_available > 0) {
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
      reason: 'Initial stock'
    });
  }
  
  return NextResponse.json({ data }, { status: 201 });
}

// apps/web/src/app/api/warehouse/assets/[id]/route.ts
// GET /api/warehouse/assets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      category:asset_categories(*),
      warehouse:warehouses(*),
      assigned_user:user_profiles(id, full_name, email, avatar_url),
      assigned_project:projects(id, name, code, status),
      photos:asset_photos(*)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  
  return NextResponse.json({ data });
}

// apps/web/src/app/api/warehouse/assets/[id]/history/route.ts
// GET /api/warehouse/assets/[id]/history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // Get transfers
  const { data: transfers } = await supabase
    .from('asset_transfers')
    .select(`
      *,
      from_warehouse:warehouses!from_warehouse_id(name),
      to_warehouse:warehouses!to_warehouse_id(name),
      from_user:user_profiles!from_user_id(full_name),
      to_user:user_profiles!to_user_id(full_name),
      requested_by:user_profiles!requested_by_user_id(full_name)
    `)
    .eq('asset_id', params.id)
    .order('created_at', { ascending: false });
  
  // Get maintenances
  const { data: maintenances } = await supabase
    .from('asset_maintenances')
    .select(`
      *,
      performed_by:user_profiles(full_name)
    `)
    .eq('asset_id', params.id)
    .order('created_at', { ascending: false });
  
  // Get stock movements
  const { data: movements } = await supabase
    .from('stock_movements')
    .select(`
      *,
      warehouse:warehouses(name),
      user:user_profiles(full_name)
    `)
    .eq('asset_id', params.id)
    .order('created_at', { ascending: false });
  
  // Combine and sort by date
  const history = [
    ...transfers.map(t => ({ ...t, type: 'transfer' })),
    ...maintenances.map(m => ({ ...m, type: 'maintenance' })),
    ...movements.map(m => ({ ...m, type: 'movement' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return NextResponse.json({ data: history });
}

// apps/web/src/app/api/warehouse/assets/scan/route.ts
// POST /api/warehouse/assets/scan
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { code, type } = await request.json(); // type: 'qr' | 'barcode'
  
  let query = supabase
    .from('assets')
    .select(`
      *,
      category:asset_categories(name),
      warehouse:warehouses(name),
      assigned_user:user_profiles(full_name),
      assigned_project:projects(name)
    `)
    .is('deleted_at', null);
  
  if (type === 'qr') {
    query = query.eq('qr_code', code);
  } else {
    query = query.eq('barcode', code);
  }
  
  const { data, error } = await query.single();
  
  if (error || !data) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
  
  return NextResponse.json({ data });
}

// apps/web/src/app/api/warehouse/assets/low-stock/route.ts
// GET /api/warehouse/assets/low-stock
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      category:asset_categories(name),
      warehouse:warehouses(name)
    `)
    .eq('is_consumable', true)
    .is('deleted_at', null)
    .filter('quantity_available', 'lte', 'reorder_point')
    .order('quantity_available');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// =============================================
// 3. TRANSFERS API
// =============================================

// apps/web/src/app/api/warehouse/transfers/route.ts
const transferSchema = z.object({
  asset_id: z.string().uuid(),
  quantity: z.number().positive().optional(),
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

// POST /api/warehouse/transfers
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const body = await request.json();
  const validated = transferSchema.parse(body);
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .single();
  
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
}

// apps/web/src/app/api/warehouse/transfers/[id]/approve/route.ts
// POST /api/warehouse/transfers/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  
  const { data, error } = await supabase
    .from('asset_transfers')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_user_id: profile.id,
    })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// apps/web/src/app/api/warehouse/transfers/[id]/complete/route.ts
// POST /api/warehouse/transfers/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const { check_in_photos, condition_after } = await request.json();
  
  // Get transfer details
  const { data: transfer } = await supabase
    .from('asset_transfers')
    .select('*, asset:assets(*)')
    .eq('id', params.id)
    .single();
  
  // Update transfer
  const { data, error } = await supabase
    .from('asset_transfers')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      check_in_photos,
      condition_after,
    })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Update asset location
  await supabase
    .from('assets')
    .update({
      current_warehouse_id: transfer.to_warehouse_id,
      assigned_to_user_id: transfer.to_user_id,
      assigned_to_project_id: transfer.to_project_id,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', transfer.asset_id);
  
  // Record stock movement
  if (transfer.asset.is_consumable) {
    await supabase.from('stock_movements').insert({
      tenant_id: transfer.tenant_id,
      asset_id: transfer.asset_id,
      warehouse_id: transfer.to_warehouse_id,
      movement_type: 'transfer',
      quantity: transfer.quantity,
      reference_type: 'transfer',
      reference_id: transfer.id,
    });
  }
  
  return NextResponse.json({ data });
}

// =============================================
// 4. MAINTENANCE API
// =============================================

// apps/web/src/app/api/warehouse/maintenance/route.ts
const maintenanceSchema = z.object({
  asset_id: z.string().uuid(),
  maintenance_type: z.enum(['routine', 'repair', 'inspection', 'calibration', 'certification']),
  scheduled_date: z.string(),
  description: z.string().optional(),
  cost: z.number().optional(),
});

// POST /api/warehouse/maintenance
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const body = await request.json();
  const validated = maintenanceSchema.parse(body);
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single();
  
  const { data, error } = await supabase
    .from('asset_maintenances')
    .insert({
      ...validated,
      tenant_id: profile.tenant_id,
      status: 'scheduled',
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data }, { status: 201 });
}

// apps/web/src/app/api/warehouse/maintenance/upcoming/route.ts
// GET /api/warehouse/maintenance/upcoming
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const { data, error } = await supabase
    .from('asset_maintenances')
    .select(`
      *,
      asset:assets(id, name, asset_code, status),
      performed_by:user_profiles(full_name)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_date', new Date().toISOString().split('T')[0])
    .lte('scheduled_date', futureDate.toISOString().split('T')[0])
    .order('scheduled_date');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// =============================================
// END OF API EXAMPLES
// =============================================
