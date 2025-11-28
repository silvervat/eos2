'use client'

import { useProjects } from '@/hooks/use-projects'
import { ProjectsTable } from '@/components/projects/projects-table'
import { Plus } from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projektid</h1>
          <p className="text-slate-600 text-sm mt-1">
            Halda ehitusprojekte ja jälgi nende staatust
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa projekt
        </button>
      </div>

      <ProjectsTable data={projects || []} isLoading={isLoading} />
    </div>
  )
}
