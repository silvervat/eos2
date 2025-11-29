# RIVEST ULTRA TABLE - CLAUDE CODE QUICK START

🚀 **Production-Ready Implementation Guide for Claude Code**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Implementation Order](#implementation-order)
4. [File Generation Commands](#file-generation-commands)
5. [Testing Commands](#testing-commands)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## 1. PREREQUISITES

### Required Software

```bash
# Check versions
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
git --version   # Should be 2.x or higher

# Install if missing
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Required Accounts

- ✅ Supabase account (database + storage)
- ✅ Redis instance (Upstash or local)
- ✅ GitHub account (version control)

### Supabase Setup

```bash
# 1. Create new Supabase project
# Go to: https://supabase.com/dashboard
# Project name: rivest-platform-production
# Region: EU Central 1 (Frankfurt)

# 2. Get credentials
# Settings > API > Project URL & anon key

# 3. Create storage bucket
# Storage > Create bucket
# Name: ultra-table-attachments
# Public: Yes
```

---

## 2. PROJECT SETUP

### Step 1: Clone Repository

```bash
# Clone the base Rivest Platform
git clone https://github.com/yourcompany/rivest-platform.git
cd rivest-platform

# Install dependencies
npm install
```

### Step 2: Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

```bash
# .env contents

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://cohhjvtmmchrttntoizw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Database
DATABASE_URL="postgresql://postgres:[password]@db.cohhjvtmmchrttntoizw.supabase.co:5432/postgres"

# Redis (optional for caching)
REDIS_URL="redis://localhost:6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Performance
NEXT_PUBLIC_ENABLE_CACHE=true
NEXT_PUBLIC_CACHE_SIZE_MB=50
NEXT_PUBLIC_WORKER_COUNT=4
```

### Step 3: Database Migration

```bash
# Navigate to db package
cd packages/db

# Run migrations
npx prisma migrate dev --name init_ultra_table_system

# Generate Prisma Client
npx prisma generate

# Verify database
npx prisma studio
# Opens at http://localhost:5555
```

---

## 3. IMPLEMENTATION ORDER

### Phase 1: Database & Types (Day 1)

```bash
# 1. Update Prisma schema
code packages/db/prisma/schema.prisma
```

Add models from GITHUB-IMPLEMENTATION-GUIDE.md Section 3:
- UltraTable
- UltraTableColumn
- UltraTableRow
- UltraTableView
- UltraDialog
- UserGroup
- UltraTablePermission
- UltraColumnPermission
- UltraRowPolicy

```bash
# 2. Generate migration
npx prisma migrate dev --name add_ultra_table_models

# 3. Generate types
npx prisma generate
```

### Phase 2: Column Types System (Days 2-3)

```bash
# Install dependencies
cd apps/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @tanstack/react-virtual @tanstack/react-query
npm install qrcode.react exceljs jspdf jspdf-autotable
npm install idb zod react-signature-canvas
npm install lucide-react
```

```bash
# Create directory structure
mkdir -p src/lib/ultra-table/column-types
mkdir -p src/lib/ultra-table/permissions
mkdir -p src/lib/ultra-table/cache
mkdir -p src/lib/ultra-table/workers
mkdir -p src/lib/ultra-table/formulas

# Create column type files (55 types)
# Use template from GITHUB-IMPLEMENTATION-GUIDE.md Section 4
```

**CRITICAL: Create these files in order:**

1. `types.ts` - Base types
2. `registry.ts` - Column type registry
3. Basic types:
   - `text.tsx`
   - `number.tsx`
   - `checkbox.tsx`
4. Selection types:
   - `dropdown.tsx`
   - `multi-select.tsx`
   - `tags.tsx`
5. Relation types:
   - `relation.tsx`
   - `lookup.tsx`
   - `rollup.tsx`
   - `count.tsx`
6. All remaining 45 types...

### Phase 3: Components (Days 4-5)

```bash
# Create component structure
mkdir -p src/components/admin/ultra-table/column-manager
mkdir -p src/components/admin/ultra-table/dialog-designer
mkdir -p src/components/admin/ultra-table/permissions
mkdir -p src/components/shared/ultra-table
```

**Create components in this order:**

1. **Column Manager** (Day 4 AM)
   ```bash
   # Files to create:
   src/components/admin/ultra-table/column-manager/index.tsx
   src/components/admin/ultra-table/column-manager/ColumnList.tsx
   src/components/admin/ultra-table/column-manager/ColumnEditor.tsx
   src/components/admin/ultra-table/column-manager/ColumnTypeSelector.tsx
   ```

2. **Dialog Designer** (Day 4 PM)
   ```bash
   # Files to create:
   src/components/admin/ultra-table/dialog-designer/index.tsx
   src/components/admin/ultra-table/dialog-designer/FieldToolbar.tsx
   src/components/admin/ultra-table/dialog-designer/DesignerCanvas.tsx
   src/components/admin/ultra-table/dialog-designer/PropertiesPanel.tsx
   ```

3. **Ultra Table Component** (Day 5)
   ```bash
   # Files to create:
   src/components/shared/ultra-table/index.tsx
   src/components/shared/ultra-table/TableHeader.tsx
   src/components/shared/ultra-table/TableRow.tsx
   src/components/shared/ultra-table/TableFooter.tsx
   src/components/shared/ultra-table/DynamicCell.tsx
   src/components/shared/ultra-table/hooks/useUltraTable.ts
   ```

### Phase 4: Performance & Caching (Days 6-7)

```bash
# Create performance files
```

1. **IndexedDB Cache** (Day 6 AM)
   ```bash
   src/lib/ultra-table/cache/indexed-db-cache.ts
   ```

2. **Data Loader** (Day 6 PM)
   ```bash
   src/lib/ultra-table/data/data-loader.ts
   ```

3. **Web Workers** (Day 7)
   ```bash
   src/lib/ultra-table/workers/worker-pool.ts
   src/lib/ultra-table/workers/calculation-worker.ts
   ```

### Phase 5: Permissions (Days 8-9)

```bash
# Create permission files
src/lib/ultra-table/permissions/permission-service.ts

src/components/admin/ultra-table/permissions/PermissionManager.tsx
src/components/admin/ultra-table/permissions/TablePermissions.tsx
src/components/admin/ultra-table/permissions/ColumnPermissions.tsx
src/components/admin/ultra-table/permissions/RowPolicies.tsx
```

### Phase 6: API Endpoints (Days 10-11)

```bash
cd apps/api

# Create route structure
mkdir -p src/routes/ultra-tables

# Create endpoints
src/routes/ultra-tables/index.ts          # List tables
src/routes/ultra-tables/[id]/index.ts     # Get/Update table
src/routes/ultra-tables/[id]/rows.ts      # CRUD rows
src/routes/ultra-tables/[id]/columns.ts   # CRUD columns
src/routes/ultra-tables/[id]/views.ts     # CRUD views
```

### Phase 7: Testing (Days 12-14)

```bash
# Install test dependencies
npm install -D vitest @playwright/test

# Create test files
mkdir -p apps/web/src/lib/ultra-table/__tests__
mkdir -p apps/web/e2e
```

---

## 4. FILE GENERATION COMMANDS

### Auto-Generate Column Type

```bash
# Create new column type from template
npm run generate:column-type -- --name="MyCustomType" --category="custom"

# This generates:
# - src/lib/ultra-table/column-types/my-custom-type.tsx
# - Adds to registry.ts
# - Creates test file
```

### Auto-Generate Component

```bash
# Create new admin component
npm run generate:component -- --name="MyComponent" --type="admin"

# Create new shared component
npm run generate:component -- --name="MyComponent" --type="shared"
```

### Auto-Generate API Route

```bash
# Create new API endpoint
npm run generate:api-route -- --path="/ultra-tables/[id]/my-endpoint"

# Generates:
# - apps/api/src/routes/ultra-tables/[id]/my-endpoint.ts
# - With authentication & permission checks
```

---

## 5. TESTING COMMANDS

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test column-types.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e ultra-table.spec.ts

# Debug mode
npm run test:e2e:debug
```

### Performance Tests

```bash
# Run performance benchmarks
npm run test:performance

# Load test with 1M rows
npm run test:load-1m

# Measure FPS
npm run test:fps
```

---

## 6. COMMON ISSUES & SOLUTIONS

### Issue 1: Prisma Client Not Found

```bash
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
cd packages/db
npx prisma generate
cd ../..
npm run build
```

### Issue 2: Supabase Connection Failed

```bash
Error: Connection to database failed
```

**Solution:**
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
cd packages/db
npx prisma db pull

# If still fails, check:
# 1. Supabase project is running
# 2. IP whitelist allows your IP
# 3. Password is URL-encoded
```

### Issue 3: Web Worker Not Loading

```bash
Error: Failed to load worker
```

**Solution:**
```bash
# Check Next.js config
# next.config.js should have:

const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' }
    })
    return config
  }
}
```

### Issue 4: IndexedDB Quota Exceeded

```bash
Error: QuotaExceededError
```

**Solution:**
```bash
# Clear IndexedDB cache
# In browser console:
indexedDB.deleteDatabase('ultra-table-cache')

