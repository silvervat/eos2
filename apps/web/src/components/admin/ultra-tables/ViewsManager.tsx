'use client'

import { useState } from 'react'
import { Grid3x3, LayoutList, Calendar, Image, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'

interface ViewsManagerProps {
  tableId: string
  views: any[]
  onUpdate: () => void
}

const VIEW_TYPES = [
  { type: 'grid', label: 'Grid vaade', description: 'Klassikaline tabelivaade', icon: Grid3x3 },
  { type: 'kanban', label: 'Kanban tahvel', description: 'Veergudesse grupeeritud kaardid', icon: LayoutList },
  { type: 'calendar', label: 'Kalender', description: 'Kuupäeva-põhine vaade', icon: Calendar },
  { type: 'gallery', label: 'Galerii', description: 'Piltide galerii vaade', icon: Image },
]

export function ViewsManager({ tableId, views, onUpdate }: ViewsManagerProps) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreateView = async (type: string) => {
    setCreating(true)
    try {
      const viewType = VIEW_TYPES.find((vt) => vt.type === type)
      const response = await fetch(`/api/ultra-tables/${tableId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: viewType?.label || `${type} vaade`,
          type,
        }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error creating view:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Kas oled kindel, et soovid vaate kustutada?')) return

    try {
      await fetch(`/api/ultra-tables/${tableId}/views?viewId=${viewId}`, {
        method: 'DELETE',
      })
      onUpdate()
    } catch (error) {
      console.error('Error deleting view:', error)
    }
  }

  const handleUpdateView = async (viewId: string) => {
    try {
      await fetch(`/api/ultra-tables/${tableId}/views`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: viewId,
          name: editingName,
        }),
      })
      setEditingId(null)
      setEditingName('')
      onUpdate()
    } catch (error) {
      console.error('Error updating view:', error)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Vaated</h3>
        <p className="text-sm text-slate-600 mt-1">
          Erinevad viisid andmete vaatamiseks ja haldamiseks
        </p>
      </div>

      {/* Existing Views */}
      <div className="grid gap-4 md:grid-cols-2">
        {views.map((view) => {
          const viewType = VIEW_TYPES.find((vt) => vt.type === view.type)
          const Icon = viewType?.icon || Grid3x3

          return (
            <div
              key={view.id}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    {editingId === view.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleUpdateView(view.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateView(view.id)
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditingName('')
                          }
                        }}
                        autoFocus
                        className="font-medium text-slate-900 border-b-2 border-[#279989] focus:outline-none bg-transparent w-full"
                      />
                    ) : (
                      <h4 className="font-medium text-slate-900">{view.name}</h4>
                    )}
                    <p className="text-sm text-slate-600 mt-1">
                      {viewType?.description || view.type}
                    </p>
                    {view.is_default && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-[#279989]/10 text-[#279989] text-xs font-medium rounded">
                        Vaikimisi
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(view.id)
                      setEditingName(view.name)
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </button>
                  {!view.is_default && (
                    <button
                      onClick={() => handleDeleteView(view.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New View */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h4 className="font-medium text-slate-900 mb-4">Lisa uus vaade</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {VIEW_TYPES.map((viewType) => {
            const Icon = viewType.icon
            const hasView = views.some((v) => v.type === viewType.type)

            return (
              <button
                key={viewType.type}
                onClick={() => handleCreateView(viewType.type)}
                disabled={hasView || creating}
                className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#279989] hover:bg-[#279989]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  {creating ? (
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{viewType.label}</div>
                  <div className="text-sm text-slate-500">
                    {hasView ? 'Juba olemas' : viewType.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
