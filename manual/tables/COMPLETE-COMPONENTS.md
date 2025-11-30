# Ultra Tables - Täielikud Koodinäited

## 🎯 SISU

See fail sisaldab TÄIELIKKU koodi kõigile komponentidele, mida Claude Code peab looma.

---

## 1️⃣ VirtualTable.tsx (Infinite Scroll)

```typescript
// /apps/web/src/components/admin/ultra-tables/VirtualTable.tsx

'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { DynamicCell } from '@/components/shared/ultra-table/DynamicCell'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'

interface VirtualTableProps {
  columns: any[]
  records: any[]
  onRecordUpdate: (recordId: string, data: any) => void
  onRecordDelete: (recordId: string) => void
  onLoadMore: () => void
  hasMore: boolean
  loadingMore: boolean
}

const ROW_HEIGHT = 48
const HEADER_HEIGHT = 48

export function VirtualTable({
  columns,
  records,
  onRecordUpdate,
  onRecordDelete,
  onLoadMore,
  hasMore,
  loadingMore,
}: VirtualTableProps) {
  const listRef = useRef<List>(null)
  const infiniteLoaderRef = useRef<InfiniteLoader>(null)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 350
      setContainerHeight(Math.max(400, height))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Determine if item is loaded
  const isItemLoaded = (index: number) => !hasMore || index < records.length

  // Load more items
  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
      if (!loadingMore && hasMore) {
        onLoadMore()
      }
      return Promise.resolve()
    },
    [loadingMore, hasMore, onLoadMore]
  )

  // Total item count (records + 1 loading row if hasMore)
  const itemCount = hasMore ? records.length + 1 : records.length

  const Row = useCallback(
    ({ index, style }: any) => {
      // Loading row
      if (!isItemLoaded(index)) {
        return (
          <div
            style={style}
            className="flex items-center justify-center border-b border-slate-200 bg-slate-50"
          >
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        )
      }

      const record = records[index]
      if (!record) return null
      
      return (
        <div
          style={style}
          className="flex items-center border-b border-slate-200 hover:bg-slate-50 group"
        >
          {columns.map((column) => (
            <div
              key={column.id}
              className="px-4 py-2 border-r border-slate-200 overflow-hidden"
              style={{ width: column.width || 150, minWidth: column.width || 150 }}
            >
              <DynamicCell
                type={column.type}
                value={record.data?.[column.id]}
                config={column.config || {}}
                onChange={(value) => {
                  onRecordUpdate(record.id, {
                    ...record.data,
                    [column.id]: value,
                  })
                }}
              />
            </div>
          ))}
          <div className="px-4 py-2" style={{ width: 60 }}>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRecordDelete(record.id)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      )
    },
    [columns, records, onRecordUpdate, onRecordDelete, hasMore]
  )

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center border-b border-slate-200 bg-slate-50 font-semibold sticky top-0 z-10"
        style={{ height: HEADER_HEIGHT }}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="px-4 py-3 border-r border-slate-200 text-sm text-slate-900 truncate"
            style={{ width: column.width || 150, minWidth: column.width || 150 }}
          >
            {column.name}
          </div>
        ))}
        <div className="px-4 py-3 text-sm text-slate-900" style={{ width: 60 }}>
          {/* Actions column */}
        </div>
      </div>

      {/* Virtual Scrolling Body with Infinite Loader */}
      {records.length > 0 ? (
        <InfiniteLoader
          ref={infiniteLoaderRef}
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={10} // Start loading 10 items before end
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                ref(list)
                listRef.current = list
              }}
              height={containerHeight}
              itemCount={itemCount}
              itemSize={ROW_HEIGHT}
              width="100%"
              onItemsRendered={onItemsRendered}
              overscanCount={5}
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500">
          Andmeid pole veel lisatud
        </div>
      )}
    </div>
  )
}
```

---

## 2️⃣ TableSettings.tsx

```typescript
// /apps/web/src/components/admin/ultra-tables/TableSettings.tsx

'use client'

import { useState } from 'react'
import { Card } from '@/packages/ui/src/components/card'
import { Input } from '@/packages/ui/src/components/input'
import { Textarea } from '@/packages/ui/src/components/textarea'
import { Button } from '@/packages/ui/src/components/button'
import { Save } from 'lucide-react'

interface TableSettingsProps {
  table: any
  onUpdate: () => void
}

const COLORS = [
  '#3B82F6', // Blue
  '#279989', // Rivest Green
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
]

const ICONS = ['📊', '📁', '📋', '🎯', '🚀', '💼', '🏗️', '⚙️']

export function TableSettings({ table, onUpdate }: TableSettingsProps) {
  const [name, setName] = useState(table.name)
  const [description, setDescription] = useState(table.description || '')
  const [color, setColor] = useState(table.color)
  const [icon, setIcon] = useState(table.icon || '📊')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/ultra-tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, icon }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Põhiandmed</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tabeli nimi</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tabeli nimi"
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
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Välimus</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ikoon</label>
            <div className="flex gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    icon === i
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Värv</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvestan...' : 'Salvesta'}
        </Button>
      </div>
    </div>
  )
}
```

