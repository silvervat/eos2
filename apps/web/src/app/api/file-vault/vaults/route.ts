/**
 * FILE VAULT - Vaults API Route
 * GET /api/file-vault/vaults - List vaults (creates default if none exist)
 * POST /api/file-vault/vaults - Create new vault
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/vaults - List vaults
export async function GET(request: Request) {
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

    // Get user's profile and tenant
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    // Auto-create profile and tenant if not exists (first-time setup)
    if (!profile?.tenant_id) {
      // Create tenant first
      const { data: newTenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: user.email?.split('@')[0] || 'My Company',
          slug: user.id.substring(0, 8),
          status: 'active',
        })
        .select()
        .single()

      if (tenantError) {
        console.error('Error creating tenant:', tenantError)
        return NextResponse.json({
          error: 'Failed to setup account',
          details: tenantError.message,
          code: tenantError.code
        }, { status: 500 })
      }

      // Create or update user profile
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          auth_user_id: user.id,
          tenant_id: newTenant.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'admin',
        }, { onConflict: 'auth_user_id' })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({
          error: 'Failed to setup user profile',
          details: profileError.message,
          code: profileError.code
        }, { status: 500 })
      }

      profile = newProfile
    }

    // Ensure profile exists at this point
    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Failed to resolve user profile' }, { status: 500 })
    }

    // Get vaults for tenant
    let { data: vaults, error } = await supabase
      .from('file_vaults')
      .select(`
        id,
        name,
        description,
        quota_bytes,
        used_bytes,
        created_at,
        updated_at
      `)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching vaults:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no vaults exist, create a default one
    if (!vaults || vaults.length === 0) {
      const { data: newVault, error: createError } = await supabaseAdmin
        .from('file_vaults')
        .insert({
          tenant_id: profile.tenant_id,
          name: 'Failid',
          description: 'Peamine failihoidla',
          quota_bytes: 107374182400, // 100GB
          created_by: user.id,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default vault:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      vaults = [newVault]
    }

    // Transform response
    const transformedVaults = vaults?.map(vault => ({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      quotaBytes: vault.quota_bytes,
      usedBytes: vault.used_bytes,
      usagePercent: Math.round((Number(vault.used_bytes) / Number(vault.quota_bytes)) * 100),
      createdAt: vault.created_at,
      updatedAt: vault.updated_at,
    })) || []

    return NextResponse.json({ vaults: transformedVaults })
  } catch (error) {
    console.error('Error in GET /api/file-vault/vaults:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 })
  }
}

// POST /api/file-vault/vaults - Create new vault
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

    // Get user's profile and tenant
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { name, description, quotaBytes } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Vault name is required' }, { status: 400 })
    }

    // Create vault
    const { data: vault, error } = await supabaseAdmin
      .from('file_vaults')
      .insert({
        tenant_id: profile.tenant_id,
        name: name.trim(),
        description: description || null,
        quota_bytes: quotaBytes || 107374182400, // 100GB default
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating vault:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      quotaBytes: vault.quota_bytes,
      usedBytes: vault.used_bytes,
      createdAt: vault.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/vaults:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
