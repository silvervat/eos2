# RIVEST PLATFORM - PROJECT MEMORY
> **Claude Code**: LOE SEE FAIL ESMALT! Kiire kontekst + viited detailidele.

**Last Updated:** 2024-11-28 19:30
**Session:** 6 (COMPLETED)
**Status:** Workflow Builder Complete - Ready for Document Editor
**Branch:** claude/setup-rivest-platform-01DCqvSnPb6nkYDmYBkruVgi
**Commit:** 8a5ef65

---

## 🎯 QUICK STATUS

```yaml
COMPLETED:
  ✅ SESSION 1: Monorepo (Turborepo + pnpm)
     - apps/web/ Next.js 14 with App Router
     - packages/ui/ shadcn/ui components
     - packages/db/ Prisma schema
     - packages/types/ TypeScript types
     - .github/workflows/ci.yml

  ✅ SESSION 2: Supabase Client + Hooks
     - lib/supabase/ (client, server, middleware)
     - lib/providers.tsx (TanStack Query)
     - lib/tenant-context.tsx
     - hooks/use-feature.ts
     - hooks/use-projects.ts

  ✅ SESSION 3: Projects List (TanStack Table)
     - components/projects/projects-table.tsx
     - Sorting, filtering, pagination
     - Mock data for demo

  ✅ SESSION 4: CMS System Foundation
     - supabase/migrations/003_cms_system.sql
     - packages/types/src/cms.types.ts
     - components/admin/cms/dynamic-fields-manager.tsx
     - app/(dashboard)/admin/cms/page.tsx
     - Admin sidebar navigation

  ✅ SESSION 5: Dynamic Fields UI
     - components/admin/cms/dynamic-field-dialog.tsx
     - components/admin/cms/dynamic-field-renderer.tsx
     - Dialog integration with DynamicFieldsManager
     - Field type editors (text, select, date, etc.)

  ✅ SESSION 6: Workflow Builder
     - components/admin/cms/workflow-builder.tsx
     - ReactFlow visual state machine editor
     - Custom StateNode component
     - Mock workflows for projects/invoices
     - Drag-to-connect transitions

NEXT:
  □ SESSION 7: Collaborative Document Editor (Tiptap + Y.js)
  □ SESSION 8: Supabase Connection (real data)
```

---

## 📁 PROJECT STRUCTURE (ACTUAL)

```
ehitusOS/
├── apps/
│   └── web/                           # Next.js 14 App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           ✅ Landing page
│       │   │   ├── layout.tsx         ✅ Root layout + Providers
│       │   │   ├── globals.css        ✅ Tailwind + Rivest theme
│       │   │   └── (dashboard)/
│       │   │       ├── layout.tsx     ✅ Dashboard layout w/ sidebar
│       │   │       ├── dashboard/     ✅ Stats page
│       │   │       ├── projects/      ✅ TanStack Table
│       │   │       └── admin/cms/     ✅ CMS admin page
│       │   ├── components/
│       │   │   ├── projects/          ✅ ProjectsTable
│       │   │   └── admin/cms/         ✅ DynamicFieldsManager, Dialog, Renderer
│       │   ├── hooks/                 ✅ useProjects, useFeature
│       │   └── lib/
│       │       ├── supabase/          ✅ client, server, middleware
│       │       ├── providers.tsx      ✅ TanStack Query
│       │       └── tenant-context.tsx ✅ Tenant provider
│       ├── middleware.ts              ✅ Auth middleware
│       └── package.json
├── packages/
│   ├── ui/                            ✅ @rivest/ui
│   │   └── src/components/            Button, Card, Input, Label, Badge
│   ├── db/                            ✅ @rivest/db
│   │   └── prisma/schema.prisma       Full schema
│   └── types/                         ✅ @rivest/types
│       └── src/
│           ├── index.ts               Core types
│           └── cms.types.ts           ✅ CMS types
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql     ✅ Core tables
│       ├── 002_rls_policies.sql       ✅ RLS policies
│       └── 003_cms_system.sql         ✅ CMS tables
├── .github/workflows/ci.yml           ✅ GitHub Actions
└── manual/
    ├── PROJECT-MEMORY.md              ⭐ This file
    └── RIVEST-COMPLETE-GUIDE.md       📖 Full reference
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables (001_initial_schema.sql) ✅
```sql
tenants, user_profiles, projects, companies, invoices,
employees, documents, audit_log
```

### CMS Tables (003_cms_system.sql) ✅
```sql
-- Dynamic Fields
dynamic_fields              -- Field definitions
dynamic_field_values        -- Field values per entity

-- Workflows
workflows                   -- Workflow definitions
workflow_history           -- Transition audit trail

-- Notifications
notification_rules         -- Trigger-based rules
notification_log           -- Sent notifications

-- Collaborative Docs
documents_collaborative    -- Real-time docs
document_versions         -- Version history
document_comments         -- Comments + mentions
document_collaborators    -- Permissions
document_presence         -- Who's online
```

---

## ⚙️ TECH STACK (Implemented)

```yaml
Monorepo:     Turborepo 2 + pnpm 9        ✅
Frontend:     Next.js 14 App Router        ✅
Database:     Supabase (PostgreSQL 15)     ⏳ Need connection
ORM:          Prisma 5                     ✅ Schema ready
UI:           shadcn/ui + Tailwind         ✅
State:        TanStack Query 5 + Zustand   ✅
Tables:       TanStack Table 8             ✅
Workflows:    ReactFlow 11                 ✅
```

---

## 📝 NEXT STEPS

### **SESSION 7: Document Editor** ⭐ NEXT
- Tiptap editor integration
- Real-time collaboration (Y.js)
- Comments and mentions
- Version history

### **SESSION 8: Supabase Connection**
Need credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

---

## 🔧 ENVIRONMENT NEEDED

```bash
# .env.local (apps/web/)
DATABASE_URL="postgresql://postgres:pass@host/db"
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