---

## 3️⃣ ViewsManager.tsx

```typescript
// /apps/web/src/components/admin/ultra-tables/ViewsManager.tsx

'use client'

import { useState } from 'react'
import { Card } from '@/packages/ui/src/components/card'
import { Button } from '@/packages/ui/src/components/button'
import { Plus, Grid3x3, LayoutList, Calendar, Image, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/packages/ui/src/components/badge'

interface ViewsManagerProps {
  tableId: string
  views: any[]
  onUpdate: () => void
}

const VIEW_TYPES = [
  { type: 'grid', label: 'Grid View', icon: Grid3x3, color: 'blue' },
  { type: 'kanban', label: 'Kanban Board', icon: LayoutList, color: 'purple' },
  { type: 'calendar', label: 'Calendar', icon: Calendar, color: 'green' },
  { type: 'gallery', label: 'Gallery', icon: Image, color: 'pink' },
]

export function ViewsManager({ tableId, views, onUpdate }: ViewsManagerProps) {
  const [creating, setCreating] = useState(false)

  const handleCreateView = async (type: string) => {
    setCreating(true)
    try {
      const response = await fetch(`/api/ultra-tables/${tableId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} View`,
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
      await fetch(`/api/ultra-tables/${tableId}/views/${viewId}`, {
        method: 'DELETE',
      })
      onUpdate()
    } catch (error) {
      console.error('Error deleting view:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vaated</h3>
          <p className="text-sm text-slate-600 mt-1">
            Erinevad viisid andmete vaatamiseks
          </p>
        </div>
      </div>

      {/* Existing Views */}
      <div className="grid gap-4 md:grid-cols-2">
        {views.map((view) => {
          const viewType = VIEW_TYPES.find((vt) => vt.type === view.type)
          const Icon = viewType?.icon || Grid3x3

          return (
            <Card key={view.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{view.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {viewType?.label || view.type}
                    </p>
                    {view.is_default && (
                      <Badge className="mt-2" variant="default">
                        Vaikimisi
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!view.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteView(view.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Create New View */}
      <Card className="p-6">
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
                className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <Icon className="w-5 h-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">{viewType.label}</div>
                  {hasView && (
                    <div className="text-xs text-slate-500">Juba olemas</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
```

---

## 4️⃣ Menu Management Page

