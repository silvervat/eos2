'use client'

import { useState, useMemo } from 'react'
import { useProjects, PROJECT_STATUSES, PROJECT_TYPES, type Project, type ProjectStatus } from '@/hooks/use-projects'
import { ProjectsTable } from '@/components/projects/projects-table'
import { AddProjectModal } from '@/components/projects/add-project-modal'
import { Plus, LayoutGrid, List, MapPin, Building2, Calendar, Image as ImageIcon } from 'lucide-react'

function ProjectsGallery({
  data,
  onProjectClick,
}: {
  data: Project[]
  onProjectClick?: (project: Project) => void
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((project) => {
        const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.starting
        const typeLabel = PROJECT_TYPES[project.type] || project.type

        return (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onProjectClick?.(project)}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-100 relative overflow-hidden">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : project.latitude && project.longitude ? (
                <img
                  src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${project.longitude},${project.latitude}&z=14&l=map&size=400,200`}
                  alt="Kaart"
                  className="w-full h-full object-cover opacity-70"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                </div>
              )}
              {/* Type badge */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-white/90 text-slate-700 shadow-sm">
                  {typeLabel}
                </span>
              </div>
              {/* Status badge */}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-xs text-slate-500">{project.code}</span>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{project.name}</h3>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.description}</p>
              )}

              <div className="space-y-1.5 text-sm text-slate-600">
                {project.client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{project.client.name}</span>
                  </div>
                )}
                {(project.city || project.address) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{project.city || project.address}</span>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString('et-EE')}
                      {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('et-EE')}`}
                    </span>
                  </div>
                )}
              </div>

              {project.budget && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-lg font-semibold text-slate-900">
                    {project.budget.toLocaleString('et-EE')} {project.currency || '€'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
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
            onClick={() => setIsModalOpen(true)}
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
        <ProjectsTable data={projects || []} />
      ) : (
        <ProjectsGallery data={projects || []} />
      )}

      <AddProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
