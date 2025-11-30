# EOS2 Ultra Tables - Täielik Implementeerimise Juhend

## 📋 ÜLEVAADE

EOS2 projektis on juba olemas võimas **Ultra Table** süsteem koos **55 erinevat tüüpi veergudega**, kuid puudub admin UI tabelite haldamiseks. See juhend kirjeldab, kuidas luua täielik tabelite haldussüsteem.

## 🎯 EESMÄRK

Luua professionaalne tabelite haldussüsteem, mis:
- Toetab 1M+ rida ilma performance probleemideta
- Võimaldab kasutajatel luua ja hallata tabeleid graafilises liideses
- Toetab kõiki 55 veeru tüüpi
- Pakub erinevaid vaateid (Grid, Kanban, Calendar, Gallery)
- Võimaldab filtreerimist, sorteerimist ja grupeerimist
- Salvestab kõik andmed Supabase'i

## 📦 MIS ON JUBA OLEMAS

### 1. Column Types System (55 tüüpi)
```
/apps/web/src/lib/ultra-table/column-types/
├── basic/          (8 tüüpi: text, number, currency, percent, decimal, rating, slider, long_text)
├── selection/      (7 tüüpi: dropdown, multi_select, tags, status, priority, checkbox, toggle)
├── datetime/       (6 tüüpi: date, datetime, time, duration, created_time, modified_time)
├── people/         (5 tüüpi: user, multi_user, created_by, modified_by, collaborator)
├── media/          (7 tüüpi: image, images, file, files, video, audio, attachment)
├── contact/        (4 tüüpi: email, phone, url, location)
├── code/           (4 tüüpi: qr_code, barcode, json, code)
├── relations/      (4 tüüpi: relation, lookup, rollup, count)
├── formulas/       (2 tüüpi: formula, auto_number)
├── visual/         (5 tüüpi: color, icon, progress, button, link)
├── advanced/       (3 tüüpi: ai_text, signature, vote)
├── registry.ts     (Keskne register kõigile tüüpidele)
└── types.ts        (TypeScript definitsioonid)
```

### 2. Admin Components
```
/apps/web/src/components/admin/ultra-table/
├── column-manager/     (Veergude haldamine)
│   ├── ColumnEditor.tsx
│   ├── ColumnList.tsx
│   ├── ColumnTypeSelector.tsx
│   └── index.tsx
└── dialog-designer/    (Dialoogide disainer)
    ├── DesignerCanvas.tsx
    ├── FieldToolbar.tsx
    ├── PreviewDialog.tsx
    ├── PropertiesPanel.tsx
    ├── index.tsx
    └── useDialogDesigner.ts
```

### 3. Shared Components
```
/apps/web/src/components/shared/ultra-table/
├── DynamicCell.tsx             (Dünaamiline lahtri renderamine)
├── TableFooter.tsx
├── TableHeader.tsx
├── TableRow.tsx
├── index.tsx
├── usePerformanceMonitor.ts    (Performance jälgimine)
└── useUltraTable.ts            (Peamine hook)
```

### 4. Types
```typescript
// /apps/web/src/types/ultra-table.ts
export type ColumnType = 
  | 'text' | 'long_text' | 'number' | 'currency' | 'percent' | 'decimal'
  | 'rating' | 'slider' | 'dropdown' | 'multi_select' | 'tags' | 'status'
  | 'priority' | 'checkbox' | 'toggle' | 'date' | 'datetime' | 'time'
  | 'duration' | 'created_time' | 'modified_time' | 'user' | 'multi_user'
  | 'created_by' | 'modified_by' | 'collaborator' | 'image' | 'images'
  | 'file' | 'files' | 'video' | 'audio' | 'attachment' | 'email' | 'phone'
  | 'url' | 'location' | 'qr_code' | 'barcode' | 'json' | 'code'
  | 'relation' | 'lookup' | 'rollup' | 'count' | 'formula' | 'auto_number'
  | 'color' | 'icon' | 'progress' | 'button' | 'link' | 'ai_text'
  | 'signature' | 'vote'
```

