'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  Calendar,
  User,
  Cloud,
  Thermometer,
  Clock,
  FileText,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react'

interface DiaryEntry {
  id: string
  date: string
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  temperature: number
  shift: 'day' | 'night'
  workers: number
  supervisor: string
  workDescription: string
  materials: string[]
  equipment: string[]
  notes?: string
  createdBy: string
  createdAt: string
}

const mockEntries: DiaryEntry[] = [
  {
    id: '1',
    date: '2024-03-15',
    weather: 'cloudy',
    temperature: 8,
    shift: 'day',
    workers: 6,
    supervisor: 'Jaan Tamm',
    workDescription: 'Ventilatsiooni kanalite paigaldus 2. korrusel. Lõpetatud A-sektsiooni magistraalkanal. Alustatud harukanalite ühendamist.',
    materials: ['Kanalid Ø200mm - 24m', 'Kanalid Ø160mm - 18m', 'Kinnitused - 45 tk'],
    equipment: ['Tõstuk', 'Keevitusaparaat', 'Lõikur'],
    notes: 'Järgmine päev jätkata harukanalitega',
    createdBy: 'Jaan Tamm',
    createdAt: '2024-03-15T16:30:00',
  },
  {
    id: '2',
    date: '2024-03-14',
    weather: 'sunny',
    temperature: 10,
    shift: 'day',
    workers: 5,
    supervisor: 'Jaan Tamm',
    workDescription: 'Ventilatsiooni agregaadi paigaldus tehnilisse ruumi. Ühenduste tegemine.',
    materials: ['VKT seade - 1 tk', 'Torud Ø50mm - 12m', 'Isolatsioon - 15m²'],
    equipment: ['Kraana', 'Tõstuk'],
    createdBy: 'Peeter Mets',
    createdAt: '2024-03-14T17:00:00',
  },
  {
    id: '3',
    date: '2024-03-13',
    weather: 'rainy',
    temperature: 6,
    shift: 'day',
    workers: 4,
    supervisor: 'Jaan Tamm',
    workDescription: 'Sisetööd - küttesüsteemi torustiku paigaldus 1. korrusel. Põrandakütte kollektori ühendamine.',
    materials: ['PEX torustik 16mm - 450m', 'Kollektor 8-väljundiga - 2 tk', 'Kinnitused - komplekt'],
    equipment: ['Torustiku rullik', 'Pressimisseade'],
    notes: 'Vihm segas välistöid, keskendusime sisetöödele',
    createdBy: 'Jaan Tamm',
    createdAt: '2024-03-13T16:45:00',
  },
]

const weatherConfig: Record<string, { label: string; icon: string }> = {
  sunny: { label: 'Päikseline', icon: '☀️' },
  cloudy: { label: 'Pilves', icon: '☁️' },
  rainy: { label: 'Vihmane', icon: '🌧️' },
  snowy: { label: 'Lumine', icon: '❄️' },
}

const shiftLabels: Record<string, string> = {
  day: 'Päevane vahetus',
  night: 'Öine vahetus',
}

export default function ETPPage() {
  const params = useParams()
  const projectId = params.id as string

  const [entries] = useState<DiaryEntry[]>(mockEntries)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('et-EE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedMonth(newDate)
  }

  const monthYearLabel = selectedMonth.toLocaleDateString('et-EE', {
    month: 'long',
    year: 'numeric',
  })

  // Stats for current month
  const totalEntries = entries.length
  const totalWorkerDays = entries.reduce((sum, e) => sum + e.workers, 0)
  const avgWorkers = totalEntries > 0 ? Math.round(totalWorkerDays / totalEntries) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ehitustööde päevikud</h2>
          <p className="text-sm text-gray-500">ETP - igapäevased töökanded</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Ekspordi
          </button>
          <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Prindi
          </button>
          <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Uus kanne
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kanded sel kuul</p>
          <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Töötajate päevad</p>
          <p className="text-2xl font-bold text-gray-900">{totalWorkerDays}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Keskm. töötajaid/päev</p>
          <p className="text-2xl font-bold text-gray-900">{avgWorkers}</p>
        </div>
      </div>

      {/* Month Navigation & Search */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium capitalize">{monthYearLabel}</span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi kannetes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex items-stretch">
              {/* Date Column */}
              <div className="w-32 bg-gray-50 p-4 flex flex-col items-center justify-center border-r">
                <p className="text-3xl font-bold text-gray-900">
                  {new Date(entry.date).getDate()}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {new Date(entry.date).toLocaleDateString('et-EE', { weekday: 'short', month: 'short' })}
                </p>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>{weatherConfig[entry.weather].icon}</span>
                      {entry.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {shiftLabels[entry.shift]}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {entry.workers} töötajat
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{entry.supervisor}</span>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <p className="text-gray-900 mb-3">{entry.workDescription}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  {entry.materials.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Materjalid:</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.materials.map((material, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entry.equipment.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Tehnika:</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.equipment.map((equip, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {equip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Märkused:</span> {entry.notes}
                    </p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
                  <span>Sisestas: {entry.createdBy}</span>
                  <span>Loodud: {formatTime(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Kandeid ei leitud</p>
            <button className="mt-4 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d]">
              Lisa esimene kanne
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
