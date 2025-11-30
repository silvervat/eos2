import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const completeSchema = z.object({
  check_in_photos: z.array(z.string()).optional(),
  condition_after: z.string().optional(),
});

// POST /api/warehouse/transfers/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = completeSchema.parse(body);

    // Get transfer details
    const { data: transfer, error: transferError } = await supabase
      .from('asset_transfers')
      .select('*, asset:assets(*)')
      .eq('id', id)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Update transfer
    const { data, error } = await supabase
      .from('asset_transfers')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        check_in_photos: validated.check_in_photos,
        condition_after: validated.condition_after,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update asset location
    const assetUpdate: Record<string, any> = {};

    if (transfer.to_warehouse_id) {
      assetUpdate.current_warehouse_id = transfer.to_warehouse_id;
    }
    if (transfer.to_user_id) {
      assetUpdate.assigned_to_user_id = transfer.to_user_id;
      assetUpdate.assigned_at = new Date().toISOString();
      assetUpdate.status = 'in_use';
    }
    if (transfer.to_project_id) {
      assetUpdate.assigned_to_project_id = transfer.to_project_id;
      assetUpdate.assigned_at = new Date().toISOString();
      assetUpdate.status = 'in_use';
    }

    if (Object.keys(assetUpdate).length > 0) {
      await supabase
        .from('assets')
        .update(assetUpdate)
        .eq('id', transfer.asset_id);
    }

    // Record stock movement for consumables
    if (transfer.asset?.is_consumable) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, tenant_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile) {
        await supabase.from('stock_movements').insert({
          tenant_id: profile.tenant_id,
          asset_id: transfer.asset_id,
          warehouse_id: transfer.to_warehouse_id || transfer.from_warehouse_id,
          movement_type: 'transfer',
          quantity: transfer.quantity,
          reference_type: 'transfer',
          reference_id: transfer.id,
          user_id: profile.id,
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