**GitHub Repo:** github.com/silvervat/ehitusOS
**Branch:** claude/setup-rivest-platform-01DCqvSnPb6nkYDmYBkruVgi

---

## 📝 COMMIT HISTORY

```
8a5ef65 - SESSION 6: Add Workflow Builder with ReactFlow
4438d5b - SESSION 5: Add Dynamic Fields UI components
43be683 - SESSION 4: Add CMS system foundation
af75997 - SESSION 3: Add TanStack Table for projects list
12beeec - SESSION 2: Add Supabase client + TanStack Query setup
561e556 - Update PROJECT-MEMORY.md with actual SESSION 1 status
9414739 - SESSION 1: Complete monorepo setup with Turborepo + pnpm
```

---

## 🎯 WHAT'S WORKING NOW

1. **Landing Page** → `/` shows Rivest Platform intro
2. **Dashboard** → `/dashboard` shows stats cards
3. **Projects** → `/projects` shows TanStack Table with mock data
4. **CMS Admin** → `/admin/cms` shows:
   - **Dynamic Fields** - Add/Edit/Delete custom fields with full type support
   - **Workflow Builder** - Visual state machine editor with ReactFlow
     - Drag states to reposition
     - Connect states to create transitions
     - Mock workflows for projects and invoices
   - Field renderer for form display
5. **UI Components** → Button, Card, Input, Label, Badge
6. **Database Schema** → 3 migrations ready for Supabase
7. **GitHub Actions** → CI/CD workflow ready

---

## 📖 REFERENCE

See `RIVEST-COMPLETE-GUIDE.md` for:
- **OSAS I:** Architecture (chapters 1-5)
- **OSAS II:** Security (chapters 6-9)
- **OSAS VIII:** Table Designer (chapters 42-47)
- **OSAS IX:** CMS System (chapters 48-54) ⭐ Current focus

---

## 📜 PIIBEL KOKKUVÕTE (Key Patterns)

### Workflow Builder (Chapter 52)
```typescript
// Use ReactFlow for visual workflow editor
import ReactFlow, { Node, Edge, Controls, Background } from 'reactflow'

// Workflow Types (from cms.types.ts)
interface Workflow {
  id: string
  name: string
  entityType: string  // 'projects' | 'invoices' | etc.
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  initialState: string
  isActive: boolean
}

interface WorkflowState {
  id: string
  name: string        // 'draft', 'review', 'approved'
  label: string       // 'Draft', 'In Review', 'Approved'
  color: string       // '#279989'
  canEdit: string[]   // ['admin', 'manager']
  canTransition: string[]
  onEnter?: WorkflowAction[]
  onExit?: WorkflowAction[]
}

interface WorkflowTransition {
  id: string
  from: string        // State ID
  to: string          // State ID
  label: string       // 'Submit for Review'
  allowedRoles: string[]
  conditions?: TransitionCondition[]
  actions?: WorkflowAction[]
  requireComment: boolean
  buttonVariant?: 'default' | 'destructive' | 'outline'
}

interface WorkflowAction {
  type: 'update_field' | 'send_notification' | 'create_task' | 'webhook'
  // ... action-specific fields
}
```

### Status Manager Pattern
```typescript
class StatusManager {
  // Get available next statuses for entity
  getAvailableStatuses(entityType, currentStatus, userRole)

  // Transition entity to new status
  transitionStatus(entityType, entityId, fromStatus, toStatus, userId, comment?)

  // Log to workflow_history table
  logStatusTransition(data)
}
```

### Default Workflow Example
```typescript
const projectWorkflow: Workflow = {
  name: 'Project Lifecycle',
  entityType: 'projects',
  initialState: 'draft',
  states: [
    { id: 'draft', name: 'draft', label: 'Mustand', color: '#94a3b8' },
    { id: 'active', name: 'active', label: 'Aktiivne', color: '#279989' },
    { id: 'review', name: 'review', label: 'Ülevaatusel', color: '#eab308' },
    { id: 'completed', name: 'completed', label: 'Lõpetatud', color: '#22c55e' },
    { id: 'archived', name: 'archived', label: 'Arhiveeritud', color: '#6b7280' }
  ],
  transitions: [
    { from: 'draft', to: 'active', label: 'Aktiveeri', allowedRoles: ['admin', 'manager'] },
    { from: 'active', to: 'review', label: 'Saada ülevaatusele', allowedRoles: ['admin', 'manager'] },
    { from: 'review', to: 'completed', label: 'Kinnita', allowedRoles: ['admin'] },
    { from: 'review', to: 'active', label: 'Tagasi töösse', allowedRoles: ['admin'] },
    { from: 'completed', to: 'archived', label: 'Arhiveeri', allowedRoles: ['admin'] }
  ]
}
```

### Notification Rules (Chapter 54)
```typescript
interface NotificationRule {
  id: string
  entityType: string
  trigger: {
    type: 'status_change' | 'field_update' | 'deadline' | 'custom'
    conditions?: object
    delay?: number  // minutes
  }
  channels: ('email' | 'sms' | 'in_app')[]
  template: string
  recipients: string[]  // User IDs or roles
  isActive: boolean
}
```

---

**Last Updated:** 2024-11-28 19:15
**Version:** 9.0 - Added Piibel patterns for Workflow Builder
