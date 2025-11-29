// Supabase Admin Client - Server-side only!
// Uses service_role key for elevated privileges
// NEVER import this in client components!

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

// Admin client bypasses RLS - use with caution!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper to check if we're on server
export function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server!')
  }
}
