import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/warehouse/transfers/[id]/attachments - List attachments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transferId } = await params;
    const supabase = await createClient();

    const { data: attachments, error } = await supabase
      .from('transfer_attachments')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate signed URLs for files
    const attachmentsWithUrls = await Promise.all(
      (attachments || []).map(async (attachment) => {
        const { data: urlData } = await supabase.storage
          .from('transfers')
          .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry

        return {
          ...attachment,
          url: urlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ data: attachmentsWithUrls });
  } catch (error) {
    console.error('Attachments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/warehouse/transfers/[id]/attachments - Upload attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transferId } = await params;
    const supabase = await createClient();

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

    // Verify transfer exists and belongs to tenant
    const { data: transfer } = await supabase
      .from('asset_transfers')
      .select('id')
      .eq('id', transferId)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const isPhoto = formData.get('isPhoto') === 'true';
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${profile.tenant_id}/${transferId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('transfers')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('transfer_attachments')
      .insert({
        tenant_id: profile.tenant_id,
        transfer_id: transferId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        is_photo: isPhoto,
        caption: caption || null,
        uploaded_by: profile.id,
      })
      .select()
      .single();

    if (dbError) {
      // Try to clean up uploaded file
      await supabase.storage.from('transfers').remove([storagePath]);
      console.error('DB error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Get signed URL for response
    const { data: urlData } = await supabase.storage
      .from('transfers')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      data: {
        ...attachment,
        url: urlData?.signedUrl || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/transfers/[id]/attachments - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transferId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId } = await request.json();

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    // Get attachment to find storage path
    const { data: attachment } = await supabase
      .from('transfer_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .eq('transfer_id', transferId)
      .single();

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage
      .from('transfers')
      .remove([attachment.storage_path]);

    // Delete from database
    const { error } = await supabase
      .from('transfer_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
