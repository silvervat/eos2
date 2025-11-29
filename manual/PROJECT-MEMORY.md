# RIVEST PLATFORM - PROJECT MEMORY
> **Claude Code**: LOE SEE FAIL ESMALT! Kiire kontekst + viited detailidele.

**Last Updated:** 2025-11-28 22:30
**Session:** 8++ (Dashboard Charts)
**Status:** All UI + Form Builder + Auth + Charts complete
**Branch:** claude/setup-rivest-platform-01DCqvSnPb6nkYDmYBkruVgi
**Commit:** f2d5dd5

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

  ✅ SESSION 7: Document Editor
     - components/docs/document-editor.tsx
     - Tiptap rich text editor with toolbar
     - app/(dashboard)/documents/ - list page
     - app/(dashboard)/documents/[id]/ - editor page
     - Tables, images, links, headings support
     - Auto-save and version tracking ready

  ✅ SESSION 8: Form Builder (JotForm style)
     - components/admin/form-builder/ - Full form builder
     - Drag-and-drop field palette (dnd-kit)
     - Field types: text, email, phone, number, textarea
     - Choice fields: select, radio, checkbox, multi-select
     - Date/time fields: date, time, datetime
     - Advanced: file upload, signature, rating, slider
     - Display: heading, paragraph, divider
     - Field properties panel with validation
     - Form settings and theme customization
     - CMS Admin "Vormid" tab integration

  ✅ SESSION 8+: Auth UI (Login/Register)
     - app/(auth)/layout.tsx - Auth layout with header/footer
     - app/(auth)/login/ - Login page with demo credentials
     - app/(auth)/register/ - Register with password validation
     - app/(auth)/forgot-password/ - Password reset flow
     - Social login buttons (Google, GitHub) - ready for OAuth
     - Estonian language UI throughout

  ✅ SESSION 8++: Dashboard Charts (recharts)
     - Revenue vs Expenses AreaChart (12 months)
     - Project Status PieChart (donut style)
     - Monthly Projects BarChart (started vs completed)
     - Enhanced stat cards with trend indicators
     - Color-coded activity items by type
     - Estonian language labels

NEXT:
  □ SESSION 9: Supabase Connection (real data)
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
│       │   │   ├── (auth)/
│       │   │   │   ├── layout.tsx     ✅ Auth layout
│       │   │   │   ├── login/         ✅ Login page
│       │   │   │   ├── register/      ✅ Register page
│       │   │   │   └── forgot-password/ ✅ Password reset
│       │   │   └── (dashboard)/
│       │   │       ├── layout.tsx     ✅ Dashboard layout w/ sidebar
│       │   │       ├── dashboard/     ✅ Stats page
│       │   │       ├── projects/      ✅ TanStack Table
│       │   │       └── admin/cms/     ✅ CMS admin page
│       │   │       └── documents/     ✅ Documents list + editor
│       │   ├── components/
│       │   │   ├── projects/          ✅ ProjectsTable
│       │   │   ├── docs/              ✅ DocumentEditor with toolbar
│       │   │   ├── admin/cms/         ✅ DynamicFieldsManager, Dialog, Renderer, WorkflowBuilder
│       │   │   └── admin/form-builder/ ✅ FormBuilder, FieldPalette, FieldProperties, FormCanvas
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
Documents:    Tiptap 3                     ✅
```

---

## 📝 NEXT STEPS

### **SESSION 8: Supabase Connection** ⭐ NEXT
Need credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

Tasks:
- Connect to real Supabase database
- Run migrations
- Replace mock data with real queries
- Add authentication

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
039e907 - Add Invoices, Employees, and Settings pages
2674269 - SESSION 7: Add Document Editor with Tiptap
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
4. **Invoices** → `/invoices` shows:
   - Invoice list with TanStack Table
   - Stats cards (total, paid, pending, overdue)
   - Search and sorting
5. **Employees** → `/employees` shows:
   - Employee list with avatars
   - Department badges, contact links
   - Stats (total, active, on leave)
6. **Documents** → `/documents` shows:
   - Document list with filters
   - Rich Text Editor (Tiptap) with full toolbar
7. **Settings** → `/settings` shows:
   - Profile, Company, Notifications, Security, Appearance, Language tabs
   - Form inputs and toggles
8. **CMS Admin** → `/admin/cms` shows:
   - **Dynamic Fields** - Add/Edit/Delete custom fields
   - **Workflow Builder** - Visual state machine editor
9. **Database Schema** → 3 migrations ready for Supabase
10. **GitHub Actions** → CI/CD workflow ready

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

### Document Editor (SESSION 7)
```typescript
// Tiptap rich text editor with extensions
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

// Editor setup
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Alusta kirjutamist...' }),
    Link.configure({ openOnClick: false }),
    Image.configure({ inline: true, allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow, TableHeader, TableCell,
  ],
  content: document.content,
  onUpdate: ({ editor }) => {
    // Auto-save to database
    saveDocument(documentId, editor.getJSON())
  },
})

// Toolbar commands
editor.chain().focus().toggleBold().run()
editor.chain().focus().toggleHeading({ level: 1 }).run()
editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
editor.chain().focus().setImage({ src: url }).run()
```

### Form Builder (SESSION 8)
```typescript
// Visual drag-and-drop form builder (JotForm style)
import { DndContext, DragEndEvent, pointerWithin } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'

// Field Types (from types.ts)
type FieldType =
  | 'text' | 'email' | 'phone' | 'number' | 'url' | 'textarea'
  | 'select' | 'radio' | 'checkbox' | 'multi_select'
  | 'date' | 'time' | 'datetime'
  | 'file_upload' | 'signature' | 'rating' | 'slider'
  | 'heading' | 'paragraph' | 'divider'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  description?: string
  required: boolean
  validation?: ValidationRule[]
  options?: FieldOption[]          // For select/radio/checkbox
  width?: 'full' | 'half' | 'third'
  settings?: Record<string, unknown>
}

interface FormTemplate {
  id: string
  name: string
  fields: FormField[]
  settings: FormSettings
  theme: FormTheme
}

// Components structure
// - FormBuilder: Main component with tabs (build/settings/theme)
// - FieldPalette: Sidebar with draggable field types
// - FormCanvas: Drop zone with sortable fields
// - FieldProperties: Right panel for editing selected field

// DnD setup
<DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
  <FieldPalette />
  <FormCanvas fields={fields} selectedFieldId={selectedField?.id} />
  <FieldProperties field={selectedField} onUpdate={handleFieldUpdate} />
</DndContext>
```

---

**Last Updated:** 2025-11-28 22:00
**Version:** 12.0 - Added Auth UI pages (SESSION 8+)