## 🚀 MIS ON VAJA LUUA

### FASE 1: Database Schema (Supabase Migratsioonid)

#### 1.1 Tabelid
```sql
-- 006_ultra_tables_system.sql

-- Tabelite definitsioonid
CREATE TABLE ultra_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT ultra_tables_name_check CHECK (length(name) > 0)
);

-- Veergude definitsioonid
CREATE TABLE ultra_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'text', 'number', 'dropdown', etc.
  
  -- Position
  position INTEGER NOT NULL DEFAULT 0,
  width INTEGER DEFAULT 150,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  required BOOLEAN DEFAULT FALSE,
  unique_values BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ultra_columns_name_check CHECK (length(name) > 0)
);

-- Vaated (Views)
CREATE TABLE ultra_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grid', -- 'grid', 'kanban', 'calendar', 'gallery', 'form'
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Filters, sorts, groups
  filters JSONB DEFAULT '[]'::jsonb,
  sorts JSONB DEFAULT '[]'::jsonb,
  groups JSONB DEFAULT '[]'::jsonb,
  
  -- Visibility
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Position
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ridade andmed (dünaamiline struktuur)
CREATE TABLE ultra_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,
  
  -- Dünaamilised veerud JSONB kujul
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Position (for ordering)
  position REAL DEFAULT 0
);

-- Indeksid performance'i jaoks
CREATE INDEX idx_ultra_tables_tenant ON ultra_tables(tenant_id);
CREATE INDEX idx_ultra_columns_table ON ultra_columns(table_id);
CREATE INDEX idx_ultra_columns_position ON ultra_columns(table_id, position);
CREATE INDEX idx_ultra_views_table ON ultra_views(table_id);
CREATE INDEX idx_ultra_records_table ON ultra_records(table_id);
CREATE INDEX idx_ultra_records_data ON ultra_records USING gin(data);
CREATE INDEX idx_ultra_records_position ON ultra_records(table_id, position);

-- RLS Policies
ALTER TABLE ultra_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_records ENABLE ROW LEVEL SECURITY;

-- Ultra Tables policies
CREATE POLICY "Users can view tables in their tenant"
  ON ultra_tables FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users can create tables in their tenant"
  ON ultra_tables FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users can update tables in their tenant"
  ON ultra_tables FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users can delete tables in their tenant"
  ON ultra_tables FOR DELETE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Ultra Columns policies
CREATE POLICY "Users can view columns in their tenant tables"
  ON ultra_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can create columns in their tenant tables"
  ON ultra_columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can update columns in their tenant tables"
  ON ultra_columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can delete columns in their tenant tables"
  ON ultra_columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

-- Ultra Views policies
CREATE POLICY "Users can view views in their tenant tables"
  ON ultra_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can create views in their tenant tables"
  ON ultra_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can update views in their tenant tables"
  ON ultra_views FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can delete views in their tenant tables"
  ON ultra_views FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

-- Ultra Records policies
CREATE POLICY "Users can view records in their tenant tables"
  ON ultra_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can create records in their tenant tables"
  ON ultra_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can update records in their tenant tables"
  ON ultra_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

CREATE POLICY "Users can delete records in their tenant tables"
  ON ultra_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = auth.jwt() ->> 'tenant_id'::text
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_ultra_table_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ultra_tables_updated_at
  BEFORE UPDATE ON ultra_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

CREATE TRIGGER ultra_columns_updated_at
  BEFORE UPDATE ON ultra_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

CREATE TRIGGER ultra_views_updated_at
  BEFORE UPDATE ON ultra_views
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

CREATE TRIGGER ultra_records_updated_at
  BEFORE UPDATE ON ultra_records
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();
```

### FASE 2: API Routes

