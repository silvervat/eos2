'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Plus, Pencil, Trash2, Eye, EyeOff, Save, Loader2 } from 'lucide-react'
import * as Icons from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  href: string
  icon: string
  visible: boolean
  order: number
  section: 'main' | 'admin'
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: '1', label: 'Töölaud', href: '/dashboard', icon: 'LayoutDashboard', visible: true, order: 0, section: 'main' },
  { id: '2', label: 'Projektid', href: '/projects', icon: 'FolderKanban', visible: true, order: 1, section: 'main' },
  { id: '3', label: 'Arved', href: '/invoices', icon: 'FileText', visible: true, order: 2, section: 'main' },
  { id: '4', label: 'Töötajad', href: '/employees', icon: 'Users', visible: true, order: 3, section: 'main' },
  { id: '5', label: 'Dokumendid', href: '/documents', icon: 'File', visible: true, order: 4, section: 'main' },
  { id: '6', label: 'Failihaldus', href: '/file-vault', icon: 'FolderArchive', visible: true, order: 5, section: 'main' },
  { id: '7', label: 'Laohaldus', href: '/warehouse', icon: 'Warehouse', visible: true, order: 6, section: 'main' },
  { id: '8', label: 'Aruanded', href: '/reports', icon: 'BarChart3', visible: true, order: 7, section: 'main' },
  { id: '9', label: 'CMS Haldus', href: '/admin/cms', icon: 'Database', visible: true, order: 0, section: 'admin' },
  { id: '10', label: 'PDF Mallid', href: '/admin/templates', icon: 'FileType', visible: true, order: 1, section: 'admin' },
  { id: '11', label: 'Tabelid', href: '/admin/ultra-tables', icon: 'Table', visible: true, order: 2, section: 'admin' },
  { id: '12', label: 'Menüü', href: '/admin/menu', icon: 'Menu', visible: true, order: 3, section: 'admin' },
  { id: '13', label: 'Prügikast', href: '/trash', icon: 'Trash2', visible: true, order: 4, section: 'admin' },
  { id: '14', label: 'Teavitused', href: '/notifications', icon: 'Bell', visible: true, order: 5, section: 'admin' },
  { id: '15', label: 'Seaded', href: '/settings', icon: 'Settings', visible: true, order: 6, section: 'admin' },
]

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleDragEnd = (result: any, section: 'main' | 'admin') => {
    if (!result.destination) return

    const sectionItems = menuItems.filter((item) => item.section === section)
    const otherItems = menuItems.filter((item) => item.section !== section)

    const [reorderedItem] = sectionItems.splice(result.source.index, 1)
    sectionItems.splice(result.destination.index, 0, reorderedItem)

    // Update order
    const updatedSectionItems = sectionItems.map((item, index) => ({
      ...item,
      order: index,
    }))

    setMenuItems([...otherItems, ...updatedSectionItems])
  }

  const toggleVisibility = (id: string) => {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // In a real app, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName]
    return Icon || Icons.Circle
  }

  const mainItems = menuItems.filter((item) => item.section === 'main').sort((a, b) => a.order - b.order)
  const adminItems = menuItems.filter((item) => item.section === 'admin').sort((a, b) => a.order - b.order)

  const MenuSection = ({
    title,
    items,
    section,
    droppableId,
  }: {
    title: string
    items: MenuItem[]
    section: 'main' | 'admin'
    droppableId: string
  }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <DragDropContext onDragEnd={(result) => handleDragEnd(result, section)}>
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => {
                const Icon = getIcon(item.icon)
                return (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-4 p-4 bg-white border rounded-lg transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="w-5 h-5 text-slate-400" />
                        </div>

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.visible ? 'bg-slate-100' : 'bg-slate-50'
                        }`}>
                          <Icon className={`w-5 h-5 ${item.visible ? 'text-slate-600' : 'text-slate-400'}`} />
                        </div>

                        <div className={`flex-1 min-w-0 ${!item.visible ? 'opacity-50' : ''}`}>
                          <div className="font-medium text-slate-900">{item.label}</div>
                          <div className="text-sm text-slate-500 truncate">{item.href}</div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleVisibility(item.id)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            title={item.visible ? 'Peida' : 'Näita'}
                          >
                            {item.visible ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Menüü Haldus</h1>
          <p className="mt-2 text-slate-600">
            Kohanda navigatsiooni menüüd ja elementide järjekorda
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Lisa element
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6e] transition-colors font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvestan...' : saved ? 'Salvestatud!' : 'Salvesta'}
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MenuSection
          title="Peamine Menüü"
          items={mainItems}
          section="main"
          droppableId="main-menu"
        />
        <MenuSection
          title="Admin Menüü"
          items={adminItems}
          section="admin"
          droppableId="admin-menu"
        />
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-medium text-blue-900 mb-2">Kuidas kasutada</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Lohista elemente, et muuta järjekorda</li>
          <li>• Klõpsa silma ikoonil, et peita/näidata elementi</li>
          <li>• Klõpsa pliiatsi ikoonil, et muuta nime või ikooni</li>
          <li>• Muudatused salvestuvad kui vajutad "Salvesta" nuppu</li>
        </ul>
      </div>
    </div>
  )
}
