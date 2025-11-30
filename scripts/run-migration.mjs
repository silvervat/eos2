#!/usr/bin/env node
/**
 * File Vault Migration Script
 * Runs the database migration via Supabase REST API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://cohhjvtmmchrttntoizw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function runSQL(sql) {
  // Use Supabase's pg_query or direct execution
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Starting File Vault migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '007_file_vault_system.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('📊 Executing SQL...\n');

  try {
    await runSQL(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run the SQL manually in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/cohhjvtmmchrttntoizw/sql/new');
    process.exit(1);
  }
}

main();
