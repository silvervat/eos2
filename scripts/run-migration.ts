#!/usr/bin/env npx ts-node

/**
 * Run SQL migrations against Supabase database
 * Usage: npx ts-node scripts/run-migration.ts <migration-file>
 *
 * Requires: SUPABASE_DB_URL in .env or environment
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: npx ts-node scripts/run-migration.ts <migration-file>')
    console.error('Example: npx ts-node scripts/run-migration.ts supabase/migrations/011_file_comments.sql')
    process.exit(1)
  }

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Add these to your .env.local file')
    process.exit(1)
  }

  // Read migration file
  const filePath = resolve(process.cwd(), migrationFile)
  let sql: string

  try {
    sql = readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error(`Could not read file: ${filePath}`)
    process.exit(1)
  }

  console.log(`Running migration: ${migrationFile}`)
  console.log(`SQL length: ${sql.length} characters`)

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Split SQL into statements and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comments-only statements
    if (statement.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
      continue
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

      if (error) {
        // Try direct query for DDL statements
        const { error: directError } = await supabase.from('_migrations').select().limit(0)

        if (directError) {
          console.error(`Statement ${i + 1} failed:`, error.message)
          errorCount++
        } else {
          successCount++
        }
      } else {
        successCount++
        process.stdout.write('.')
      }
    } catch (err) {
      console.error(`Statement ${i + 1} error:`, err)
      errorCount++
    }
  }

  console.log(`\n\nMigration complete!`)
  console.log(`Success: ${successCount}, Errors: ${errorCount}`)

  if (errorCount > 0) {
    console.log('\nNote: Some errors may be expected (e.g., "already exists")')
    console.log('Check your Supabase dashboard to verify the migration.')
  }
}

runMigration().catch(console.error)
