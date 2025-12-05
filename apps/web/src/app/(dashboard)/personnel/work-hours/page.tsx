'use client'

/**
 * Work Hours - Tööaeg
 * Töötundide registreerimine ja ülevaade
 */

import React, { useState, useEffect } from 'react'
import {
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react'
import AttendanceCheckInCard from '@/components/personnel/AttendanceCheckInCard'
import ThreeMonthCalendar from '@/components/personnel/ThreeMonthCalendar'

interface AttendanceSummary {
  today_hours: number
  week_hours: number
  month_hours: number
  pending_count: number
  approved_count: number
}

interface RecentEntry {
  id: string
  date: string
  project_name?: string
  check_in: string
  check_out?: string
  hours: number
  status: 'pending' | 'approved' | 'rejected' | 'modified'
}

export default function WorkHoursPage() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch recent attendance
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const response = await fetch(
          `/api/personnel/attendance?startDate=${thirtyDaysAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}&limit=10`
        )
        const result = await response.json()

        if (result.data) {
          // Group by date
          const checkIns = result.data.filter((r: { type: string }) => r.type === 'check_in')
          const entries: RecentEntry[] = checkIns.map((record: {
            id: string
            date: string
            timestamp: string
            worked_hours?: number
            status: string
            project?: { name: string }
          }) => ({
            id: record.id,
            date: record.date,
            project_name: record.project?.name,
            check_in: new Date(record.timestamp).toLocaleTimeString('et-EE', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            hours: record.worked_hours || 0,
            status: record.status,
          }))

          setRecentEntries(entries)

          // Calculate summary
          const todayStr = today.toISOString().split('T')[0]
          const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
          const weekStartStr = weekStart.toISOString().split('T')[0]
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          const monthStartStr = monthStart.toISOString().split('T')[0]

          const todayHours = checkIns
            .filter((r: { date: string }) => r.date === todayStr)
            .reduce((sum: number, r: { worked_hours?: number }) => sum + (r.worked_hours || 0), 0)

          const weekHours = checkIns
            .filter((r: { date: string }) => r.date >= weekStartStr)
            .reduce((sum: number, r: { worked_hours?: number }) => sum + (r.worked_hours || 0), 0)

          const monthHours = checkIns
            .filter((r: { date: string }) => r.date >= monthStartStr)
            .reduce((sum: number, r: { worked_hours?: number }) => sum + (r.worked_hours || 0), 0)

          const pendingCount = checkIns.filter((r: { status: string }) => r.status === 'pending').length
          const approvedCount = checkIns.filter((r: { status: string }) => r.status === 'approved').length

          setSummary({
            today_hours: todayHours,
            week_hours: weekHours,
            month_hours: monthHours,
            pending_count: pendingCount,
            approved_count: approvedCount,
          })
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}min`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Kinnitatud
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ootel
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Tagasi lükatud
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tööaeg</h1>
          <p className="text-gray-500">Registreeri ja jälgi oma tööaega</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtreeri
          </button>
          <button className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Ekspordi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Täna</p>
              <p className="text-2xl font-bold text-gray-800">
                {summary ? formatHours(summary.today_hours) : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sel nädalal</p>
              <p className="text-2xl font-bold text-gray-800">
                {summary ? formatHours(summary.week_hours) : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sel kuul</p>
              <p className="text-2xl font-bold text-gray-800">
                {summary ? formatHours(summary.month_hours) : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kinnitamisel</p>
              <p className="text-2xl font-bold text-yellow-600">
                {summary?.pending_count || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kinnitatud</p>
              <p className="text-2xl font-bold text-green-600">
                {summary?.approved_count || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Check-in card */}
        <div className="col-span-1">
          <AttendanceCheckInCard />
        </div>

        {/* 3-month calendar */}
        <div className="col-span-2">
          <ThreeMonthCalendar
            onDayClick={(date, data) => {
              console.log('Clicked date:', date, data)
            }}
          />
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Viimased registreeringud</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kuupäev
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Projekt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Algus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tunnid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Staatus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Laen...
                  </td>
                </tr>
              ) : recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Registreeringuid pole
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(entry.date).toLocaleDateString('et-EE', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.project_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.check_in}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {entry.hours > 0 ? formatHours(entry.hours) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
