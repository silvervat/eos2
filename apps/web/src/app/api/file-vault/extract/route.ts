/**
 * FILE TEXT EXTRACTION API
 * POST /api/file-vault/extract - Extract text from a file (for search indexing)
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import {
  extractText,
  supportsTextExtraction,
  supportsOcr,
} from '@/lib/file-vault/extraction/text-extractor'

export const maxDuration = 60 // Allow up to 60 seconds for OCR

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, enableOcr = false } = body

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, name, mime_type, storage_key, vault_id, extracted_text')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if extraction is supported
    const canExtract = supportsTextExtraction(file.mime_type)
    const canOcr = enableOcr && supportsOcr(file.mime_type)

    if (!canExtract && !canOcr) {
      return NextResponse.json({
        message: 'File type does not support text extraction',
        extracted: false,
      })
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('file-vault')
      .download(file.storage_key)

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text
    const extractedText = await extractText(buffer, file.mime_type, {
      enableOcr,
      maxLength: 100000, // 100KB max text
    })

    if (!extractedText) {
      return NextResponse.json({
        message: 'No text could be extracted',
        extracted: false,
      })
    }

    // Update file record with extracted text
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({
        extracted_text: extractedText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)

    if (updateError) {
      console.error('Error updating file:', updateError)
      return NextResponse.json({ error: 'Failed to save extracted text' }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_accesses').insert({
      file_id: fileId,
      action: enableOcr ? 'ocr_extract' : 'text_extract',
      user_id: user.id,
      details: { text_length: extractedText.length },
    })

    return NextResponse.json({
      message: 'Text extracted successfully',
      extracted: true,
      textLength: extractedText.length,
      preview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
    })
  } catch (error) {
    console.error('Error in POST /api/file-vault/extract:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