#### 2.1 Tables API
```typescript
// /apps/web/src/app/api/ultra-tables/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  
  const { data: tables, error } = await supabase
    .from('ultra_tables')
    .select(`
      *,
      columns:ultra_columns(
        id,
        name,
        type,
        position,
        width,
        config,
        required,
        unique_values
      ),
      views:ultra_views(
        id,
        name,
        type,
        is_default,
        config
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(tables)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const body = await request.json()

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: table, error } = await supabase
    .from('ultra_tables')
    .insert({
      name: body.name,
      description: body.description,
      icon: body.icon,
      color: body.color,
      created_by: session.session.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create default columns
  const defaultColumns = [
    { name: 'Nimi', type: 'text', position: 0, width: 200 },
    { name: 'Staatus', type: 'status', position: 1, width: 150 },
    { name: 'Loodud', type: 'created_time', position: 2, width: 150 },
  ]

  const { error: columnsError } = await supabase
    .from('ultra_columns')
    .insert(
      defaultColumns.map(col => ({
        table_id: table.id,
        ...col,
      }))
    )

  if (columnsError) {
    console.error('Error creating default columns:', columnsError)
  }

  // Create default view
  const { error: viewError } = await supabase
    .from('ultra_views')
    .insert({
      table_id: table.id,
      name: 'Grid View',
      type: 'grid',
      is_default: true,
      created_by: session.session.user.id,
    })

  if (viewError) {
    console.error('Error creating default view:', viewError)
  }

  return NextResponse.json(table)
}
```

#### 2.2 Single Table API
```typescript
// /apps/web/src/app/api/ultra-tables/[id]/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: table, error } = await supabase
    .from('ultra_tables')
    .select(`
      *,
      columns:ultra_columns(
        id,
        name,
        type,
        position,
        width,
        config,
        required,
        unique_values,
        created_at
      ),
      views:ultra_views(
        id,
        name,
        type,
        is_default,
        is_public,
        position,
        config,
        filters,
        sorts,
        groups
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(table)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()

  const { data: table, error } = await supabase
    .from('ultra_tables')
    .update({
      name: body.name,
      description: body.description,
      icon: body.icon,
      color: body.color,
      settings: body.settings,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(table)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('ultra_tables')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### 2.3 Columns API
```typescript
// /apps/web/src/app/api/ultra-tables/[id]/columns/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()

  // Get current max position
  const { data: existingColumns } = await supabase
    .from('ultra_columns')
    .select('position')
    .eq('table_id', params.id)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = existingColumns?.[0]?.position ?? -1

  const { data: column, error } = await supabase
    .from('ultra_columns')
    .insert({
      table_id: params.id,
      name: body.name,
      type: body.type,
      position: maxPosition + 1,
      width: body.width || 150,
      config: body.config || {},
      required: body.required || false,
      unique_values: body.unique_values || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(column)
}
```

#### 2.4 Records API
```typescript
// /apps/web/src/app/api/ultra-tables/[id]/records/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = (page - 1) * limit

  let query = supabase
    .from('ultra_records')
    .select('*', { count: 'exact' })
    .eq('table_id', params.id)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data: records, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    records,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current max position
  const { data: existingRecords } = await supabase
    .from('ultra_records')
    .select('position')
    .eq('table_id', params.id)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = existingRecords?.[0]?.position ?? -1

  const { data: record, error } = await supabase
    .from('ultra_records')
    .insert({
      table_id: params.id,
      data: body.data || {},
      position: maxPosition + 1,
      created_by: session.session.user.id,
      updated_by: session.session.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(record)
}
```

### FASE 3: Admin UI Pages

#### 3.1 Tables List Page
```typescript
// /apps/web/src/app/(dashboard)/admin/ultra-tables/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Table, Eye, Pencil, Trash2, Database } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'
import { Card } from '@/packages/ui/src/components/card'
import { Badge } from '@/packages/ui/src/components/badge'
import { CreateTableDialog } from '@/components/admin/ultra-tables/CreateTableDialog'
import Link from 'next/link'

interface UltraTable {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  created_at: string
  columns: any[]
  views: any[]
}

export default function UltraTablesPage() {
  const [tables, setTables] = useState<UltraTable[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/ultra-tables')
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Kas oled kindel, et soovid tabeli kustutada?')) return

    try {
      await fetch(`/api/ultra-tables/${id}`, { method: 'DELETE' })
      fetchTables()
    } catch (error) {
      console.error('Error deleting table:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Laadimine...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ultra Tabelid</h1>
          <p className="mt-2 text-slate-600">
            Halda oma kohandatud tabeleid ja andmestruktuure
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Uus tabel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: table.color }}
                >
                  {table.icon || <Table className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{table.name}</h3>
                  {table.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {table.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                <span>{table.columns?.length || 0} veergu</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{table.views?.length || 0} vaadet</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/ultra-tables/${table.id}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <Pencil className="w-4 h-4 mr-2" />
                  Halda
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDelete(table.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <Card className="p-12 text-center">
          <Database className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tabeleid pole veel loodud
          </h3>
          <p className="text-slate-600 mb-6">
            Loo oma esimene kohandatud tabel ja alusta andmete haldamist
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Loo esimene tabel
          </Button>
        </Card>
      )}

      <CreateTableDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchTables}
      />
    </div>
  )
}
```

#### 3.2 Table Detail/Editor Page
```typescript
// /apps/web/src/app/(dashboard)/admin/ultra-tables/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/ui/src/components/tabs'
import { ColumnManager } from '@/components/admin/ultra-table/column-manager'
import { TableDataView } from '@/components/admin/ultra-tables/TableDataView'
import { TableSettings } from '@/components/admin/ultra-tables/TableSettings'
import { ViewsManager } from '@/components/admin/ultra-tables/ViewsManager'

export default function TableDetailPage() {
  const params = useParams()
  const [table, setTable] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTable()
  }, [params.id])

  const fetchTable = async () => {
    try {
      const response = await fetch(`/api/ultra-tables/${params.id}`)
      const data = await response.json()
      setTable(data)
    } catch (error) {
      console.error('Error fetching table:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Laadimine...</div>
  }

  if (!table) {
    return <div className="flex items-center justify-center h-96">Tabelit ei leitud</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{table.name}</h1>
        {table.description && (
          <p className="mt-2 text-slate-600">{table.description}</p>
        )}
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Andmed</TabsTrigger>
          <TabsTrigger value="columns">Veerud</TabsTrigger>
          <TabsTrigger value="views">Vaated</TabsTrigger>
          <TabsTrigger value="settings">Seaded</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6">
          <TableDataView tableId={table.id} columns={table.columns} />
        </TabsContent>

        <TabsContent value="columns" className="mt-6">
          <ColumnManager tableId={table.id} onUpdate={fetchTable} />
        </TabsContent>

        <TabsContent value="views" className="mt-6">
          <ViewsManager tableId={table.id} views={table.views} onUpdate={fetchTable} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TableSettings table={table} onUpdate={fetchTable} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### FASE 4: Performance Components

#### 4.1 Virtual Scrolling Table
```typescript
// /apps/web/src/components/admin/ultra-tables/VirtualTable.tsx

'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { DynamicCell } from '@/components/shared/ultra-table/DynamicCell'

interface VirtualTableProps {
  columns: any[]
  records: any[]
  onRecordUpdate: (recordId: string, data: any) => void
  onRecordDelete: (recordId: string) => void
}

export function VirtualTable({
  columns,
  records,
  onRecordUpdate,
  onRecordDelete,
}: VirtualTableProps) {
  const listRef = useRef<List>(null)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 300
      setContainerHeight(Math.max(400, height))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const Row = useCallback(
    ({ index, style }: any) => {
      const record = records[index]
      
      return (
        <div style={style} className="flex items-center border-b border-slate-200 hover:bg-slate-50">
          {columns.map((column) => (
            <div
              key={column.id}
              className="px-4 py-2 border-r border-slate-200"
              style={{ width: column.width || 150 }}
            >
              <DynamicCell
                type={column.type}
                value={record.data[column.id]}
                config={column.config}
                onChange={(value) => {
                  onRecordUpdate(record.id, {
                    ...record.data,
                    [column.id]: value,
                  })
                }}
              />
            </div>
          ))}
        </div>
      )
    },
    [columns, records, onRecordUpdate]
  )

  return (
    <div className="border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 font-semibold">
        {columns.map((column) => (
          <div
            key={column.id}
            className="px-4 py-3 border-r border-slate-200"
            style={{ width: column.width || 150 }}
          >
            {column.name}
          </div>
        ))}
      </div>

      {/* Virtual Scrolling Body */}
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={records.length}
        itemSize={48}
        width="100%"
        overscanCount={10}
      >
        {Row}
      </List>
    </div>
  )
}
```

#### 4.2 IndexedDB Cache
```typescript
// /apps/web/src/lib/ultra-tables/cache.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface UltraTablesDB extends DBSchema {
  records: {
    key: string
    value: {
      id: string
      tableId: string
      data: any
      updatedAt: string
    }
    indexes: {
      'by-table': string
      'by-updated': string
    }
  }
  tables: {
    key: string
    value: {
      id: string
      name: string
      columns: any[]
      views: any[]
      updatedAt: string
    }
  }
}

class UltraTablesCache {
  private db: IDBPDatabase<UltraTablesDB> | null = null

  async init() {
    if (this.db) return this.db

    this.db = await openDB<UltraTablesDB>('ultra-tables-cache', 1, {
      upgrade(db) {
        // Records store
        const recordsStore = db.createObjectStore('records', { keyPath: 'id' })
        recordsStore.createIndex('by-table', 'tableId')
        recordsStore.createIndex('by-updated', 'updatedAt')

        // Tables store
        db.createObjectStore('tables', { keyPath: 'id' })
      },
    })

    return this.db
  }

  async cacheRecords(tableId: string, records: any[]) {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')
    
    await Promise.all(
      records.map(record =>
        tx.store.put({
          id: record.id,
          tableId,
          data: record.data,
          updatedAt: record.updated_at,
        })
      )
    )
    
    await tx.done
  }

  async getRecords(tableId: string): Promise<any[]> {
    const db = await this.init()
    return db.getAllFromIndex('records', 'by-table', tableId)
  }

  async cacheTable(table: any) {
    const db = await this.init()
    await db.put('tables', {
      id: table.id,
      name: table.name,
      columns: table.columns,
      views: table.views,
      updatedAt: table.updated_at,
    })
  }

  async getTable(tableId: string) {
    const db = await this.init()
    return db.get('tables', tableId)
  }

  async clearTable(tableId: string) {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')
    const index = tx.store.index('by-table')
    
    for await (const cursor of index.iterate(tableId)) {
      cursor.delete()
    }
    
    await tx.done
  }
}

export const ultraTablesCache = new UltraTablesCache()
```

### FASE 5: Menüü Haldus

#### 5.1 Menu Management Page
```typescript
// /apps/web/src/app/(dashboard)/admin/menu/page.tsx

'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'
import { Card } from '@/packages/ui/src/components/card'

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState([
    { id: '1', label: 'Töölaud', href: '/dashboard', icon: 'LayoutDashboard', visible: true },
    { id: '2', label: 'Projektid', href: '/projects', icon: 'FolderKanban', visible: true },
    { id: '3', label: 'Tabelid', href: '/tables', icon: 'Table', visible: true },
    // ... rest of menu items
  ])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(menuItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setMenuItems(items)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Menüü Haldus</h1>
          <p className="mt-2 text-slate-600">
            Kohanda navigatsiooni menüüd
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Lisa menüü element
        </Button>
      </div>

      <Card className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {menuItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-5 h-5 text-slate-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{item.label}</div>
                          <div className="text-sm text-slate-600">{item.href}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
    </div>
  )
}
```

### FASE 6: Dashboard Layout Update

```typescript
// Uuenda /apps/web/src/app/(dashboard)/layout.tsx

// Lisa adminItems sektsiooni:
const adminItems = [
  { href: '/admin/cms', label: 'CMS Haldus', icon: Database },
  { href: '/admin/templates', label: 'PDF Mallid', icon: FileType },
  { href: '/admin/ultra-tables', label: 'Tabelid', icon: Table }, // UUS!
  { href: '/admin/menu', label: 'Menüü', icon: Menu }, // UUS!
  { href: '/trash', label: 'Prügikast', icon: Trash2 },
  { href: '/notifications', label: 'Teavitused', icon: Bell },
  { href: '/settings', label: 'Seaded', icon: Settings },
]
```

## 🎨 DISAIN NÕUDED

Kõik UI komponendid peavad järgima:
- Light-colored design
- Stylish admin dashboard aesthetic
- Consistent spacing (Tailwind utility classes)
- Hover states and transitions
- Responsive design (mobile-first)
- Accessible (ARIA labels, keyboard navigation)

## 📊 PERFORMANCE OPTIMISATSIOONID

### 1M+ ridade toetamiseks:
1. **Virtual Scrolling** - react-window
2. **IndexedDB Cache** - idb library
3. **Pagination** - Server-side with cursor
4. **Lazy Loading** - Load data on scroll
5. **Debounced Search** - 300ms delay
6. **Optimistic Updates** - Update UI immediately
7. **Web Workers** - Heavy calculations off main thread

## 📦 VAJALIKUD DEPENDENCID

```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "idb": "^8.0.0",
    "@hello-pangea/dnd": "^16.5.0"
  }
}
```

## ✅ IMPLEMENTEERIMISE CHECKLIST

### Database
- [ ] Loo migration `006_ultra_tables_system.sql`
- [ ] Käivita migration Supabase'is
- [ ] Testi RLS policies

### API Routes
- [ ] `/api/ultra-tables/route.ts` (GET, POST)
- [ ] `/api/ultra-tables/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] `/api/ultra-tables/[id]/columns/route.ts` (GET, POST, PATCH, DELETE)
- [ ] `/api/ultra-tables/[id]/records/route.ts` (GET, POST, PATCH, DELETE)
- [ ] `/api/ultra-tables/[id]/views/route.ts` (GET, POST, PATCH, DELETE)

### UI Components
- [ ] `CreateTableDialog.tsx`
- [ ] `TableDataView.tsx`
- [ ] `VirtualTable.tsx`
- [ ] `TableSettings.tsx`
- [ ] `ViewsManager.tsx`

### Pages
- [ ] `/admin/ultra-tables/page.tsx`
- [ ] `/admin/ultra-tables/[id]/page.tsx`
- [ ] `/admin/menu/page.tsx`

### Utilities
- [ ] `cache.ts` (IndexedDB)
- [ ] `export.ts` (CSV/XLSX export)
- [ ] `import.ts` (CSV/XLSX import)

### Dashboard
- [ ] Uuenda menüü layout.tsx failis

## 🚀 JÄRGMISED SAMMUD

1. Loo migration fail ja käivita see
2. Implementeeri API routes
3. Loo UI komponendid
4. Lisa menüü elemendid
5. Testi performance suurte andmehulkadega
6. Optimeeri vajadusel

## 📝 MÄRKMED

- Kõik andmed salvestatakse JSONB formaadis `ultra_records.data` veerus
- Performance on kriitilise tähtsusega (1M+ rida)
- UI peab olema intuitiivne ja kasutajasõbralik
- Kasuta olemasolevat column types süsteemi maksimaalse jõudluse saavutamiseks
