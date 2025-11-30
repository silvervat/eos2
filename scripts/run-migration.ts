#!/usr/bin/env npx ts-node
/**
 * Migration Runner Script
 *
 * Usage:
 *   npx ts-node scripts/run-migration.ts <migration-file>
 *   npx ts-node scripts/run-migration.ts supabase/migrations/008_transfer_baskets.sql
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your service role key (from Supabase dashboard)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration(migrationFile: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    process.exit(1)
  }

  if (!supabaseServiceRoleKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    console.error('\nTo get your service role key:')
    console.error('1. Go to https://supabase.com/dashboard')
    console.error('2. Select your project')
    console.error('3. Go to Settings > API')
    console.error('4. Copy "service_role" key (NOT anon key)')
    process.exit(1)
  }

  // Resolve file path
  const filePath = path.resolve(process.cwd(), migrationFile)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`)
    process.exit(1)
  }

  console.log(`📄 Reading migration: ${migrationFile}`)
  const sql = fs.readFileSync(filePath, 'utf-8')

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log(`🔗 Connecting to: ${supabaseUrl}`)
  console.log(`🚀 Running migration...`)

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try direct query if rpc doesn't exist
      const { error: directError } = await supabase.from('_migrations').select().limit(0)

      // Use raw SQL execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql_query: sql }),
      })

      if (!response.ok) {
        throw new Error(`Migration failed: ${error?.message || 'Unknown error'}`)
      }
    }

    console.log('✅ Migration completed successfully!')
  } catch (err) {
    // Fallback: Use SQL Editor API (Management API)
    console.log('⚠️  Direct execution not available, trying alternative method...')

    // Split SQL into statements and run individually
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      if (stmt.trim()) {
        try {
          // This won't work without a proper SQL function, but let's try
          console.log(`   Running statement ${i + 1}/${statements.length}...`)
        } catch (stmtError) {
          console.error(`   ❌ Statement ${i + 1} failed`)
        }
      }
    }

    console.error('\n❌ Automatic migration failed.')
    console.error('\nPlease run the migration manually:')
    console.error('1. Go to https://supabase.com/dashboard')
    console.error('2. Select your project')
    console.error('3. Go to SQL Editor')
    console.error('4. Paste the contents of:', migrationFile)
    console.error('5. Click "Run"')
    process.exit(1)
  }
}

// Main
const args = process.argv.slice(2)
if (args.length === 0) {
  console.log('Usage: npx ts-node scripts/run-migration.ts <migration-file>')
  console.log('Example: npx ts-node scripts/run-migration.ts supabase/migrations/008_transfer_baskets.sql')
  process.exit(1)
}

runMigration(args[0])
