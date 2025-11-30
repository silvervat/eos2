import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/warehouse/transfers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(`
        *,
        asset:assets(*),
        from_warehouse:warehouses!from_warehouse_id(*),
        to_warehouse:warehouses!to_warehouse_id(*),
        from_user:user_profiles!from_user_id(id, full_name, email),
        to_user:user_profiles!to_user_id(id, full_name, email),
        from_project:projects!from_project_id(id, name, code),
        to_project:projects!to_project_id(id, name, code),
        requested_by:user_profiles!requested_by_user_id(id, full_name),
        approved_by:user_profiles!approved_by_user_id(id, full_name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/transfers/[id] - Cancel transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_transfers')
      .update({
        status: 'cancelled',
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
