/**
 * Ultra Tables - Database Status Checker
 *
 * This script checks the current state of the database:
 * - Lists executed migrations
 * - Shows table row counts
 * - Verifies database connection
 *
 * Usage: node scripts/db-status.js
 */

const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') })

async function checkStatus() {
  const { Client } = require('pg')

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL or DIRECT_URL not found in .env.local')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🔍 Checking database status...\n')

    // Check migrations
    try {
      const { rows: migrations } = await client.query(`
        SELECT name, executed_at
        FROM _migrations
        ORDER BY executed_at DESC
      `)

      console.log('✅ Executed migrations:')
      if (migrations.length === 0) {
        console.log('   No migrations executed yet')
      } else {
        migrations.forEach(m => {
          const date = new Date(m.executed_at).toLocaleString('et-EE')
          console.log(`   - ${m.name} (${date})`)
        })
      }
    } catch (error) {
      console.log('❌ Migrations table not found. Run migrations first.')
    }

    console.log('\n📊 Table counts:')

    // Check main tables
    const tables = [
      'ultra_tables',
      'ultra_columns',
      'ultra_views',
      'ultra_records',
      'file_vault_folders',
      'file_vault_files',
      'tenants',
      'profiles'
    ]

    for (const table of tables) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`   - ${table}: ${rows[0].count} rows`)
      } catch (error) {
        console.log(`   - ${table}: ⚠️  table not found`)
      }
    }

    console.log('\n✅ Database connection is working!')

  } catch (error) {
    console.error('❌ Database check failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

checkStatus()
