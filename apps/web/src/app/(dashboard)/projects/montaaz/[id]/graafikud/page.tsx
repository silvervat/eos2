'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Layers,
} from 'lucide-react'

interface ScheduleTask {
  id: string
  name: string
  system: string
  assignee: string
  startDate: string
  endDate: string
  progress: number
  status: 'not_started' | 'in_progress' | 'delayed' | 'completed'
  dependencies?: string[]
  milestone?: boolean
}

const mockTasks: ScheduleTask[] = [
  {
    id: '1',
    name: 'VKT agregaadi paigaldus',
    system: 'VEN-01',
    assignee: 'Jaan Tamm',
    startDate: '2024-02-01',
    endDate: '2024-02-10',
    progress: 100,
    status: 'completed',
  },
  {
    id: '2',
    name: 'Põhikanalite paigaldus 1. korrus',
    system: 'VEN-01',
    assignee: 'Peeter Mets',
    startDate: '2024-02-12',
    endDate: '2024-02-28',
    progress: 100,
    status: 'completed',
    dependencies: ['1'],
  },
  {
    id: '3',
    name: 'Põhikanalite paigaldus 2. korrus',
    system: 'VEN-02',
    assignee: 'Peeter Mets',
    startDate: '2024-03-01',
    endDate: '2024-03-15',
    progress: 70,
    status: 'in_progress',
    dependencies: ['2'],
  },
  {
    id: '4',
    name: 'Põrandakütte paigaldus A-tsoon',
    system: 'KYT-01',
    assignee: 'Andres Kask',
    startDate: '2024-02-15',
    endDate: '2024-03-05',
    progress: 100,
    status: 'completed',
  },
  {
    id: '5',
    name: 'Põrandakütte paigaldus B-tsoon',
    system: 'KYT-02',
    assignee: 'Andres Kask',
    startDate: '2024-03-06',
    endDate: '2024-03-25',
    progress: 45,
    status: 'delayed',
    dependencies: ['4'],
  },
  {
    id: '6',
    name: 'Jahutusseadmete paigaldus',
    system: 'JAH-01',
    assignee: 'Tiit Lepp',
    startDate: '2024-03-20',
    endDate: '2024-04-10',
    progress: 0,
    status: 'not_started',
  },
  {
    id: '7',
    name: 'Automaatika paigaldus',
    system: 'ELE-01',
    assignee: 'Jaan Tamm',
    startDate: '2024-04-01',
    endDate: '2024-04-20',
    progress: 0,
    status: 'not_started',
    dependencies: ['3', '5', '6'],
  },
  {
    id: '8',
    name: 'Süsteemide käivitus',
    system: 'Kõik',
    assignee: 'Jaan Tamm',
    startDate: '2024-04-22',
    endDate: '2024-05-10',
    progress: 0,
    status: 'not_started',
    dependencies: ['7'],
    milestone: true,
  },
  {
    id: '9',
    name: 'Projekti lõpetamine',
    system: 'Kõik',
    assignee: 'Jaan Tamm',
    startDate: '2024-05-30',
    endDate: '2024-05-30',
    progress: 0,
    status: 'not_started',
    dependencies: ['8'],
    milestone: true,
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; barColor: string }> = {
  not_started: { label: 'Alustamata', color: 'text-gray-600', bg: 'bg-gray-100', barColor: 'bg-gray-300' },
  in_progress: { label: 'Töös', color: 'text-blue-600', bg: 'bg-blue-100', barColor: 'bg-blue-500' },
  delayed: { label: 'Hilineb', color: 'text-red-600', bg: 'bg-red-100', barColor: 'bg-red-500' },
  completed: { label: 'Valmis', color: 'text-green-600', bg: 'bg-green-100', barColor: 'bg-green-500' },
}

export default function SchedulePage() {
  const params = useParams()
  const projectId = params.id as string

  const [tasks] = useState<ScheduleTask[]>(mockTasks)
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 2, 1)) // March 2024
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentMonth(newDate)
  }

  const filteredTasks = tasks.filter(task => {
    return statusFilter === 'all' || task.status === statusFilter
  })

  const monthLabel = currentMonth.toLocaleDateString('et-EE', {
    month: 'long',
    year: 'numeric',
  })

  // Generate days for the current month view (show 2 months)
  const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0)
  const days: Date[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calculate weeks for header
  const weeks: { start: Date; end: Date; label: string }[] = []
  let weekStart = new Date(startDate)
  while (weekStart < endDate) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weeks.push({
      start: new Date(weekStart),
      end: weekEnd > endDate ? endDate : weekEnd,
      label: `${weekStart.getDate()}.${weekStart.getMonth() + 1} - ${Math.min(weekEnd.getDate(), endDate.getDate())}.${weekEnd.getMonth() + 1}`,
    })
    weekStart.setDate(weekStart.getDate() + 7)
  }

  const getTaskPosition = (task: ScheduleTask) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    const totalDays = days.length
    const dayWidth = 100 / totalDays

    const startOffset = Math.max(0, Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      left: `${startOffset * dayWidth}%`,
      width: `${Math.min(duration, totalDays - startOffset) * dayWidth}%`,
    }
  }

  // Stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const delayedTasks = tasks.filter(t => t.status === 'delayed').length
  const overallProgress = Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Ülesandeid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Tehtud</p>
          <p className="text-2xl font-bold text-green-700">{completedTasks}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Hilineb</p>
          <p className="text-2xl font-bold text-red-700">{delayedTasks}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Üldine progress</p>
          <p className="text-2xl font-bold text-blue-700">{overallProgress}%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium capitalize">{monthLabel}</span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik staatused</option>
            <option value="not_started">Alustamata</option>
            <option value="in_progress">Töös</option>
            <option value="delayed">Hilineb</option>
            <option value="completed">Valmis</option>
          </select>
          <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Ekspordi
          </button>
          <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Lisa ülesanne
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="flex border-b">
              <div className="w-72 flex-shrink-0 p-3 bg-gray-50 border-r font-medium text-sm text-gray-600">
                Ülesanne
              </div>
              <div className="flex-1 flex bg-gray-50">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center py-2 text-xs text-gray-500 border-r last:border-r-0"
                  >
                    {week.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="divide-y">
              {filteredTasks.map((task) => {
                const statusInfo = statusConfig[task.status]
                const position = getTaskPosition(task)

                return (
                  <div key={task.id} className="flex hover:bg-gray-50">
                    {/* Task Info */}
                    <div className="w-72 flex-shrink-0 p-3 border-r">
                      <div className="flex items-start gap-2">
                        {task.milestone ? (
                          <div className="w-4 h-4 bg-purple-500 rotate-45 mt-1 flex-shrink-0" />
                        ) : (
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${statusInfo.barColor}`} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{task.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {task.system}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.assignee}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gantt Bar */}
                    <div className="flex-1 relative py-3 px-1">
                      <div
                        className="absolute h-7 rounded flex items-center"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: task.milestone ? 'transparent' : undefined,
                        }}
                      >
                        {task.milestone ? (
                          <div className="w-6 h-6 bg-purple-500 rotate-45 mx-auto" />
                        ) : (
                          <div className={`h-full w-full rounded ${statusInfo.barColor} bg-opacity-30 relative overflow-hidden`}>
                            <div
                              className={`absolute left-0 top-0 bottom-0 ${statusInfo.barColor}`}
                              style={{ width: `${task.progress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        {Object.entries(statusConfig).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${value.barColor}`} />
            <span className="text-gray-600">{value.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rotate-45" />
          <span className="text-gray-600">Verstapost</span>
        </div>
      </div>
    </div>
  )
}
