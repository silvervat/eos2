# Ultra Tables - Kiire Alustamise Juhend Claude Code'le

## 🎯 KIIRÜLEVAADE

EOS2 projektis on olemas võimas Ultra Table süsteem koos 55 erinevat tüüpi veergudega, kuid puudub admin UI. Sinu ülesanne on luua tabelite haldussüsteem.

## 📋 MIS ON VAJA TEHA (5 sammu)

### SAMM 1: Database Migration (10 min)

```bash
# Loo fail
/supabase/migrations/006_ultra_tables_system.sql
```

Kopeeri migration TABLES-IMPLEMENTATION-GUIDE.md failist jaotisest "FASE 1: Database Schema".

Käivita Supabase'is:
```bash
supabase db reset
# VÕI
supabase migration up
```

### SAMM 2: API Routes (20 min)

Loo järgmised failid täpselt nagu GUIDE'is kirjeldatud:

```
/apps/web/src/app/api/ultra-tables/
├── route.ts                        # GET, POST
├── [id]/
│   ├── route.ts                    # GET, PATCH, DELETE
│   ├── columns/
│   │   └── route.ts                # Column operations
│   └── records/
│       └── route.ts                # Record operations (pagination!)
```

**KRIITILISED FUNKTSIOONID:**
- ✅ Pagination (default 100 records per page)
- ✅ Tenant ID filtering (RLS)
- ✅ Error handling
- ✅ Created/Updated by tracking

### SAMM 3: UI Components (30 min)

#### 3.1 Create Table Dialog
```typescript
// /apps/web/src/components/admin/ultra-tables/CreateTableDialog.tsx

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/packages/ui/src/components/dialog'
import { Button } from '@/packages/ui/src/components/button'
import { Input } from '@/packages/ui/src/components/input'
import { Textarea } from '@/packages/ui/src/components/textarea'

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateTableDialog({ open, onOpenChange, onSuccess }: CreateTableDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/ultra-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          icon: '📊',
          color: '#3B82F6',
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setName('')
        setDescription('')
      }
    } catch (error) {
      console.error('Error creating table:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Loo uus tabel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tabeli nimi *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="nt. Kliendid, Projektid..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Kirjeldus</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valikuline kirjeldus..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Tühista
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Loon...' : 'Loo tabel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.2 Table Data View
```typescript
// /apps/web/src/components/admin/ultra-tables/TableDataView.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'
import { Input } from '@/packages/ui/src/components/input'
import { VirtualTable } from './VirtualTable'

interface TableDataViewProps {
  tableId: string
  columns: any[]
}

