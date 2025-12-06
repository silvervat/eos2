'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Truck,
  MapPin,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface PlanEntry {
  id: string
  date: string
  worker: string
  task: string
  location: string
  system?: string
  machine?: string
  startTime: string
  endTime: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

const mockPlanEntries: PlanEntry[] = [
  // Monday
  { id: '1', date: '2024-03-18', worker: 'Jaan Tamm', task: 'Kanalite paigaldus', location: '2. korrus, A-tsoon', system: 'VEN-03', machine: 'Tõstuk', startTime: '08:00', endTime: '16:00', status: 'planned' },
  { id: '2', date: '2024-03-18', worker: 'Peeter Mets', task: 'Harukanalite ühendamine', location: '2. korrus, B-tsoon', system: 'VEN-03', startTime: '08:00', endTime: '12:00', status: 'planned' },
  { id: '3', date: '2024-03-18', worker: 'Peeter Mets', task: 'Isolatsiooni paigaldus', location: '1. korrus', system: 'VEN-01', startTime: '13:00', endTime: '16:00', status: 'planned' },
  { id: '4', date: '2024-03-18', worker: 'Andres Kask', task: 'Põrandakütte torud', location: '2. korrus, ruum 204', system: 'KYT-02', startTime: '08:00', endTime: '16:00', status: 'planned' },
  // Tuesday
  { id: '5', date: '2024-03-19', worker: 'Jaan Tamm', task: 'Agregaadi ühendused', location: 'Tehniline ruum', system: 'VEN-01', startTime: '08:00', endTime: '12:00', status: 'planned' },
  { id: '6', date: '2024-03-19', worker: 'Jaan Tamm', task: 'Kanalikontroll', location: '1. korrus', system: 'VEN-01', startTime: '13:00', endTime: '16:00', status: 'planned' },
  { id: '7', date: '2024-03-19', worker: 'Tiit Lepp', task: 'Jahutusseadmete ettevalmistus', location: 'Ladu', system: 'JAH-01', machine: 'Kaubik', startTime: '08:00', endTime: '16:00', status: 'planned' },
  // Wednesday
  { id: '8', date: '2024-03-20', worker: 'Jaan Tamm', task: 'Käivitustest VEN-01', location: 'Tehniline ruum', system: 'VEN-01', startTime: '09:00', endTime: '12:00', status: 'planned', notes: 'Daikin inspektor kohal' },
  { id: '9', date: '2024-03-20', worker: 'Peeter Mets', task: 'Difuusorite paigaldus', location: '1. korrus', system: 'VEN-01', startTime: '08:00', endTime: '16:00', status: 'planned' },
]

const workers = ['Jaan Tamm', 'Peeter Mets', 'Andres Kask', 'Tiit Lepp']
const machines = ['Tõstuk', 'Kaubik', 'Kraana', 'Keevitusaparaat', 'Pressmasin']

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planeeritud', color: 'text-blue-600', bg: 'bg-blue-100' },
  in_progress: { label: 'Käimas', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  completed: { label: 'Tehtud', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Tühistatud', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function DetailPlanPage() {
  const params = useParams()
  const projectId = params.id as string

  const [entries, setEntries] = useState<PlanEntry[]>(mockPlanEntries)
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date('2024-03-18'))
  const [selectedWorker, setSelectedWorker] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Generate week days
  const weekDays: Date[] = []
  for (let i = 0; i < 5; i++) {
    const day = new Date(currentWeekStart)
    day.setDate(day.getDate() + i)
    weekDays.push(day)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString('et-EE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const getEntriesForDay = (date: Date) => {
    const dateKey = formatDateKey(date)
    return entries
      .filter(e => e.date === dateKey)
      .filter(e => selectedWorker === 'all' || e.worker === selectedWorker)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const weekLabel = `${weekDays[0].toLocaleDateString('et-EE', { day: 'numeric', month: 'short' })} - ${weekDays[4].toLocaleDateString('et-EE', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // Stats
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.date)
    return entryDate >= weekDays[0] && entryDate <= weekDays[4]
  })
  const plannedHours = weekEntries.reduce((sum, e) => {
    const start = parseInt(e.startTime.split(':')[0])
    const end = parseInt(e.endTime.split(':')[0])
    return sum + (end - start)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Detailplaneerimine</h2>
          <p className="text-sm text-gray-500">Päevapõhine tööde planeerimine</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Selle nädala ülesanded</p>
          <p className="text-2xl font-bold text-gray-900">{weekEntries.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Planeeritud tunnid</p>
          <p className="text-2xl font-bold text-blue-700">{plannedHours}h</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Töötajaid</p>
          <p className="text-2xl font-bold text-green-700">{new Set(weekEntries.map(e => e.worker)).size}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Masinaid vajalik</p>
          <p className="text-2xl font-bold text-orange-700">{new Set(weekEntries.filter(e => e.machine).map(e => e.machine)).size}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg min-w-[200px] justify-center">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{weekLabel}</span>
          </div>
          <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeekStart(new Date())}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Täna
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik töötajad</option>
            {workers.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lisa ülesanne
          </button>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 divide-x">
          {weekDays.map((day) => {
            const dayEntries = getEntriesForDay(day)
            const isToday = formatDateKey(day) === formatDateKey(new Date())

            return (
              <div key={formatDateKey(day)} className="min-h-[400px]">
                {/* Day Header */}
                <div className={`px-3 py-2 border-b text-center ${isToday ? 'bg-[#279989]/10' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium ${isToday ? 'text-[#279989]' : 'text-gray-700'}`}>
                    {formatDayHeader(day)}
                  </p>
                  <p className="text-xs text-gray-500">{dayEntries.length} ülesannet</p>
                </div>

                {/* Day Content */}
                <div className="p-2 space-y-2">
                  {dayEntries.map((entry) => {
                    const statusInfo = statusConfig[entry.status]

                    return (
                      <div
                        key={entry.id}
                        className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#279989] hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {entry.startTime} - {entry.endTime}
                          </span>
                          <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded">
                            <MoreVertical className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{entry.task}</p>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{entry.worker}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{entry.location}</span>
                          </div>
                          {entry.machine && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{entry.machine}</span>
                            </div>
                          )}
                        </div>
                        {entry.system && (
                          <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {entry.system}
                          </span>
                        )}
                        {entry.notes && (
                          <p className="mt-1.5 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    )
                  })}

                  {dayEntries.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-xs">Tühi päev</p>
                      <button
                        onClick={() => {
                          setSelectedDate(formatDateKey(day))
                          setShowAddModal(true)
                        }}
                        className="mt-2 text-xs text-[#279989] hover:underline"
                      >
                        + Lisa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Workers summary for the week */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Töötajate koormus sel nädalal</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workers.map((worker) => {
            const workerEntries = weekEntries.filter(e => e.worker === worker)
            const hours = workerEntries.reduce((sum, e) => {
              const start = parseInt(e.startTime.split(':')[0])
              const end = parseInt(e.endTime.split(':')[0])
              return sum + (end - start)
            }, 0)
            const percentage = Math.round((hours / 40) * 100)

            return (
              <div key={worker} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{worker}</span>
                  <span className="text-xs text-gray-500">{hours}h / 40h</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 rounded-full ${percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Lisa tööülesanne</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kuupäev</label>
                  <input
                    type="date"
                    defaultValue={selectedDate || ''}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Töötaja</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Vali töötaja...</option>
                    {workers.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülesanne</label>
                <input
                  type="text"
                  placeholder="Nt. Kanalite paigaldus"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asukoht</label>
                <input
                  type="text"
                  placeholder="Nt. 2. korrus, A-tsoon"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Algus</label>
                  <input type="time" defaultValue="08:00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lõpp</label>
                  <input type="time" defaultValue="16:00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süsteem (valikuline)</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Vali süsteem...</option>
                    <option value="VEN-01">VEN-01</option>
                    <option value="VEN-02">VEN-02</option>
                    <option value="VEN-03">VEN-03</option>
                    <option value="KYT-01">KYT-01</option>
                    <option value="KYT-02">KYT-02</option>
                    <option value="JAH-01">JAH-01</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masin (valikuline)</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Vali masin...</option>
                    {machines.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Märkused</label>
                <textarea
                  rows={2}
                  placeholder="Lisamärkmed..."
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setSelectedDate(null) }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={() => { setShowAddModal(false); setSelectedDate(null) }}
                className="px-4 py-2 text-sm bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d]"
              >
                Lisa ülesanne
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
