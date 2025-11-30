import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const photoSchema = z.object({
  file_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  photo_type: z.enum(['general', 'check_in', 'check_out', 'damage', 'repair', 'maintenance']).default('general'),
  category: z.enum(['before', 'after', 'damage', 'current']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  is_primary: z.boolean().default(false),
  location_id: z.string().uuid().optional(),
  transfer_id: z.string().uuid().optional(),
});

// GET /api/warehouse/assets/[id]/photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_photos')
      .select(`
        *,
        taken_by:user_profiles(id, full_name)
      `)
      .eq('asset_id', id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/assets/[id]/photos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = photoSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    // If setting as primary, unset other primaries
    if (validated.is_primary) {
      await supabase
        .from('asset_photos')
        .update({ is_primary: false })
        .eq('asset_id', id);
    }

    const { data, error } = await supabase
      .from('asset_photos')
      .insert({
        ...validated,
        tenant_id: profile?.tenant_id,
        asset_id: id,
        taken_by_user_id: profile?.id,
        taken_at: new Date().toISOString(),
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
