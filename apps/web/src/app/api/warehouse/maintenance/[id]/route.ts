import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  maintenance_type: z.enum(['routine', 'repair', 'inspection', 'calibration', 'certification']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue']).optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  due_date: z.string().optional(),
  performed_by_user_id: z.string().uuid().optional().nullable(),
  performed_by_company: z.string().optional().nullable(),
  description: z.string().optional(),
  work_performed: z.string().optional(),
  parts_replaced: z.string().optional(),
  issues_found: z.string().optional(),
  recommendations: z.string().optional(),
  cost: z.number().optional(),
  labor_cost: z.number().optional(),
  parts_cost: z.number().optional(),
  external_service_cost: z.number().optional(),
  other_costs: z.number().optional(),
  invoice_number: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  next_maintenance_type: z.string().optional(),
});

// GET /api/warehouse/maintenance/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_maintenances')
      .select(`
        *,
        asset:assets(id, name, asset_code, status, current_warehouse_id),
        performed_by:user_profiles!performed_by_user_id(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/warehouse/maintenance/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate total cost if any cost field is provided
    let total_cost;
    if (validated.labor_cost !== undefined || validated.parts_cost !== undefined ||
        validated.external_service_cost !== undefined || validated.other_costs !== undefined) {
      total_cost = (validated.labor_cost || 0) +
                   (validated.parts_cost || 0) +
                   (validated.external_service_cost || 0) +
                   (validated.other_costs || 0);
    }

    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    if (total_cost !== undefined) {
      updateData.total_cost = total_cost;
    }

    // If completing, update asset's next_maintenance_date
    if (validated.status === 'completed' && validated.next_maintenance_date) {
      const { data: maintenance } = await supabase
        .from('asset_maintenances')
        .select('asset_id')
        .eq('id', id)
        .single();

      if (maintenance) {
        await supabase
          .from('assets')
          .update({
            last_maintenance_date: validated.completed_date || new Date().toISOString(),
            next_maintenance_date: validated.next_maintenance_date,
          })
          .eq('id', maintenance.asset_id);
      }
    }

    const { data, error } = await supabase
      .from('asset_maintenances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/maintenance/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete
    const { error } = await supabase
      .from('asset_maintenances')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
