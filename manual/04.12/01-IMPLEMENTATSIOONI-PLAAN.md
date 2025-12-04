# 🎯 EOS2 IMPLEMENTATSIOONI PLAAN - SAMM-SAMMULT

**Kuupäev:** 04.12.2025  
**Projekt:** EOS2 - Modulaarne ERP süsteem  
**Eesmärk:** Viia lõpuni kõik Silver'i soovid

---

## 📋 SISUKORD

1. [PHASE 1: Baassüsteem](#phase-1-baassüsteem)
2. [PHASE 2: Õiguste süsteem](#phase-2-õiguste-süsteem)
3. [PHASE 3: Admin paneel](#phase-3-admin-paneel)
4. [PHASE 4: Registry süsteem](#phase-4-registry-süsteem)
5. [PHASE 5: Design System](#phase-5-design-system)
6. [PHASE 6: Esimene moodul](#phase-6-esimene-moodul)
7. [PHASE 7: Testimine](#phase-7-testimine)
8. [PHASE 8: Dokumentatsioon](#phase-8-dokumentatsioon)

---

## PHASE 1: BAASSÜSTEEM

### Eesmärk
Luua andmebaasi struktuur, mis toetab modulaarset arhitektuuri

### Aeg: 2-3 tundi

### Sammud

#### 1.1 Andmebaasi migratsioonid

**Fail:** `database/migrations/002_modules_system.sql`

```sql
-- ═══════════════════════════════════════
-- MODULES SYSTEM
-- ═══════════════════════════════════════

-- Moodulite register
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,              -- vehicles, projects, invoices
  label TEXT NOT NULL,                    -- Sõidukid, Projektid, Arved
  label_singular TEXT NOT NULL,           -- Sõiduk, Projekt, Arve
  icon TEXT,                              -- CarOutlined
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'   -- active, beta, development, disabled
    CHECK (status IN ('active', 'beta', 'development', 'todo', 'disabled')),
  config JSONB NOT NULL,                  -- Täielik definition.ts sisu
  
  -- Meta
  version TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Komponentide register
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- VehicleList, VehicleForm
  type TEXT NOT NULL,                     -- page, modal, widget, tab
  status TEXT NOT NULL DEFAULT 'todo'     -- active, beta, development, todo
    CHECK (status IN ('active', 'beta', 'development', 'todo')),
  description TEXT,
  
  -- TODO ja Bugid
  todo_refs TEXT[],                       -- ['#TODO-045', '#TODO-112']
  bug_refs TEXT[],                        -- ['#BUG-234']
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(module_name, name)
);

-- Toimingute register
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,
  action TEXT NOT NULL,                   -- read, create, update, delete
  label TEXT NOT NULL,                    -- Vaata, Lisa, Muuda, Kustuta
  description TEXT,
  default_roles TEXT[],                   -- ['manager', 'admin', 'owner']
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(module_name, action)
);

-- Kasutaja -> Mooduli ligipääsud
CREATE TABLE IF NOT EXISTS user_module_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,
  
  -- Õigused
  permissions TEXT[] NOT NULL,            -- ['read', 'create', 'update']
  
  -- Seaded
  visible_in_menu BOOLEAN DEFAULT true,
  readonly BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, module_name)
);

-- Kasutaja -> Komponendi ligipääsud
CREATE TABLE IF NOT EXISTS user_component_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  
  visible BOOLEAN DEFAULT true,
  readonly BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, component_id)
);

-- Indeksid
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_components_module ON components(module_name);
CREATE INDEX idx_components_status ON components(status);
CREATE INDEX idx_actions_module ON actions(module_name);
CREATE INDEX idx_user_module_access_user ON user_module_access(user_id);
CREATE INDEX idx_user_component_access_user ON user_component_access(user_id);
```

#### 1.2 Käivita migratsioon

```bash
cd /path/to/eos2
pnpm db:migrate
```

#### 1.3 Kontrolli

```bash
# Kontrolli, et tabelid on loodud
psql -d eos2 -c "\dt modules components actions user_module_access user_component_access"
```

---

## PHASE 2: ÕIGUSTE SÜSTEEM

### Eesmärk
Rakendada hierarhiline RBAC süsteem

### Aeg: 3-4 tundi

### Sammud

#### 2.1 Rollide definitsioon

**Fail:** `core/permissions/roles.ts`

```typescript
export const Role = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const

export type RoleType = typeof Role[keyof typeof Role]

export const RoleHierarchy: Record<RoleType, number> = {
  owner: 100,
  admin: 80,
  manager: 60,
  user: 40,
  viewer: 20,
}

export const RoleLabels: Record<RoleType, string> = {
  owner: 'Omanik',
  admin: 'Administraator',
  manager: 'Juhataja',
  user: 'Kasutaja',
  viewer: 'Vaataja',
}

export const RoleDescriptions: Record<RoleType, string> = {
  owner: 'Täielik ligipääs kõigile süsteemidele ja seadetele',
  admin: 'Haldab kasutajaid, mooduleid ja õigusi',
  manager: 'Haldab projekte, arveid ja ressursse',
  user: 'Tavakasutaja - põhiõigused',
  viewer: 'Vaataja - ainult lugemisõigus',
}
```

#### 2.2 Toimingute definitsioon

**Fail:** `core/permissions/actions.ts`

```typescript
export const Action = {
  // CRUD baas
  'read': 'Vaata',
  'create': 'Lisa',
  'update': 'Muuda',
  'delete': 'Kustuta',
  'export': 'Eksport',
  
  // Admin
  'admin:access': 'Admin ligipääs',
  'admin:users': 'Halda kasutajaid',
  'admin:modules': 'Halda mooduleid',
  'admin:permissions': 'Halda õigusi',
  'admin:system': 'Süsteemi seaded',
  
  // ... lisatakse moodulite kaupa automaatselt
} as const
```

#### 2.3 Õiguste maatriks

**Fail:** `core/permissions/matrix.ts`

```typescript
import { Role, type RoleType } from './roles'
import { Action } from './actions'

export const PermissionMatrix: Record<RoleType, string[]> = {
  owner: [
    // Kõik õigused
    '*',
  ],
  
  admin: [
    // Peaaegu kõik
    'admin:access',
    'admin:users',
    'admin:modules',
    'admin:permissions',
    // Mooduli õigused lisatakse dünaamiliselt
  ],
  
  manager: [
    // Projektid ja arved
    // Lisatakse dünaamiliselt mooduli definitsioonist
  ],
  
  user: [
    // Põhiliselt lugemine
  ],
  
  viewer: [
    // Ainult lugemine
  ],
}
```

#### 2.4 Õiguste kontroll

**Fail:** `core/permissions/check.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { PermissionMatrix } from './matrix'
import type { RoleType } from './roles'

interface User {
  id: string
  role: RoleType
  tenant_id: string
}

/**
 * Kontrolli kas kasutajal on õigus
 */
export async function hasPermission(
  user: User,
  action: string,
  resource?: any
): Promise<boolean> {
  // 1. Owner - alati lubatud
  if (user.role === 'owner') return true
  
  // 2. Kontrolli maatriksist
  const allowed = PermissionMatrix[user.role] || []
  
  // Wildcard: *
  if (allowed.includes('*')) return true
  
  // Wildcard: module:*
  const hasWildcard = allowed.some(pattern => {
    if (!pattern.includes('*')) return pattern === action
    const prefix = pattern.split(':')[0]
    return action.startsWith(prefix + ':')
  })
  
  if (hasWildcard) return true
  if (allowed.includes(action)) return true
  
  // 3. Kontrolli user_module_access tabelist
  if (action.includes(':')) {
    const [moduleName, moduleAction] = action.split(':')
    
    const { data } = await supabase
      .from('user_module_access')
      .select('permissions')
      .eq('user_id', user.id)
      .eq('module_name', moduleName)
      .single()
    
    if (data && data.permissions.includes(moduleAction)) {
      return true
    }
  }
  
  // 4. Resource-level kontroll
  if (resource && resource.created_by === user.id) {
    // Omanik saab muuta/kustutada oma ressursse
    if (action.endsWith(':update') || action.endsWith(':delete')) {
      return true
    }
  }
  
  return false
}

/**
 * React hook õiguste kontrollimiseks
 */
export function usePermission(action: string) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  
  useEffect(() => {
    if (user) {
      hasPermission(user, action).then(setHasAccess)
    }
  }, [user, action])
  
  return hasAccess
}
```

#### 2.5 Kaitse komponendid

**Fail:** `core/permissions/ProtectedComponent.tsx`

```typescript
import { usePermission } from './check'

interface Props {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedComponent({ 
  permission, 
  children, 
  fallback = null 
}: Props) {
  const hasAccess = usePermission(permission)
  
  if (!hasAccess) return <>{fallback}</>
  
  return <>{children}</>
}
```

---

## PHASE 3: ADMIN PANEEL

### Eesmärk
Luua admin dashboard kõigi süsteemide haldamiseks

### Aeg: 4-5 tundi

### Sammud

#### 3.1 Admin layout

**Fail:** `admin/layout.tsx`

```typescript
import { Layout, Menu } from 'antd'
import { 
  DashboardOutlined, 
  AppstoreOutlined,
  UserOutlined,
  LockOutlined,
  SettingOutlined,
  BugOutlined
} from '@ant-design/icons'

export default function AdminLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider>
        <Menu
          mode="inline"
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              path: '/admin',
            },
            {
              key: 'modules',
              icon: <AppstoreOutlined />,
              label: 'Moodulid',
              path: '/admin/modules',
            },
            {
              key: 'users',
              icon: <UserOutlined />,
              label: 'Kasutajad',
              path: '/admin/users',
            },
            {
              key: 'permissions',
              icon: <LockOutlined />,
              label: 'Õigused',
              path: '/admin/permissions',
            },
            {
              key: 'system',
              icon: <SettingOutlined />,
              label: 'Süsteem',
              path: '/admin/system',
            },
            {
              key: 'errors',
              icon: <BugOutlined />,
              label: 'Vead',
              path: '/admin/errors',
            },
          ]}
        />
      </Layout.Sider>
      
      <Layout>
        <Layout.Content style={{ padding: 24 }}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
```

#### 3.2 Dashboard

**Fail:** `admin/pages/index.tsx`

```typescript
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { useModules } from '@/hooks/useModules'
import { useSystemHealth } from '@/hooks/useSystemHealth'

export default function AdminDashboard() {
  const { modules, loading } = useModules()
  const { health } = useSystemHealth()
  
  const stats = {
    total: modules.length,
    active: modules.filter(m => m.status === 'active').length,
    beta: modules.filter(m => m.status === 'beta').length,
    development: modules.filter(m => m.status === 'development').length,
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      {/* STATISTIKA */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mooduleid kokku"
              value={stats.total}
              suffix={`/ ${stats.active} aktiivset`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Komponente"
              value={284}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kasutajaid"
              value={127}
              suffix="/ 23 online"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vigu"
              value={8}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* SÜSTEEMI TERVIS */}
      <Card title="Süsteemi tervis" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <SystemHealthItem 
              label="Database"
              status={health.database}
            />
          </Col>
          <Col span={6}>
            <SystemHealthItem 
              label="API"
              status={health.api}
            />
          </Col>
          <Col span={6}>
            <SystemHealthItem 
              label="Storage"
              status={health.storage}
            />
          </Col>
          <Col span={6}>
            <SystemHealthItem 
              label="Auth"
              status={health.auth}
            />
          </Col>
        </Row>
      </Card>
      
      {/* MOODULITE STAATUS */}
      <Card title="Moodulite staatus">
        <Table
          dataSource={modules}
          columns={[
            {
              title: 'Moodul',
              dataIndex: 'label',
              key: 'label',
            },
            {
              title: 'Staatus',
              dataIndex: 'status',
              key: 'status',
              render: (status) => (
                <Tag color={getStatusColor(status)}>
                  {status}
                </Tag>
              ),
            },
            {
              title: 'Komponendid',
              key: 'components',
              render: (_, record) => (
                <span>
                  {record.components?.length || 0}
                </span>
              ),
            },
            {
              title: 'Bugid',
              key: 'bugs',
              render: (_, record) => (
                record.bug_refs?.length > 0 && (
                  <Tag color="red">{record.bug_refs.length}</Tag>
                )
              ),
            },
            {
              title: 'TODO',
              key: 'todo',
              render: (_, record) => (
                record.todo_refs?.length > 0 && (
                  <Tag color="blue">{record.todo_refs.length}</Tag>
                )
              ),
            },
          ]}
          loading={loading}
        />
      </Card>
    </div>
  )
}
```

#### 3.3 Moodulite haldus

**Fail:** `admin/pages/modules.tsx`

```typescript
import { Table, Button, Space, Tag, Badge } from 'antd'
import { useModules } from '@/hooks/useModules'

export default function ModulesManagement() {
  const { modules, updateModule } = useModules()
  
  return (
    <div>
      <h1>Moodulite haldus</h1>
      
      <Table
        dataSource={modules}
        columns={[
          {
            title: 'Moodul',
            dataIndex: 'label',
            key: 'label',
            render: (label, record) => (
              <Space>
                <Icon type={record.icon} />
                <span>{label}</span>
              </Space>
            ),
          },
          {
            title: 'Staatus',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              <StatusBadge status={status} />
            ),
          },
          {
            title: 'Komponendid',
            key: 'components',
            render: (_, record) => (
              <Space>
                <Badge 
                  count={record.components.filter(c => c.status === 'active').length}
                  style={{ backgroundColor: '#52c41a' }}
                />
                <Badge 
                  count={record.components.filter(c => c.status === 'beta').length}
                  style={{ backgroundColor: '#faad14' }}
                />
                <Badge 
                  count={record.components.filter(c => c.status === 'todo').length}
                  style={{ backgroundColor: '#8c8c8c' }}
                />
              </Space>
            ),
          },
          {
            title: 'Toimingud',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  onClick={() => viewModule(record)}
                >
                  Vaata
                </Button>
                <Button
                  type="link"
                  onClick={() => editModule(record)}
                >
                  Muuda
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={() => disableModule(record)}
                >
                  Keela
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}
```

#### 3.4 Kasutajate õiguste maatriks

**Fail:** `admin/pages/users/[id]/permissions.tsx`

```typescript
import { Table, Checkbox, Progress } from 'antd'
import { useUser } from '@/hooks/useUser'
import { useModules } from '@/hooks/useModules'

export default function UserPermissions({ userId }) {
  const { user, updatePermissions } = useUser(userId)
  const { modules } = useModules()
  
  const handlePermissionChange = async (
    moduleName: string,
    action: string,
    checked: boolean
  ) => {
    await updatePermissions(userId, moduleName, action, checked)
  }
  
  return (
    <div>
      <h2>{user.name} - Õiguste maatriks</h2>
      
      {/* MAATRIKS */}
      <Table
        dataSource={modules}
        columns={[
          {
            title: 'Moodul',
            dataIndex: 'label',
            key: 'label',
            fixed: 'left',
            width: 200,
          },
          {
            title: '👁️ Vaata',
            key: 'read',
            width: 80,
            align: 'center',
            render: (_, record) => (
              <Checkbox
                checked={hasPermission(user, `${record.name}:read`)}
                onChange={e => handlePermissionChange(
                  record.name, 
                  'read', 
                  e.target.checked
                )}
              />
            ),
          },
          {
            title: '➕ Lisa',
            key: 'create',
            width: 80,
            align: 'center',
            render: (_, record) => (
              <Checkbox
                checked={hasPermission(user, `${record.name}:create`)}
                onChange={e => handlePermissionChange(
                  record.name, 
                  'create', 
                  e.target.checked
                )}
              />
            ),
          },
          {
            title: '✏️ Muuda',
            key: 'update',
            width: 80,
            align: 'center',
            render: (_, record) => (
              <Checkbox
                checked={hasPermission(user, `${record.name}:update`)}
                onChange={e => handlePermissionChange(
                  record.name, 
                  'update', 
                  e.target.checked
                )}
              />
            ),
          },
          {
            title: '🗑️ Kustuta',
            key: 'delete',
            width: 80,
            align: 'center',
            render: (_, record) => (
              <Checkbox
                checked={hasPermission(user, `${record.name}:delete`)}
                onChange={e => handlePermissionChange(
                  record.name, 
                  'delete', 
                  e.target.checked
                )}
              />
            ),
          },
          {
            title: '📤 Eksport',
            key: 'export',
            width: 80,
            align: 'center',
            render: (_, record) => (
              <Checkbox
                checked={hasPermission(user, `${record.name}:export`)}
                onChange={e => handlePermissionChange(
                  record.name, 
                  'export', 
                  e.target.checked
                )}
              />
            ),
          },
        ]}
        scroll={{ x: 1000 }}
      />
      
      {/* STATISTIKA */}
      <div style={{ marginTop: 24 }}>
        <Progress
          percent={calculatePermissionCoverage(user)}
          format={(percent) => `${calculateGrantedPermissions(user)}/${calculateTotalPermissions()} õigust`}
        />
      </div>
    </div>
  )
}
```

---

## PHASE 4: REGISTRY SÜSTEEM

### Eesmärk
Automaatne moodulite registreerimine

### Aeg: 3-4 tundi

### Sammud

#### 4.1 defineModule helper

**Fail:** `core/registry/defineModule.ts`

```typescript
export interface ModuleDefinition {
  name: string
  label: string
  labelSingular: string
  icon: string
  description?: string
  menu: {
    group: string
    order: number
    visible?: boolean
  }
  database: {
    table: string
    fields: Record<string, FieldDefinition>
    rls?: boolean
    indexes?: IndexDefinition[]
  }
  permissions: Record<string, PermissionDefinition>
  components: ComponentDefinition[]
  relations?: RelationDefinition[]
  views?: ViewDefinition[]
  statuses?: Record<string, StatusDefinition>
  meta: {
    version: string
    author: string
    createdAt: string
    status: 'active' | 'beta' | 'development' | 'todo'
    bugRefs?: string[]
    todoRefs?: string[]
  }
}

export function defineModule(definition: ModuleDefinition): ModuleDefinition {
  // Validate
  if (!definition.name) throw new Error('Module name is required')
  if (!definition.label) throw new Error('Module label is required')
  
  // Return validated definition
  return definition
}
```

#### 4.2 registerModule function

**Fail:** `core/registry/registerModule.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import type { ModuleDefinition } from './defineModule'

export async function registerModule(definition: ModuleDefinition) {
  console.log(`📝 Registering module: ${definition.name}...`)
  
  // 1. REGISTREERI MOODUL
  const { error: moduleError } = await supabase
    .from('modules')
    .upsert({
      name: definition.name,
      label: definition.label,
      label_singular: definition.labelSingular,
      icon: definition.icon,
      description: definition.description,
      status: definition.meta.status,
      config: definition,
      version: definition.meta.version,
      author: definition.meta.author,
    })
  
  if (moduleError) {
    console.error(`❌ Failed to register module:`, moduleError)
    throw moduleError
  }
  
  // 2. LOO ANDMEBAASI TABEL (kui ei eksisteeri)
  if (definition.database) {
    await createDatabaseTable(definition.database, definition.name)
  }
  
  // 3. LOO RLS POLIITIKAD
  if (definition.database.rls) {
    await createRLSPolicies(definition.name, definition.database.table)
  }
  
  // 4. REGISTREERI KOMPONENDID
  for (const component of definition.components) {
    const { error: componentError } = await supabase
      .from('components')
      .upsert({
        module_name: definition.name,
        name: component.name,
        type: component.type,
        status: component.status,
        description: component.description,
        todo_refs: component.todoRefs || [],
        bug_refs: component.bugRefs || [],
      })
    
    if (componentError) {
      console.warn(`⚠️ Failed to register component ${component.name}:`, componentError)
    }
  }
  
  // 5. REGISTREERI ÕIGUSED
  for (const [action, config] of Object.entries(definition.permissions)) {
    const { error: actionError } = await supabase
      .from('actions')
      .upsert({
        module_name: definition.name,
        action,
        label: config.label,
        description: config.description,
        default_roles: config.default || [],
      })
    
    if (actionError) {
      console.warn(`⚠️ Failed to register action ${action}:`, actionError)
    }
  }
  
  console.log(`✅ Module ${definition.name} registered successfully!`)
}

async function createDatabaseTable(
  dbConfig: ModuleDefinition['database'],
  moduleName: string
) {
  // Genereeri CREATE TABLE SQL
  const sql = generateCreateTableSQL(dbConfig, moduleName)
  
  // Käivita SQL
  const { error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    console.warn(`⚠️ Database table may already exist or SQL failed:`, error)
  }
}

async function createRLSPolicies(moduleName: string, tableName: string) {
  // Genereeri RLS SQL
  const sql = generateRLSSQL(moduleName, tableName)
  
  // Käivita SQL
  const { error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    console.warn(`⚠️ RLS policies may already exist:`, error)
  }
}
```

#### 4.3 App startup registreerimine

**Fail:** `app/layout.tsx` või `middleware.ts`

```typescript
import { registerAllModules } from '@/core/registry'

// App käivitumisel
export async function startup() {
  console.log('🚀 Starting EOS2...')
  
  // Registreeri kõik moodulid
  await registerAllModules()
  
  console.log('✅ EOS2 started successfully!')
}
```

---

## PHASE 5: DESIGN SYSTEM

### Eesmärk
Ühtne disain kõigile moodulitele

### Aeg: 2-3 tundi

### Sammud

#### 5.1 Design tokens

**Fail:** `design/tokens.ts`

*(Vt MASTER juhendist)*

#### 5.2 Ant Design theme

**Fail:** `design/theme.ts`

*(Vt MASTER juhendist)*

#### 5.3 Core komponendid

**Fail:** `core/ui/DataTable.tsx`

```typescript
import { Table } from 'antd'
import type { ColumnType } from 'antd/es/table'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnType<T>[]
  loading?: boolean
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  // Lisame automaatselt action veeru kui onEdit või onDelete on määratud
  const enhancedColumns = [...columns]
  
  if (onEdit || onDelete) {
    enhancedColumns.push({
      title: 'Toimingud',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {onEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Muuda
            </Button>
          )}
          {onDelete && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            >
              Kustuta
            </Button>
          )}
        </Space>
      ),
    })
  }
  
  return (
    <Table
      dataSource={data}
      columns={enhancedColumns}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Kokku ${total} kirjet`,
      }}
    />
  )
}
```

**Fail:** `core/ui/FormBuilder.tsx`

```typescript
import { Form, Input, Select, DatePicker } from 'antd'
import type { ModuleDefinition } from '@/core/registry'

interface FormBuilderProps {
  definition: ModuleDefinition
  initialValues?: any
  onSubmit: (values: any) => void
}

export function FormBuilder({ 
  definition, 
  initialValues, 
  onSubmit 
}: FormBuilderProps) {
  const [form] = Form.useForm()
  
  return (
    <Form
      form={form}
      initialValues={initialValues}
      onFinish={onSubmit}
      layout="vertical"
    >
      {Object.entries(definition.database.fields).map(([name, field]) => {
        // Genereeri väli tüübi põhjal
        switch (field.type) {
          case 'text':
            return (
              <Form.Item
                key={name}
                name={name}
                label={field.label}
                rules={[
                  { required: field.required, message: 'Kohustuslik väli' }
                ]}
              >
                <Input />
              </Form.Item>
            )
          
          case 'enum':
            return (
              <Form.Item
                key={name}
                name={name}
                label={field.label}
                rules={[
                  { required: field.required, message: 'Kohustuslik väli' }
                ]}
              >
                <Select>
                  {field.options?.map(option => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )
          
          case 'date':
            return (
              <Form.Item
                key={name}
                name={name}
                label={field.label}
                rules={[
                  { required: field.required, message: 'Kohustuslik väli' }
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            )
          
          // ... teised tüübid
          default:
            return null
        }
      })}
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Salvesta
        </Button>
      </Form.Item>
    </Form>
  )
}
```

---

## PHASE 6: ESIMENE MOODUL

### Eesmärk
Luua esimene moodul kasutades uut süsteemi

### Aeg: 1-2 tundi

### Sammud

#### 6.1 Mooduli definitsioon

**Fail:** `modules/vehicles/definition.ts`

*(Vt MASTER juhendist täielik näide)*

#### 6.2 Mooduli dokumentatsioon

**Fail:** `modules/vehicles/MODULE.md`

*(Vt MASTER juhendist)*

#### 6.3 Mooduli lehed

**Fail:** `modules/vehicles/pages/index.tsx`

```typescript
import { DataTable } from '@/core/ui/DataTable'
import { useResource } from '@/core/data/useResource'
import definition from '../definition'

export default function VehicleList() {
  const { data, loading, deleteResource } = useResource('vehicles')
  
  return (
    <div>
      <h1>Sõidukid</h1>
      
      <DataTable
        data={data}
        columns={[
          {
            title: 'Reg nr',
            dataIndex: 'registration_number',
            key: 'registration_number',
          },
          {
            title: 'Mark',
            dataIndex: 'make',
            key: 'make',
          },
          {
            title: 'Mudel',
            dataIndex: 'model',
            key: 'model',
          },
          {
            title: 'Staatus',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              <StatusBadge 
                status={status}
                config={definition.statuses}
              />
            ),
          },
        ]}
        loading={loading}
        onDelete={deleteResource}
      />
    </div>
  )
}
```

---

## PHASE 7: TESTIMINE

### Eesmärk
Tagada süsteemi kvaliteet

### Aeg: 2-3 tundi

### Sammud

#### 7.1 Unit testid

```bash
# Permissions
pnpm test core/permissions

# Registry
pnpm test core/registry

# Components
pnpm test core/ui
```

#### 7.2 Integration testid

```bash
# Module registration
pnpm test:integration modules

# Admin panel
pnpm test:integration admin
```

#### 7.3 E2E testid

```bash
# User flow
pnpm test:e2e
```

---

## PHASE 8: DOKUMENTATSIOON

### Eesmärk
Uuenda kõik dokumendid

### Aeg: 1-2 tundi

### Sammud

#### 8.1 SYSTEM.md

Uuenda moodulite nimekirja, viimased muudatused, TODO-d

#### 8.2 TODO.md

Lisa uued teadaolevad probleemid ja tulevased täiendused

#### 8.3 CHANGELOG.md

Dokumenteeri kõik muudatused

---

## ✅ KONTROLL-LIST

Enne kui lõpetad, kontrolli:

- [ ] Kõik migratsioonid käivitatud
- [ ] Õiguste süsteem töötab
- [ ] Admin paneel näitab õigeid andmeid
- [ ] Esimene moodul registreeritud automaatselt
- [ ] Design system rakendatud
- [ ] Core komponendid töötavad
- [ ] Testid läbivad
- [ ] Dokumentatsioon uuendatud
- [ ] SYSTEM.md on ajakohane
- [ ] TODO.md on ajakohane

---

## 🎉 TULEMUS

Pärast nende faside lõpetamist on sul:

1. ✅ **Modulaarne arhitektuur** - uus moodul 30 minutiga
2. ✅ **Õiguste süsteem** - hierarhiline RBAC
3. ✅ **Admin paneel** - täielik ülevaade
4. ✅ **Registry süsteem** - automaatne registreerimine
5. ✅ **Design System** - ühtne disain
6. ✅ **Core komponendid** - DRY põhimõte
7. ✅ **Dokumentatsioon** - Claude teab kõike

---

**Valmis!** 🚀

Nüüd saad hakata looma uusi mooduleid väga kiiresti ja süsteem haldab kõike automaatselt!

**Viimati uuendatud:** 04.12.2025