export function TableDataView({ tableId, columns }: TableDataViewProps) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRecords()
  }, [tableId, page])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ultra-tables/${tableId}/records?page=${page}&limit=100`)
      const data = await response.json()
      setRecords(data.records)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordUpdate = async (recordId: string, data: any) => {
    try {
      await fetch(`/api/ultra-tables/${tableId}/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      fetchRecords()
    } catch (error) {
      console.error('Error updating record:', error)
    }
  }

  const handleAddRecord = async () => {
    try {
      await fetch(`/api/ultra-tables/${tableId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }),
      })
      fetchRecords()
    } catch (error) {
      console.error('Error adding record:', error)
    }
  }

  if (loading && records.length === 0) {
    return <div className="text-center py-12">Laadimine...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Otsi..." />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button onClick={handleAddRecord}>
          <Plus className="w-4 h-4 mr-2" />
          Lisa rida
        </Button>
      </div>

      <VirtualTable
        columns={columns}
        records={records}
        onRecordUpdate={handleRecordUpdate}
        onRecordDelete={(id) => console.log('Delete:', id)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Eelmine
          </Button>
          <span className="text-sm text-slate-600">
            Lehekülg {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Järgmine
          </Button>
        </div>
      )}
    </div>
  )
}
```

### SAMM 4: Pages (15 min)

Kopeeri TÄPSELT GUIDE'ist:
- `/apps/web/src/app/(dashboard)/admin/ultra-tables/page.tsx`
- `/apps/web/src/app/(dashboard)/admin/ultra-tables/[id]/page.tsx`

### SAMM 5: Uuenda Menüü (5 min)

```typescript
// /apps/web/src/app/(dashboard)/layout.tsx

// Lisa import
import { Table, Menu as MenuIcon } from 'lucide-react'

// Lisa adminItems array'sse:
const adminItems = [
  { href: '/admin/cms', label: 'CMS Haldus', icon: Database },
  { href: '/admin/templates', label: 'PDF Mallid', icon: FileType },
  { href: '/admin/ultra-tables', label: 'Tabelid', icon: Table }, // ✅ UUS!
  { href: '/admin/menu', label: 'Menüü', icon: MenuIcon }, // ✅ UUS!
  { href: '/trash', label: 'Prügikast', icon: Trash2 },
  { href: '/notifications', label: 'Teavitused', icon: Bell },
  { href: '/settings', label: 'Seaded', icon: Settings },
]
```

## 🎨 STYLING RULES

**OLULINE:** Järgi range disaini:
```typescript
// Õiged värvid
const colors = {
  primary: '#279989',      // Rivest brand color
  slate: {
    50: '#f8fafc',
    900: '#0f172a',
  }
}

// Õiged shadow'id
className="hover:shadow-lg transition-shadow"

// Õiged spacing'ud
className="space-y-6"  // Vertikaalne
className="gap-4"      // Grid/Flex
```

## ⚡ PERFORMANCE NÕUDED

**KRIITILISED PUNKTID:**

1. **Virtual Scrolling** - kasuta react-window
2. **Pagination** - server-side, max 100 records per page
3. **Debounce Search** - 300ms delay
4. **IndexedDB Cache** - optional, kui tahad ekstra kiiruse

## 🧪 TESTIMINE

### Test 1: Loo tabel
```bash
1. Mine /admin/ultra-tables
2. Vajuta "Uus tabel"
3. Sisesta nimi "Test Kliendid"
4. Salvesta
5. ✅ Peaks ilmuma tabelite nimekirja
```

### Test 2: Lisa veerud
```bash
1. Ava tabel
2. Mine "Veerud" tab'ile
3. Kasuta olemasolevat ColumnManager komponenti
4. Lisa 3 veergu: Nimi (text), Email (email), Status (status)
5. ✅ Veerud peaksid ilmuma
```

### Test 3: Lisa andmed
```bash
1. Mine "Andmed" tab'ile
2. Vajuta "Lisa rida"
3. Täida veerud
4. ✅ Rida peaks ilmuma tabelisse
```

### Test 4: Performance
```bash
1. Loo 1000+ rida (kasuta API või script)
2. Kontrolli, et scroll on sujuv
3. ✅ Ei tohiks olla lagi
```

## 🐛 COMMON ERRORS & FIXES

### Error: "Cannot read property 'id' of undefined"
**Fix:** Kontrolli, et RLS policies on õigesti seadistatud

### Error: "Fetch failed"
**Fix:** Kontrolli API route'i ja Supabase ühendust

### Error: "Table not found"
**Fix:** Veendu, et migration on käivitatud

## 📦 DEPENDENCIES

Lisa package.json'i:
```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "@hello-pangea/dnd": "^16.5.0"
  }
}
```

Installi:
```bash
pnpm install
```

## ✅ CHECKLIST CLAUDE CODE'LE

- [ ] Migration loodud ja käivitatud
- [ ] API routes loodud (4 faili)
- [ ] CreateTableDialog komponent
- [ ] TableDataView komponent
- [ ] VirtualTable komponent
- [ ] Tables list page
- [ ] Table detail page
- [ ] Menüü uuendatud
- [ ] Dependencies installitud
- [ ] Testitud 1000+ ridaga

## 🚀 START CODING!

Alusta SAMM 1'st ja järgi täpselt TABLES-IMPLEMENTATION-GUIDE.md faili. Iga komponendi jaoks on seal täpne kood.

**OLULINE:** Ära leia uusi lahendusi - kasuta TÄPSELT seda, mis guide'is kirjas. See on testimata ja töötab.

## 📞 KÜSIMUSED?

Kui miski on ebaselge:
1. Vaata TABLES-IMPLEMENTATION-GUIDE.md täielikku dokumentatsiooni
2. Kontrolli olemasolevaid komponente /components/admin/ultra-table/ kaustas
3. Vaata column types registry.ts faili - seal on kõik 55 tüüpi defineeritud

## 🎯 TULEMUS

Pärast implementeerimist saad:
- ✅ Tabelite halduse admin UI's
- ✅ 55 erinevat veeru tüüpi
- ✅ Virtual scrolling 1M+ ridadega
- ✅ Drag & drop menüü haldus
- ✅ Professional admin dashboard

**Edu töö juures!** 🚀
