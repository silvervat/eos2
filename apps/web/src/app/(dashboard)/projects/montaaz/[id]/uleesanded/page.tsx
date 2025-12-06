'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Filter,
  ChevronDown,
  ChevronRight,
  Flag,
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string
  dueDate?: string
  system?: string
  tags: string[]
  createdAt: string
  completedAt?: string
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Kanalite paigaldus 2. korrusel lõpetada',
    description: 'A-tsooni magistraalkanal tuleb lõpuni viia ja ühendada agregaadiga.',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Jaan Tamm',
    dueDate: '2024-03-20',
    system: 'VEN-03',
    tags: ['ventilatsioon', 'paigaldus'],
    createdAt: '2024-03-10',
  },
  {
    id: '2',
    title: 'Põrandakütte survetestid',
    description: 'Teostada survetestid kõikidele B-tsooni kontuuridele.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Andres Kask',
    dueDate: '2024-03-22',
    system: 'KYT-02',
    tags: ['küte', 'test'],
    createdAt: '2024-03-12',
  },
  {
    id: '3',
    title: 'Daikin inspektori visiidi ettevalmistus',
    description: 'Valmistada ette jahutussüsteemi dokumentatsioon ja kontrollida paigalduskvaliteeti.',
    status: 'todo',
    priority: 'urgent',
    assignee: 'Jaan Tamm',
    dueDate: '2024-03-19',
    system: 'JAH-01',
    tags: ['jahutus', 'inspekteerimine'],
    createdAt: '2024-03-14',
  },
  {
    id: '4',
    title: 'Difuusorite tellimine kontorialasse',
    description: 'Tellida 24 tk laedifuusoreid kontoriala jaoks.',
    status: 'done',
    priority: 'medium',
    assignee: 'Peeter Mets',
    system: 'VEN-02',
    tags: ['tellimus'],
    createdAt: '2024-03-08',
    completedAt: '2024-03-12',
  },
  {
    id: '5',
    title: 'Isolatsioonimaterjalide inventuur',
    status: 'done',
    priority: 'low',
    assignee: 'Tiit Lepp',
    tags: ['ladu'],
    createdAt: '2024-03-05',
    completedAt: '2024-03-06',
  },
  {
    id: '6',
    title: 'VKT agregaadi seadistamine',
    description: 'Seadistada õhuhulgad ja surved vastavalt projektile.',
    status: 'review',
    priority: 'high',
    assignee: 'Jaan Tamm',
    system: 'VEN-01',
    tags: ['ventilatsioon', 'käivitus'],
    createdAt: '2024-03-01',
  },
  {
    id: '7',
    title: 'Ehitustööde päeviku täitmine',
    status: 'in_progress',
    priority: 'low',
    assignee: 'Jaan Tamm',
    tags: ['dokumentatsioon'],
    createdAt: '2024-03-01',
  },
  {
    id: '8',
    title: 'Materjalide vastuvõtmine homme',
    description: 'Lindab kanalite 2. osa tarne - kontrollida kogused ja kvaliteet.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Peeter Mets',
    dueDate: '2024-03-18',
    tags: ['tarne'],
    createdAt: '2024-03-15',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  todo: { label: 'Teha', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'Töös', color: 'text-blue-600', bg: 'bg-blue-100' },
  review: { label: 'Ülevaatus', color: 'text-purple-600', bg: 'bg-purple-100' },
  done: { label: 'Tehtud', color: 'text-green-600', bg: 'bg-green-100' },
}

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: 'Madal', color: 'text-gray-500', icon: '○' },
  medium: { label: 'Keskmine', color: 'text-blue-500', icon: '◐' },
  high: { label: 'Kõrge', color: 'text-orange-500', icon: '●' },
  urgent: { label: 'Kiire', color: 'text-red-500', icon: '⚠' },
}

export default function TasksPage() {
  const params = useParams()
  const projectId = params.id as string

  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority'>('status')

  const assignees = [...new Set(tasks.map(t => t.assignee))]

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter
    const matchesCompleted = showCompleted || task.status !== 'done'
    return matchesSearch && matchesStatus && matchesAssignee && matchesCompleted
  })

  // Group tasks
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const key = groupBy === 'status' ? task.status : groupBy === 'assignee' ? task.assignee : task.priority
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        if (t.status === 'done') {
          return { ...t, status: 'todo' as const, completedAt: undefined }
        } else {
          return { ...t, status: 'done' as const, completedAt: new Date().toISOString() }
        }
      }
      return t
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (dateString === today.toISOString().split('T')[0]) return 'Täna'
    if (dateString === tomorrow.toISOString().split('T')[0]) return 'Homme'
    return date.toLocaleDateString('et-EE', { day: 'numeric', month: 'short' })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  // Stats
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length

  const groupLabels: Record<string, string> = {
    todo: 'Teha',
    in_progress: 'Töös',
    review: 'Ülevaatus',
    done: 'Tehtud',
    low: 'Madal prioriteet',
    medium: 'Keskmine prioriteet',
    high: 'Kõrge prioriteet',
    urgent: 'Kiire',
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-sm text-gray-500">Teha</p>
          <p className="text-2xl font-bold text-gray-900">{todoCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Töös</p>
          <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Tehtud</p>
          <p className="text-2xl font-bold text-green-700">{doneCount}</p>
        </div>
        {urgentCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">Kiired</p>
            <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi ülesannet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="todo">Teha</option>
          <option value="in_progress">Töös</option>
          <option value="review">Ülevaatus</option>
          <option value="done">Tehtud</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik täitjad</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as 'status' | 'assignee' | 'priority')}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="status">Grupeeri staatuse järgi</option>
          <option value="assignee">Grupeeri täitja järgi</option>
          <option value="priority">Grupeeri prioriteedi järgi</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-gray-300"
          />
          Näita tehtuid
        </label>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus ülesanne
        </button>
      </div>

      {/* Tasks grouped */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([group, groupTasks]) => (
          <div key={group} className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {groupLabels[group] || group}
                </span>
                <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
                  {groupTasks.length}
                </span>
              </div>
            </div>
            <div className="divide-y">
              {groupTasks.map((task) => {
                const priorityInfo = priorityConfig[task.priority]
                const statusInfo = statusConfig[task.status]
                const overdue = isOverdue(task.dueDate) && task.status !== 'done'

                return (
                  <div
                    key={task.id}
                    className={`p-4 hover:bg-gray-50 ${task.status === 'done' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-[#279989]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                          <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className={`flex items-center gap-1 ${priorityInfo.color}`}>
                            <Flag className="w-3 h-3" />
                            {priorityInfo.label}
                          </span>

                          <span className="flex items-center gap-1 text-gray-500">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>

                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                              {overdue && <AlertCircle className="w-3 h-3" />}
                            </span>
                          )}

                          {task.system && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {task.system}
                            </span>
                          )}

                          {task.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}

                          {groupBy !== 'status' && (
                            <span className={`px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedTasks).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Ülesandeid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
