'use client'

import { useState } from 'react'
import { Button, Card, Badge, Input } from '@rivest/ui'
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  Clock,
  Folder,
  FileText,
  Users,
  Filter,
  X,
  CheckSquare,
  Square,
  Calendar,
  MoreVertical,
  AlertCircle,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

// Types
interface TrashedItem {
  id: string
  type: 'project' | 'invoice' | 'document' | 'employee' | 'company'
  name: string
  deletedAt: Date
  deletedBy: string
  expiresAt: Date
  metadata?: Record<string, unknown>
}

// Mock data
const MOCK_TRASHED_ITEMS: TrashedItem[] = [
  {
    id: '1',
    type: 'project',
    name: 'Vana maja renoveerimine',
    deletedAt: new Date('2024-03-15'),
    deletedBy: 'Admin Kasutaja',
    expiresAt: new Date('2024-04-14'),
    metadata: { client: 'Mets OÜ', budget: 45000 },
  },
  {
    id: '2',
    type: 'invoice',
    name: 'Arve #2024-089',
    deletedAt: new Date('2024-03-18'),
    deletedBy: 'Admin Kasutaja',
    expiresAt: new Date('2024-04-17'),
    metadata: { amount: 5600, client: 'Puu AS' },
  },
  {
    id: '3',
    type: 'document',
    name: 'Lepingu mustand v2.docx',
    deletedAt: new Date('2024-03-19'),
    deletedBy: 'Mari Maasikas',
    expiresAt: new Date('2024-04-18'),
  },
  {
    id: '4',
    type: 'employee',
    name: 'Jaan Tamm',
    deletedAt: new Date('2024-03-10'),
    deletedBy: 'Admin Kasutaja',
    expiresAt: new Date('2024-04-09'),
    metadata: { position: 'Ehitaja', email: 'jaan@example.com' },
  },
  {
    id: '5',
    type: 'project',
    name: 'Katuse remont',
    deletedAt: new Date('2024-03-05'),
    deletedBy: 'Admin Kasutaja',
    expiresAt: new Date('2024-04-04'),
  },
]

const TYPE_LABELS: Record<TrashedItem['type'], string> = {
  project: 'Projekt',
  invoice: 'Arve',
  document: 'Dokument',
  employee: 'Töötaja',
  company: 'Ettevõte',
}

const TYPE_ICONS: Record<TrashedItem['type'], React.ComponentType<{ className?: string }>> = {
  project: Folder,
  invoice: FileText,
  document: FileText,
  employee: Users,
  company: Folder,
}

