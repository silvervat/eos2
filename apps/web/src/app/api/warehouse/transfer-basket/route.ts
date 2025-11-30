import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for basket item
const basketItemSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  qrCode: z.string(),
  currentWarehouse: z.string().optional(),
  currentStock: z.number().default(0),
  requestedQuantity: z.number().positive().default(1),
  availableQuantity: z.number().default(0),
  thumbnailUrl: z.string().optional(),
  isValid: z.boolean().default(true),
  warnings: z.array(z.string()).default([]),
});

// Schema for creating a new basket
const createBasketSchema = z.object({
  from_warehouse_id: z.string().uuid().optional(),
  to_project_id: z.string().optional(), // TEXT type in DB
  to_warehouse_id: z.string().uuid().optional(),
  to_user_id: z.string().uuid().optional(),
  items: z.array(basketItemSchema).default([]),
  notes: z.string().optional(),
});

// Schema for updating an existing basket
const updateBasketSchema = z.object({
  from_warehouse_id: z.string().uuid().optional(),
  to_project_id: z.string().optional(),
  to_warehouse_id: z.string().uuid().optional(),
  to_user_id: z.string().uuid().optional(),
  items: z.array(basketItemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending', 'cancelled']).optional(),
});

// GET /api/warehouse/transfer-basket
// Fetch user's transfer baskets with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('warehouse_transfer_baskets')
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name, code),
        to_project:projects!to_project_id(id, name, project_number),
        to_warehouse:warehouses!to_warehouse_id(id, name, code),
        to_user:user_profiles!to_user_id(id, full_name),
        created_by_user:user_profiles!created_by(id, full_name)
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transfer baskets:', error);
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
    console.error('Unexpected error in GET /transfer-basket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/transfer-basket
// Create a new transfer basket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const validated = createBasketSchema.parse(body);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate destination - at least one must be specified
    if (!validated.to_project_id && !validated.to_warehouse_id && !validated.to_user_id) {
      return NextResponse.json(
        { error: 'At least one destination (project, warehouse, or user) must be specified' },
        { status: 400 }
      );
    }

    // Create the basket
    const { data, error } = await supabase
      .from('warehouse_transfer_baskets')
      .insert({
        tenant_id: profile.tenant_id,
        from_warehouse_id: validated.from_warehouse_id,
        to_project_id: validated.to_project_id,
        to_warehouse_id: validated.to_warehouse_id,
        to_user_id: validated.to_user_id,
        items: validated.items,
        notes: validated.notes,
        created_by: profile.id,
        status: 'draft',
      })
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name, code),
        to_project:projects!to_project_id(id, name, project_number),
        to_warehouse:warehouses!to_warehouse_id(id, name, code),
        to_user:user_profiles!to_user_id(id, full_name)
      `)
      .single();

    if (error) {
      console.error('Error creating transfer basket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in POST /transfer-basket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/warehouse/transfer-basket
// Update an existing basket (by id in body)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Basket ID is required' }, { status: 400 });
    }

    const validated = updateBasketSchema.parse(updateData);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the basket
    const { data, error } = await supabase
      .from('warehouse_transfer_baskets')
      .update(validated)
      .eq('id', id)
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name, code),
        to_project:projects!to_project_id(id, name, project_number),
        to_warehouse:warehouses!to_warehouse_id(id, name, code),
        to_user:user_profiles!to_user_id(id, full_name)
      `)
      .single();

    if (error) {
      console.error('Error updating transfer basket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Basket not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error in PATCH /transfer-basket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
