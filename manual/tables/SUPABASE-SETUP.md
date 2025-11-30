# Supabase Automaatne Setup - Claude Code'le

## 🎯 EESMÄRK

Claude Code käivitab kõik migration'id ja setup'ib Supabase'i ILMA kasutaja sekkumiseta.

## 📋 EELDUSED (Kasutaja teeb korra alguses)

### 1. Supabase Projekt Olemas

Sa pead omama Supabase projekti. Kui pole:
1. Mine https://supabase.com
2. Loo uus projekt
3. Kopeeri järgmised väärtused:

```bash
Project URL:     https://xxxxxxxxxxxxx.supabase.co
API Key (anon):  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Database URL:    postgresql://postgres.[ref]:[password]@...
```

### 2. .env.local Fail Projekti Juurkaustas

```bash
# /apps/web/.env.local

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (for migrations)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 3. Supabase CLI Install (Projektis)

Lisa `package.json` faili:

```json
{
  "scripts": {
    "db:migrate": "node scripts/migrate.js",
    "db:reset": "node scripts/reset-db.js",
    "db:status": "node scripts/db-status.js"
  },
  "devDependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1"
  }
}
```

## 🚀 AUTOMAATNE MIGRATION SCRIPT

### 1. Migration Runner Script

```javascript
// /scripts/migrate.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n')

  // Get all migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`📁 Found ${files.length} migration files\n`)

  // Create migrations tracking table if not exists
  const trackingTableSQL = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  
  const { error: trackingError } = await supabase.rpc('exec_sql', {
    sql: trackingTableSQL
  })

  if (trackingError) {
    // Try alternative method
    await executeSQL(trackingTableSQL)
  }

  // Get already executed migrations
  const { data: executed } = await supabase
    .from('_migrations')
    .select('name')

  const executedNames = new Set((executed || []).map(m => m.name))

  // Run pending migrations
  for (const file of files) {
    if (executedNames.has(file)) {
      console.log(`⏭️  Skipping ${file} (already executed)`)
      continue
    }

    console.log(`▶️  Running ${file}...`)

    const sql = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf8'
    )

    try {
      await executeSQL(sql)
      
      // Record migration
      await supabase
        .from('_migrations')
        .insert({ name: file })

      console.log(`✅ ${file} completed\n`)
    } catch (error) {
      console.error(`❌ ${file} failed:`, error.message)
      process.exit(1)
    }
  }

  console.log('🎉 All migrations completed successfully!')
}

async function executeSQL(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (!statement) continue

    // Execute via RPC or direct query
    const { error } = await supabase.rpc('exec_sql', {
      sql: statement + ';'
    })

    if (error) {
      // Try alternative method using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      })

      if (!response.ok) {
        throw new Error(`SQL execution failed: ${statement.substring(0, 100)}...`)
      }
    }
  }
}

runMigrations().catch(console.error)
```

### 2. Database Status Checker

```javascript
// /scripts/db-status.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStatus() {
  console.log('🔍 Checking database status...\n')

  // Check migrations
  const { data: migrations, error } = await supabase
    .from('_migrations')
    .select('name, executed_at')
    .order('executed_at', { ascending: false })

  if (error) {
    console.log('❌ Migrations table not found. Run migrations first.')
    return
  }

  console.log('✅ Executed migrations:')
  migrations.forEach(m => {
    const date = new Date(m.executed_at).toLocaleString()
    console.log(`   - ${m.name} (${date})`)
  })

  console.log('\n📊 Table counts:')

  // Check main tables
  const tables = [
    'ultra_tables',
    'ultra_columns', 
    'ultra_views',
    'ultra_records',
    'file_vault_folders',
    'file_vault_files'
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (!error) {
      console.log(`   - ${table}: ${count} rows`)
    }
  }

  console.log('\n✅ Database is ready!')
}

checkStatus().catch(console.error)
```

### 3. SQL Execution Function (Supabase'is)

```sql
-- Käivita see KORRA Supabase SQL Editor'is (kasutaja teeb)
-- VÕI lisa 000_setup.sql migration'i

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
```

## 📝 CLAUDE CODE JUHISED

### Variant A: Kõige Lihtsam (Supabase UI)

**Kasutaja teeb korra:**
1. Mine Supabase Dashboard → SQL Editor
2. Käivita `000_setup.sql`:

```sql
-- /supabase/migrations/000_setup.sql

