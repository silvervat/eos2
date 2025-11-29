'use client'

import { useState } from 'react'
import {
  FolderArchive,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  FolderPlus,
  FileUp,
  MoreVertical,
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Star,
  Download,
  Trash2,
  Share2,
  Eye,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'

// Mock data for demo
const mockFiles = [
  { id: '1', name: 'Projektid', type: 'folder', items: 12, modified: '2025-11-28' },
  { id: '2', name: 'Lepingud', type: 'folder', items: 8, modified: '2025-11-27' },
  { id: '3', name: 'Arved 2025', type: 'folder', items: 45, modified: '2025-11-26' },
  { id: '4', name: 'Pakkumine_001.pdf', type: 'pdf', size: '2.4 MB', modified: '2025-11-28' },
  { id: '5', name: 'Logo_final.png', type: 'image', size: '156 KB', modified: '2025-11-27' },
  { id: '6', name: 'Aruanne_Q4.xlsx', type: 'excel', size: '1.2 MB', modified: '2025-11-25' },
  { id: '7', name: 'Esitlus.pptx', type: 'powerpoint', size: '5.8 MB', modified: '2025-11-24' },
  { id: '8', name: 'Video_demo.mp4', type: 'video', size: '45 MB', modified: '2025-11-23' },
]

const getFileIcon = (type: string) => {
  switch (type) {
    case 'folder': return Folder
    case 'pdf': return FileText
    case 'image': return Image
    case 'video': return Film
    case 'audio': return Music
    case 'archive': return Archive
    default: return File
  }
}

export default function FileVaultPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const filteredFiles = mockFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-7 h-7" style={{ color: '#279989' }} />
            Failihaldus
          </h1>
          <p className="text-slate-600 mt-1">
            Halda oma faile ja dokumente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Uus kaust</span>
          </Button>
          <Button className="gap-2" style={{ backgroundColor: '#279989' }}>
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Laadi fail</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Otsi faile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <div className="border rounded-lg flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <span className="text-sm text-slate-600">
              {selectedFiles.length} valitud
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="w-4 h-4" />
                Laadi alla
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Share2 className="w-4 h-4" />
                Jaga
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
                Kustuta
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Files */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFiles.map(file => {
            const Icon = getFileIcon(file.type)
            const isSelected = selectedFiles.includes(file.id)

            return (
              <Card
                key={file.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  borderColor: isSelected ? '#279989' : undefined,
                  ['--tw-ring-color' as string]: '#279989'
                }}
                onClick={() => toggleSelect(file.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                      file.type === 'folder' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: file.type === 'folder' ? '#f59e0b' : '#64748b' }}
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate w-full">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {file.type === 'folder' ? `${file.items} elementi` : file.size}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredFiles.map(file => {
              const Icon = getFileIcon(file.type)
              const isSelected = selectedFiles.includes(file.id)

              return (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => toggleSelect(file.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded"
                  />
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      file.type === 'folder' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: file.type === 'folder' ? '#f59e0b' : '#64748b' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {file.type === 'folder' ? `${file.items} elementi` : file.size}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500 hidden sm:block">
                    {file.modified}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderArchive className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            Faile ei leitud
          </h3>
          <p className="mt-2 text-slate-500">
            Proovi muuta otsingut voi laadi uus fail.
          </p>
        </div>
      )}
    </div>
  )
}
