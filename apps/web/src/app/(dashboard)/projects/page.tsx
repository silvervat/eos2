'use client'

import { useState, useMemo } from 'react'
import {
  useProjects,
  useUpdateProject,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type Project,
  type ProjectStatus,
  type ProjectInput,
} from '@/hooks/use-projects'
import { ProjectsTable } from '@/components/projects/projects-table'
import { AddProjectModal } from '@/components/projects/add-project-modal'
import { EditProjectModal } from '@/components/projects/edit-project-modal'
import {
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  Calendar,
  Image as ImageIcon,
  Pencil,
} from 'lucide-react'

function ProjectsGallery({
  data,
  onProjectClick,
  onEdit,
}: {
  data: Project[]
  onProjectClick?: (project: Project) => void
  onEdit?: (project: Project) => void
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Projekte ei leitud</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {data.map((project) => {
        const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.starting
        const typeLabel = PROJECT_TYPES[project.type] || project.type

        return (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
            onClick={() => onProjectClick?.(project)}
          >
            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(project)
              }}
              className="absolute top-1.5 right-8 z-10 p-1 rounded bg-white/90 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>

            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : project.latitude && project.longitude ? (
                <img
                  src={`https://staticmap.openstreetmap.de/staticmap.php?center=${project.latitude},${project.longitude}&zoom=14&size=200x150&markers=${project.latitude},${project.longitude},red-pushpin`}
                  alt="Kaart"
                  className="w-full h-full object-cover opacity-70"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                </div>
              )}
              {/* Type badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
                  {typeLabel}
                </span>
              </div>
              {/* Status badge */}
              <div className="absolute top-1.5 right-1.5">
                <span
                  className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-2">
              <div className="mb-1">
                <span className="font-mono text-[10px] text-slate-500">{project.code}</span>
                <h3 className="font-medium text-xs text-slate-900 line-clamp-1">{project.name}</h3>
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-600">
                {project.client && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.client.name}</span>
                  </div>
                )}
                {project.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProjectsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table')
  const { data: projects, isLoading, error } = useProjects()

  // Calculate stats
  const stats = useMemo(() => {
    if (!projects) return null

    const byStatus: Record<ProjectStatus, number> = {
      starting: 0,
      waiting: 0,
      working: 0,
      warranty: 0,
      completed: 0,
    }

    projects.forEach((p) => {
      if (byStatus[p.status] !== undefined) {
        byStatus[p.status]++
      }
    })

    return {
      total: projects.length,
      byStatus,
    }
  }, [projects])

  const handleEdit = (project: Project) => {
    setEditingProject(project)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <h2 className="font-semibold mb-2">Viga projektide laadimisel</h2>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projektid</h1>
          <p className="text-slate-600 text-sm mt-1">
            Halda ehitusprojekte ja jälgi nende staatust
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-4 w-4" />
              Tabel
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Galerii
            </button>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" />
            Lisa projekt
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-500">Kokku</div>
          </div>
          {Object.entries(PROJECT_STATUSES).map(([key, { label, color }]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-900">
                {stats.byStatus[key as ProjectStatus]}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex w-2 h-2 rounded-full ${color.split(' ')[0]}`} />
                <span className="text-sm text-slate-500">{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-slate-600">Laadin projekte...</span>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <ProjectsTable data={projects || []} onEdit={handleEdit} />
      ) : (
        <ProjectsGallery data={projects || []} onEdit={handleEdit} />
      )}

      <AddProjectModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </div>
  )
}
