'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Settings,
  Columns,
  LayoutGrid,
  Calendar,
  Users,
  FileText,
  Package,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'

// Mock data for demo
const mockTables = [
  {
    id: '1',
    name: 'Projektid',
    description: 'Kõik projektid ja nende staatused',
    icon: FolderIcon,
    columns: 12,
    rows: 156,
    views: 3,
    modified: '2025-11-28',
  },
  {
    id: '2',
    name: 'Kliendid',
    description: 'Klientide andmebaas',
    icon: Users,
    columns: 8,
    rows: 423,
    views: 2,
    modified: '2025-11-27',
  },
  {
    id: '3',
    name: 'Arved',
    description: 'Arvete register',
    icon: FileText,
    columns: 15,
    rows: 1250,
    views: 4,
    modified: '2025-11-26',
  },
  {
    id: '4',
    name: 'Tooted',
    description: 'Toodete kataloog',
    icon: Package,
    columns: 10,
    rows: 89,
    views: 2,
    modified: '2025-11-25',
  },
  {
    id: '5',
    name: 'Üritused',
    description: 'Ürituste kalender',
    icon: Calendar,
    columns: 7,
    rows: 34,
    views: 1,
    modified: '2025-11-24',
  },
]

function FolderIcon({ className }: { className?: string }) {
  return <LayoutGrid className={className} />
}

export default function TablesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTables = mockTables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Table2 className="w-7 h-7" style={{ color: '#279989' }} />
            Tabelid
          </h1>
          <p className="text-slate-600 mt-1">
            Halda dünaamilisi tabeleid ja andmebaase
          </p>
        </div>
        <Button className="gap-2" style={{ backgroundColor: '#279989' }}>
          <Plus className="w-4 h-4" />
          Uus tabel
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Otsi tabeleid..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Tables grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(table => {
          const Icon = table.icon

          return (
            <Card key={table.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#279989' + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#279989' }} />
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <Link href={`/admin/tables/${table.id}`}>
                <h3 className="font-semibold text-slate-900 hover:text-primary transition-colors">
                  {table.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {table.description}
              </p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Columns className="w-4 h-4" />
                  {table.columns} veergu
                </div>
                <div className="flex items-center gap-1">
                  <LayoutGrid className="w-4 h-4" />
                  {table.rows} rida
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {table.views} vaadet
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link href={`/admin/tables/${table.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Eye className="w-4 h-4" />
                    Ava
                  </Button>
                </Link>
                <Link href={`/admin/tables/${table.id}/columns`}>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )
        })}

        {/* New table card */}
        <Card className="p-5 border-dashed border-2 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-primary hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-900">Loo uus tabel</h3>
          <p className="text-sm text-slate-500 mt-1">
            Alusta tühja tabeliga
          </p>
        </Card>
      </div>

      {/* Empty state */}
      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Table2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            Tabeleid ei leitud
          </h3>
          <p className="mt-2 text-slate-500">
            Proovi muuta otsingut või loo uus tabel.
          </p>
        </div>
      )}
    </div>
  )
}
