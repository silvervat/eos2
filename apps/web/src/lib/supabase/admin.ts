// Supabase Admin Client - Server-side only!
// Uses service_role key for elevated privileges
// NEVER import this in client components!

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized admin client to avoid build errors when env vars are not set
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Get the Supabase admin client (lazy initialization)
 * Throws at runtime if env vars are missing, but not at build time
 */
function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabaseAdmin
}

// Export as a getter to ensure lazy initialization
// Admin client bypasses RLS - use with caution!
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Helper to check if we're on server
export function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server!')
  }
}