const TYPE_COLORS: Record<TrashedItem['type'], string> = {
  project: 'bg-blue-100 text-blue-700',
  invoice: 'bg-green-100 text-green-700',
  document: 'bg-purple-100 text-purple-700',
  employee: 'bg-amber-100 text-amber-700',
  company: 'bg-cyan-100 text-cyan-700',
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashedItem[]>(MOCK_TRASHED_ITEMS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<TrashedItem['type'] | 'all'>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Dialogs
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false)
  const [actionItem, setActionItem] = useState<TrashedItem | null>(null)

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || item.type === selectedType
    return matchesSearch && matchesType
  })

  // Calculate days until permanent deletion
  const getDaysUntilDeletion = (expiresAt: Date) => {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    setSelectedItems(new Set(filteredItems.map((item) => item.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  // Restore single item
  const handleRestore = (item: TrashedItem) => {
    setActionItem(item)
    setRestoreDialogOpen(true)
  }

  const confirmRestore = () => {
    if (actionItem) {
      setItems(items.filter((i) => i.id !== actionItem.id))
      setSelectedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionItem.id)
        return newSet
      })
    }
    setRestoreDialogOpen(false)
    setActionItem(null)
  }

  // Delete permanently
  const handleDelete = (item: TrashedItem) => {
    setActionItem(item)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (actionItem) {
      setItems(items.filter((i) => i.id !== actionItem.id))
      setSelectedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionItem.id)
        return newSet
      })
    }
    setDeleteDialogOpen(false)
    setActionItem(null)
  }

  // Bulk restore
  const handleBulkRestore = () => {
    setItems(items.filter((i) => !selectedItems.has(i.id)))
    setSelectedItems(new Set())
  }

  // Bulk delete
  const handleBulkDelete = () => {
    setItems(items.filter((i) => !selectedItems.has(i.id)))
    setSelectedItems(new Set())
  }

  // Empty trash
  const handleEmptyTrash = () => {
    setItems([])
    setSelectedItems(new Set())
    setEmptyTrashDialogOpen(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prügikast</h1>
            <p className="text-slate-500">
              {items.length} elementi • Kustutatakse automaatselt 30 päeva pärast
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setEmptyTrashDialogOpen(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Tühjenda prügikast
          </Button>
        )}
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Elemendid kustutatakse püsivalt 30 päeva pärast
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Taastage vajalikud elemendid enne aegumist. Pärast püsivat kustutamist
              pole taastamine võimalik.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Otsi prügikastist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TrashedItem['type'] | 'all')}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#279989]"
          >
            <option value="all">Kõik tüübid</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedItems.size > 0 && (
        <div className="bg-slate-100 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              {selectedItems.size} valitud
            </span>
            <button
              onClick={deselectAll}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Tühista valik
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkRestore} className="gap-1">
              <RotateCcw className="w-4 h-4" />
              Taasta valitud
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Kustuta püsivalt
            </Button>
          </div>
        </div>
      )}

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {items.length === 0 ? 'Prügikast on tühi' : 'Ühtegi elementi ei leitud'}
          </h3>
          <p className="text-slate-500">
            {items.length === 0
              ? 'Kustutatud elemendid ilmuvad siia'
              : 'Proovige muuta otsingu tingimusi'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <button
              onClick={selectedItems.size === filteredItems.length ? deselectAll : selectAll}
              className="text-slate-400 hover:text-slate-600"
            >
              {selectedItems.size === filteredItems.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <span className="flex-1 text-sm font-medium text-slate-600">Nimi</span>
            <span className="w-24 text-sm font-medium text-slate-600">Tüüp</span>
            <span className="w-40 text-sm font-medium text-slate-600">Kustutatud</span>
            <span className="w-28 text-sm font-medium text-slate-600">Aegub</span>
            <span className="w-20"></span>
          </div>

          {/* Items */}
          {filteredItems.map((item) => {
            const Icon = TYPE_ICONS[item.type]
            const daysLeft = getDaysUntilDeletion(item.expiresAt)
            const isSelected = selectedItems.has(item.id)
            const isExpiringSoon = daysLeft <= 7

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#279989]" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[item.type]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      Kustutaja: {item.deletedBy}
                    </p>
                  </div>
                </div>

                <div className="w-24">
                  <Badge className={`text-xs ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </Badge>
                </div>

                <div className="w-40 flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {item.deletedAt.toLocaleDateString('et-EE')}
                </div>

                <div className="w-28">
                  <span
                    className={`text-sm font-medium ${
                      isExpiringSoon ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {daysLeft > 0 ? `${daysLeft} päeva` : 'Täna'}
                  </span>
                  {isExpiringSoon && (
                    <AlertCircle className="w-4 h-4 text-red-500 inline ml-1" />
                  )}
                </div>

                <div className="w-20 flex items-center gap-1 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    title="Taasta"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:bg-red-50"
                    title="Kustuta püsivalt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Restore dialog */}
      <ConfirmationDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Taasta element"
        message={
          <>
            Kas soovite taastada elemendi{' '}
            <strong className="text-slate-900">{actionItem?.name}</strong>?
          </>
        }
        variant="success"
        confirmLabel="Taasta"
        onConfirm={confirmRestore}
      />

      {/* Delete dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kustuta püsivalt"
        message={
          <>
            Kas olete kindel, et soovite püsivalt kustutada elemendi{' '}
            <strong className="text-slate-900">{actionItem?.name}</strong>? See
            toiming on pöördumatu!
          </>
        }
        variant="danger"
        confirmLabel="Kustuta püsivalt"
        confirmDestructive
        onConfirm={confirmDelete}
      />

      {/* Empty trash dialog */}
      <ConfirmationDialog
        open={emptyTrashDialogOpen}
        onOpenChange={setEmptyTrashDialogOpen}
        title="Tühjenda prügikast"
        message={
          <>
            Kas olete kindel, et soovite püsivalt kustutada{' '}
            <strong className="text-slate-900">{items.length} elementi</strong>?
            See toiming on pöördumatu ja kõik elemendid kustutatakse lõplikult!
          </>
        }
        variant="danger"
        confirmLabel="Tühjenda prügikast"
        confirmDestructive
        requireTypedConfirmation="KUSTUTA"
        onConfirm={handleEmptyTrash}
      />
    </div>
  )
}
