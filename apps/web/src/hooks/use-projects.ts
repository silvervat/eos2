'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Project types matching sidebar menu
export type ProjectType = 'ptv' | 'montaaz' | 'muuk' | 'vahendus' | 'rent'

// Project statuses
export type ProjectStatus = 'starting' | 'waiting' | 'working' | 'warranty' | 'completed'

export const PROJECT_TYPES: Record<ProjectType, string> = {
  ptv: 'PTV',
  montaaz: 'Montaaž',
  muuk: 'Müük',
  vahendus: 'Vahendus',
  rent: 'Rent',
}

export const PROJECT_STATUSES: Record<ProjectStatus, { label: string; color: string }> = {
  starting: { label: 'Algamas', color: 'bg-blue-100 text-blue-700' },
  waiting: { label: 'Ootel', color: 'bg-yellow-100 text-yellow-700' },
  working: { label: 'Töös', color: 'bg-green-100 text-green-700' },
  warranty: { label: 'Garantiis', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Lõpetatud', color: 'bg-slate-100 text-slate-700' },
}

export interface Project {
  id: string
  code: string
  name: string
  description?: string
  type: ProjectType
  clientId?: string
  client?: { id: string; name: string }
  contactId?: string
  contact?: { id: string; name: string; email?: string; phone?: string }
  status: ProjectStatus
  currency: string
  startDate?: string
  endDate?: string
  address?: string
  country?: string
  latitude?: number
  longitude?: number
  managerId?: string
  manager?: { id: string; name: string }
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  code: string
  name: string
  description?: string
  type?: ProjectType
  clientId?: string
  contactId?: string
  status?: ProjectStatus
  currency?: string
  startDate?: string
  endDate?: string
  address?: string
  country?: string
  latitude?: number
  longitude?: number
  managerId?: string
  thumbnailUrl?: string
}

interface ProjectsResponse {
  data: Project[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

interface FetchProjectsParams {
  type?: ProjectType
  status?: ProjectStatus
  search?: string
  limit?: number
  offset?: number
}

async function fetchProjects(params?: FetchProjectsParams): Promise<Project[]> {
  const searchParams = new URLSearchParams()

  if (params?.type) searchParams.set('type', params.type)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const queryString = searchParams.toString()
  const url = `/api/projects${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Projektide laadimine ebaõnnestus')
  }

  const result: ProjectsResponse = await response.json()
  return result.data
}

async function createProject(data: ProjectInput): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Projekti loomine ebaõnnestus')
  }

  return response.json()
}

async function updateProject({ id, ...data }: ProjectInput & { id: string }): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Projekti uuendamine ebaõnnestus')
  }

  return response.json()
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Projekti kustutamine ebaõnnestus')
  }
}

export function useProjects(params?: FetchProjectsParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
  })
}

export function useProjectsByType(type: ProjectType) {
  return useProjects({ type })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
