# EOS2 - Rivest ERP System

## Project Overview
EOS2 on modulaarne ERP süsteem, mis on ehitatud Next.js 14, Supabase ja TypeScript'iga. Keel: eesti keel (Estonian UI).

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Monorepo**: Turborepo + pnpm workspaces
- **Deploy**: Vercel

## Brand
- **Primary color**: `#279989` (Rivest teal)
- **Company**: Rivest

## Project Structure
```
apps/
  web/                      # Main Next.js application
    src/
      app/
        (auth)/             # Auth pages (login, register, forgot-password)
        (dashboard)/        # Protected dashboard pages
          admin/            # Admin pages (CMS, templates, ultra-tables)
          dashboard/        # Main dashboard
          projects/         # Projects module with sub-types (PTV, Montaaž, Müük, etc.)
          partners/         # Partners module (companies, contacts)
          quotes/           # Quotes module (inquiries, sent, articles, units, statistics)
          personnel/        # Personnel module (employees, groups)
          warehouse/        # Warehouse module (assets, transfers, maintenance)
          invoices/         # Invoices
          documents/        # Documents
          file-vault/       # File storage with thumbnails
          reports/          # Reports
        api/                # API routes
      components/           # Reusable components
      lib/                  # Utilities, Supabase clients
supabase/
  migrations/               # Database migrations (001-009)
```

## Key Modules

### Partners (Partnerid)
- `/partners` - Partners list with filtering, stats
- `/partners/[id]` - Partner detail with tabs: overview, contacts, invoices, projects
- API: `/api/partners`, `/api/partners/[id]`, `/api/partners/[id]/contacts`
- DB tables: `companies`, `company_contacts`, `company_roles`

### Quotes (Hinnapakkumised)
- `/quotes` - Quotes overview with quick links
- `/quotes/inquiries` - Quote requests (Päringud)
- `/quotes/sent` - Sent quotes (Saadetud)
- `/quotes/articles` - Reusable quote items (Artiklid)
- `/quotes/units` - Measurement units (Ühikud)
- `/quotes/statistics` - Analytics dashboard (Statistika)
- API: `/api/quotes`, `/api/quotes/inquiries`, `/api/quotes/articles`, `/api/quotes/units`
- DB tables: `quotes`, `quote_items`, `quote_articles`, `quote_units`, `inquiries`

### Projects (Projektid)
- Sub-types: PTV, Montaaž, Müük, Vahendus, Rent
- `/projects` - All projects
- `/projects/[type]` - Filtered by type

### Personnel (Personaal)
- `/personnel` - Overview
- `/personnel/employees` - Employees list
- `/personnel/groups` - Groups/teams

### Warehouse (Laohaldus)
- `/warehouse` - Overview
- `/warehouse/assets` - Assets management
- `/warehouse/transfers` - Transfers
- `/warehouse/maintenance` - Maintenance records

### File Vault (Failid)
- Virtual scrolling with 50 items per batch
- Thumbnail generation for images
- File preview modal

## Database Migrations
1. `001_initial_schema.sql` - Core tables
2. `002_companies.sql` - Companies table
3. `003_projects.sql` - Projects table
4. `004_user_profiles.sql` - User profiles with roles
5. `005_audit_system.sql` - Audit logging
6. `006_files.sql` - File storage
7. `007_personnel.sql` - Personnel tables
8. `008_warehouse.sql` - Warehouse tables
9. `009_partners_quotes.sql` - Partners & quotes tables

## Sidebar Navigation
Located in `/apps/web/src/app/(dashboard)/layout.tsx`:
- Töölaud (Dashboard)
- Projektid (Projects) - expandable submenu
- Partnerid (Partners)
- Pakkumised (Quotes) - expandable submenu
- Personaal (Personnel) - expandable submenu
- Laohaldus (Warehouse) - expandable submenu
- Arved (Invoices)
- Dokumendid (Documents)
- Failid (File Vault)
- Aruanded (Reports)
- Admin section: CMS, Mallid, Tabelid, Prügi, Teavitused, Seaded

## Authentication
- Supabase Auth with email/password
- Login redirects admins to `/admin/cms`, others to `/dashboard`
- Middleware handles session refresh and route protection
- No public registration (admin creates users)

## API Patterns
- All API routes in `/apps/web/src/app/api/`
- Use `createClient()` from `@/lib/supabase/server`
- Return JSON with typed responses
- Handle errors with appropriate status codes

## UI Patterns
- Estonian language for all labels
- Lucide icons (don't use `title` prop directly - wrap in span)
- Stats cards at top of list pages
- Search + filter controls
- Tables with hover states
- Modals for add/edit forms
- Loading spinners with brand color

## Recent Changes (Session)
1. Removed landing page - direct redirect to login
2. Removed registration link (admin manages users)
3. Optimized login performance (removed duplicate getUser() calls)
4. Added Partners module with full CRUD
5. Added Quotes module with all sub-pages
6. Updated sidebar with new navigation items

## Known Issues
- Lucide-react icons don't accept `title` prop - use `<span title="..."><Icon /></span>`
- Need to run migrations in Supabase dashboard for new tables
