import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// This endpoint runs database migrations
// Only works in development or with proper authentication
export async function POST(request: NextRequest) {
  // Security check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    // In production, require a secret header
    const authHeader = request.headers.get('x-migration-secret')
    if (authHeader !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      {
        error: 'Missing Supabase credentials',
        help: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
      },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { migrationFile, sql: directSql } = body

    let sql: string

    if (directSql) {
      sql = directSql
    } else if (migrationFile) {
      // Read from file - find project root
      const projectRoot = process.cwd()
      const filePath = path.resolve(projectRoot, '..', '..', migrationFile)

      if (!fs.existsSync(filePath)) {
        // Try alternative paths
        const altPath = path.resolve(projectRoot, migrationFile)
        if (!fs.existsSync(altPath)) {
          return NextResponse.json(
            { error: `Migration file not found: ${migrationFile}` },
            { status: 404 }
          )
        }
        sql = fs.readFileSync(altPath, 'utf-8')
      } else {
        sql = fs.readFileSync(filePath, 'utf-8')
      }
    } else {
      return NextResponse.json(
        { error: 'Provide either migrationFile or sql in request body' },
        { status: 400 }
      )
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Split SQL into executable statements
    // This is a simple parser - handles basic cases
    const statements = splitSqlStatements(sql)

    const results: { statement: number; success: boolean; error?: string }[] = []
    let hasErrors = false

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      if (!stmt.trim()) continue

      try {
        // Execute via rpc if available, otherwise use REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt }),
        })

        if (!response.ok) {
          // RPC doesn't exist, this is expected for new projects
          // We'll report this and suggest manual execution
          throw new Error('RPC function not available')
        }

        results.push({ statement: i + 1, success: true })
      } catch {
        results.push({ statement: i + 1, success: false, error: 'Execution failed' })
        hasErrors = true
      }
    }

    if (hasErrors) {
      return NextResponse.json(
        {
          success: false,
          message: 'Migration could not be executed automatically',
          results,
          sql: sql.substring(0, 500) + '...',
          instructions: [
            '1. Go to https://supabase.com/dashboard',
            '2. Select your project',
            '3. Go to SQL Editor',
            '4. Paste the migration SQL',
            '5. Click "Run"',
          ],
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
      statementsRun: results.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET - return list of pending migrations
export async function GET() {
  try {
    const projectRoot = process.cwd()
    const migrationsPath = path.resolve(projectRoot, '..', '..', 'supabase', 'migrations')

    if (!fs.existsSync(migrationsPath)) {
      return NextResponse.json({ migrations: [], path: migrationsPath })
    }

    const files = fs.readdirSync(migrationsPath).filter((f) => f.endsWith('.sql'))

    return NextResponse.json({
      migrations: files.map((f) => ({
        name: f,
        path: `supabase/migrations/${f}`,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Simple SQL statement splitter
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let inComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    // Handle block comments
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inBlockComment = true
      current += char
      continue
    }
    if (inBlockComment && char === '*' && nextChar === '/') {
      inBlockComment = false
      current += '*/'
      i++
      continue
    }
    if (inBlockComment) {
      current += char
      continue
    }

    // Handle line comments
    if (!inString && char === '-' && nextChar === '-') {
      inComment = true
      current += char
      continue
    }
    if (inComment && char === '\n') {
      inComment = false
      current += char
      continue
    }
    if (inComment) {
      current += char
      continue
    }

    // Handle strings
    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      current += char
      continue
    }
    if (inString && char === stringChar) {
      // Check for escaped quote
      if (nextChar === stringChar) {
        current += char + nextChar
        i++
        continue
      }
      inString = false
      current += char
      continue
    }
    if (inString) {
      current += char
      continue
    }

    // Handle dollar-quoted strings (PostgreSQL)
    if (char === '$') {
      // Find the end of the tag
      let tag = '$'
      let j = i + 1
      while (j < sql.length && sql[j] !== '$') {
        tag += sql[j]
        j++
      }
      if (j < sql.length) {
        tag += '$'
        // Find closing tag
        const closeIndex = sql.indexOf(tag, j + 1)
        if (closeIndex !== -1) {
          current += sql.substring(i, closeIndex + tag.length)
          i = closeIndex + tag.length - 1
          continue
        }
      }
    }

    // Statement separator
    if (char === ';') {
      current += char
      const trimmed = current.trim()
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed)
      }
      current = ''
      continue
    }

    current += char
  }

  // Don't forget the last statement
  const trimmed = current.trim()
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed)
  }

  return statements
}