```typescript
// /apps/web/src/app/(dashboard)/admin/menu/page.tsx

'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'
import { Card } from '@/packages/ui/src/components/card'
import { Badge } from '@/packages/ui/src/components/badge'
import * as Icons from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  href: string
  icon: string
  visible: boolean
  order: number
  section?: string
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', label: 'Töölaud', href: '/dashboard', icon: 'LayoutDashboard', visible: true, order: 0, section: 'main' },
    { id: '2', label: 'Projektid', href: '/projects', icon: 'FolderKanban', visible: true, order: 1, section: 'main' },
    { id: '3', label: 'Arved', href: '/invoices', icon: 'FileText', visible: true, order: 2, section: 'main' },
    { id: '4', label: 'Töötajad', href: '/employees', icon: 'Users', visible: true, order: 3, section: 'main' },
    { id: '5', label: 'Dokumendid', href: '/documents', icon: 'File', visible: true, order: 4, section: 'main' },
    { id: '6', label: 'Failihaldus', href: '/file-vault', icon: 'FolderArchive', visible: true, order: 5, section: 'main' },
    { id: '7', label: 'Laohaldus', href: '/warehouse', icon: 'Warehouse', visible: true, order: 6, section: 'main' },
    { id: '8', label: 'Tabelid', href: '/admin/ultra-tables', icon: 'Table', visible: true, order: 7, section: 'main' },
    { id: '9', label: 'Aruanded', href: '/reports', icon: 'BarChart3', visible: true, order: 8, section: 'main' },
    { id: '10', label: 'CMS Haldus', href: '/admin/cms', icon: 'Database', visible: true, order: 0, section: 'admin' },
    { id: '11', label: 'PDF Mallid', href: '/admin/templates', icon: 'FileType', visible: true, order: 1, section: 'admin' },
    { id: '12', label: 'Menüü', href: '/admin/menu', icon: 'Menu', visible: true, order: 2, section: 'admin' },
    { id: '13', label: 'Seaded', href: '/settings', icon: 'Settings', visible: true, order: 3, section: 'admin' },
  ])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(menuItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setMenuItems(updatedItems)
  }

  const toggleVisibility = (id: string) => {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    )
  }

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName]
    return Icon || Icons.Circle
  }

  const mainItems = menuItems.filter((item) => item.section === 'main').sort((a, b) => a.order - b.order)
  const adminItems = menuItems.filter((item) => item.section === 'admin').sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Menüü Haldus</h1>
          <p className="mt-2 text-slate-600">
            Kohanda navigatsiooni menüüd ja elementide järjekorda
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Lisa menüü element
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Menu */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Peamine Menüü</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="main-menu">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {mainItems.map((item, index) => {
                    const Icon = getIcon(item.icon)
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-slate-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900">{item.label}</div>
                              <div className="text-sm text-slate-600 truncate">{item.href}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVisibility(item.id)}
                              >
                                {item.visible ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
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
        </Card>

        {/* Admin Menu */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Admin Menüü</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="admin-menu">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {adminItems.map((item, index) => {
                    const Icon = getIcon(item.icon)
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-slate-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900">{item.label}</div>
                              <div className="text-sm text-slate-600 truncate">{item.href}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVisibility(item.id)}
                              >
                                {item.visible ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
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
        </Card>
      </div>
    </div>
  )
}
```

---

## 5️⃣ IndexedDB Cache (Valikuline - Performance Boost)

```typescript
// /apps/web/src/lib/ultra-tables/cache.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface UltraTablesDB extends DBSchema {
  records: {
    key: string
    value: {
      id: string
      tableId: string
      data: any
      updatedAt: string
    }
    indexes: {
      'by-table': string
      'by-updated': string
    }
  }
  tables: {
    key: string
    value: {
      id: string
      name: string
      columns: any[]
      views: any[]
      updatedAt: string
    }
  }
}

class UltraTablesCache {
  private db: IDBPDatabase<UltraTablesDB> | null = null

  async init() {
    if (this.db) return this.db

    this.db = await openDB<UltraTablesDB>('ultra-tables-cache', 1, {
      upgrade(db) {
        // Records store
        const recordsStore = db.createObjectStore('records', { keyPath: 'id' })
        recordsStore.createIndex('by-table', 'tableId')
        recordsStore.createIndex('by-updated', 'updatedAt')

        // Tables store
        db.createObjectStore('tables', { keyPath: 'id' })
      },
    })

    return this.db
  }

  async cacheRecords(tableId: string, records: any[]) {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')
    
    await Promise.all(
      records.map(record =>
        tx.store.put({
          id: record.id,
          tableId,
          data: record.data,
          updatedAt: record.updated_at,
        })
      )
    )
    
    await tx.done
  }

  async getRecords(tableId: string): Promise<any[]> {
    const db = await this.init()
    return db.getAllFromIndex('records', 'by-table', tableId)
  }

  async cacheTable(table: any) {
    const db = await this.init()
    await db.put('tables', {
      id: table.id,
      name: table.name,
      columns: table.columns,
      views: table.views,
      updatedAt: table.updated_at,
    })
  }

  async getTable(tableId: string) {
    const db = await this.init()
    return db.get('tables', tableId)
  }

  async clearTable(tableId: string) {
    const db = await this.init()
    const tx = db.transaction('records', 'readwrite')
    const index = tx.store.index('by-table')
    
    for await (const cursor of index.iterate(tableId)) {
      cursor.delete()
    }
    
    await tx.done
  }

  async updateRecord(recordId: string, tableId: string, data: any) {
    const db = await this.init()
    await db.put('records', {
      id: recordId,
      tableId,
      data,
      updatedAt: new Date().toISOString(),
    })
  }

  async deleteRecord(recordId: string) {
    const db = await this.init()
    await db.delete('records', recordId)
  }
}

export const ultraTablesCache = new UltraTablesCache()
```

---

## ✅ KASUTAMINE

Kõik need komponendid on valmis kasutamiseks. Claude Code peab need lihtsalt õigetesse kaustadesse kopeerima ja API routes'id looma vastavalt TABLES-IMPLEMENTATION-GUIDE.md'le.
