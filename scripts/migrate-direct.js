/**
 * Ultra Tables - Direct PostgreSQL Migration Script
 *
 * This script connects directly to PostgreSQL and runs all pending migrations.
 * It doesn't require the exec_sql function to be set up in Supabase.
 *
 * Usage: node scripts/migrate-direct.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') })

// Dynamic import for pg (ESM compatibility)
async function runMigrations() {
  const { Client } = require('pg')

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL or DIRECT_URL not found in .env.local')
    console.error('   Please add your Supabase database connection string.')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database\n')

    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // Get already executed migrations
    const { rows: executed } = await client.query('SELECT name FROM _migrations')
    const executedNames = new Set(executed.map(m => m.name))
    console.log(`📋 Found ${executedNames.size} executed migrations\n`)

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations')

    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Migrations directory not found:', migrationsDir)
      process.exit(1)
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`📁 Found ${files.length} migration files\n`)

    let migrationsRun = 0

    // Run pending migrations
    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`)
        continue
      }

      console.log(`▶️  Running ${file}...`)

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`✅ ${file} completed\n`)
        migrationsRun++
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`❌ ${file} failed:`, error.message)
        console.error('\n   Error details:', error.detail || 'No additional details')
        throw error
      }
    }

    if (migrationsRun === 0) {
      console.log('✨ All migrations are already up to date!')
    } else {
      console.log(`🎉 Successfully ran ${migrationsRun} migration(s)!`)
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