# Or reduce cache size in .env:
NEXT_PUBLIC_CACHE_SIZE_MB=25
```

### Issue 5: Slow Table Loading (1M+ rows)

**Solution:**

1. **Check indexes:**
```sql
-- Run in Supabase SQL editor
CREATE INDEX CONCURRENTLY idx_rows_table_order 
ON ultra_table_rows(table_id, "order");

CREATE INDEX CONCURRENTLY idx_rows_data_gin 
ON ultra_table_rows USING GIN (data);
```

2. **Enable caching:**
```bash
# .env
NEXT_PUBLIC_ENABLE_CACHE=true
REDIS_URL="redis://localhost:6379"
```

3. **Increase worker count:**
```bash
# .env
NEXT_PUBLIC_WORKER_COUNT=8
```

---

## 7. DEVELOPMENT CHECKLIST

### Before Starting

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Database credentials configured
- [ ] Redis running (optional)
- [ ] Git repository initialized

### Phase 1: Database ✅

- [ ] Prisma schema updated
- [ ] Migrations applied
- [ ] Prisma Client generated
- [ ] Database accessible

### Phase 2: Column Types ✅

- [ ] All 55 types created
- [ ] Registry configured
- [ ] Type tests passing
- [ ] Components rendering

### Phase 3: UI Components ✅

- [ ] Column Manager working
- [ ] Dialog Designer working
- [ ] Ultra Table rendering
- [ ] Virtual scrolling smooth

### Phase 4: Performance ✅

- [ ] IndexedDB caching
- [ ] Data loader prefetching
- [ ] Web Workers calculating
- [ ] 60 FPS achieved

### Phase 5: Permissions ✅

- [ ] Table permissions working
- [ ] Column permissions working
- [ ] Row policies working
- [ ] RLS enabled

### Phase 6: API ✅

- [ ] All endpoints created
- [ ] Authentication working
- [ ] Permissions checked
- [ ] Responses cached

### Phase 7: Testing ✅

- [ ] Unit tests >90% coverage
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Load test successful

---

## 8. READY TO DEPLOY

When all checklists are complete:

```bash
# 1. Build for production
npm run build

# 2. Run final tests
npm run test:all

# 3. Deploy
npm run deploy

# 4. Verify
npm run verify:production
```

---

## 9. SUPPORT

**Questions?**
- Email: silver@rivest.ee
- Guide: GITHUB-IMPLEMENTATION-GUIDE.md
- Issues: GitHub Issues

**Happy Building! 🚀**