-- Migration tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- SQL execution function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
```

**Claude Code saab nüüd:**
```bash
# Install dependencies
pnpm install

# Run all migrations automatically
pnpm db:migrate

# Check status
pnpm db:status
```

### Variant B: Täielik Automaatika (PostgreSQL Client)

```javascript
// /scripts/migrate-direct.js

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  })

  await client.connect()
  console.log('🔗 Connected to database\n')

  // Create tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Get executed migrations
  const { rows: executed } = await client.query(
    'SELECT name FROM _migrations'
  )
  const executedNames = new Set(executed.map(m => m.name))

  // Run pending migrations
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (file === '000_setup.sql') continue // Skip setup
    
    if (executedNames.has(file)) {
      console.log(`⏭️  Skipping ${file}`)
      continue
    }

    console.log(`▶️  Running ${file}...`)

    const sql = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf8'
    )

    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(
        'INSERT INTO _migrations (name) VALUES ($1)',
        [file]
      )
      await client.query('COMMIT')
      console.log(`✅ ${file} completed\n`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`❌ ${file} failed:`, error.message)
      throw error
    }
  }

  await client.end()
  console.log('🎉 All migrations completed!')
}

runMigrations().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

**Package.json:**
```json
{
  "devDependencies": {
    "pg": "^8.11.3"
  }
}
```

## 🎯 CLAUDE CODE WORKFLOW

### Samm 1: Install
```bash
pnpm install
```

### Samm 2: Run Migrations
```bash
# Variant A (kui exec_sql olemas)
pnpm db:migrate

# Variant B (direct PostgreSQL)
node scripts/migrate-direct.js
```

### Samm 3: Verify
```bash
pnpm db:status
```

## ✅ KASUTAJA CHECKLIST (ühekordsed tegevused)

- [ ] Loo Supabase projekt
- [ ] Kopeeri credentials `.env.local` faili
- [ ] Käivita `000_setup.sql` Supabase SQL Editor'is (Variant A)
- [ ] VÕI installi `pg` dependency (Variant B)
- [ ] Commit `.env.local.example` Git'i (ilma tegelike väärtusteta)

## 📦 .env.local.example (Git'i)

```bash
# Supabase Configuration
# Get these from https://supabase.com/dashboard/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URLs
# Get from https://supabase.com/dashboard/project/_/settings/database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@...
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@...
```

## 🚀 CLAUDE CODE JUHISED (TÄPSED)

```
Tere Claude Code!

Implementeeri Ultra Tables süsteem järgides manual/tables/ juhendeid.

OLULINE - Database Setup:
1. Kontrolli, et .env.local fail eksisteerib ja sisaldab Supabase credentials
2. Install dependencies: pnpm install
3. Run migrations: pnpm db:migrate (või node scripts/migrate-direct.js)
4. Verify: pnpm db:status
5. Kui migration'id ebaõnnestuvad, kasuta Variant B (migrate-direct.js)

Alusta implementeerimist!
```

## 🔧 TROUBLESHOOTING

### Error: "exec_sql function not found"
**Lahendus:** Kasutaja peab käivitama `000_setup.sql` Supabase UI's

VÕI

**Lahendus:** Kasuta Variant B (migrate-direct.js) mis ei vaja exec_sql funktsiooni

### Error: "Connection refused"
**Lahendus:** Kontrolli DATABASE_URL ja DIRECT_URL väärtusi

### Error: "Permission denied"
**Lahendus:** Kasuta SUPABASE_SERVICE_ROLE_KEY, mitte ANON_KEY

## 🎉 TULEMUS

Pärast setup'i:
- ✅ Claude Code käivitab kõik migration'id automaatselt
- ✅ Kasutaja ei pea Supabase UI'd puudutama
- ✅ Kõik käib läbi script'ide
- ✅ Migration tracking töötab
- ✅ Rollback support olemas

**Claude Code saab 100% iseseisvalt töötada!** 🚀
