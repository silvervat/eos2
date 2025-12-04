'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface AttendanceDay {
  date: string
  hours: number
  status: 'approved' | 'pending' | 'rejected' | 'modified' | null
  project_name?: string
  is_holiday?: boolean
  is_weekend?: boolean
}

interface ThreeMonthCalendarProps {
  employeeId?: string
  onDayClick?: (date: string, data: AttendanceDay | null) => void
}

const WEEKDAYS_SHORT = ['E', 'T', 'K', 'N', 'R', 'L', 'P']
const MONTHS_EST = [
  'Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni',
  'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'
]

export default function ThreeMonthCalendar({
  employeeId,
  onDayClick,
}: ThreeMonthCalendarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceDay>>(new Map())
  const [holidays, setHolidays] = useState<Set<string>>(new Set())

  // Calculate the three months to display
  const months = useMemo(() => {
    const result = []
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      result.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: MONTHS_EST[date.getMonth()],
      })
    }
    return result
  }, [currentDate])

  // Fetch attendance data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)

      const startDate = new Date(months[0].year, months[0].month, 1)
      const endDate = new Date(months[2].year, months[2].month + 1, 0)

      try {
        // Fetch attendance
        const attendanceResponse = await fetch(
          `/api/personnel/attendance?employeeId=${employeeId || ''}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=100`
        )
        const attendanceResult = await attendanceResponse.json()

        if (attendanceResult.data) {
          const dataMap = new Map<string, AttendanceDay>()

          // Group by date and calculate hours
          const dayGroups = new Map<string, typeof attendanceResult.data>()

          attendanceResult.data.forEach((record: {
            date: string
            type: string
            status: string
            worked_hours?: number
            project?: { name: string }
          }) => {
            const date = record.date
            if (!dayGroups.has(date)) {
              dayGroups.set(date, [])
            }
            dayGroups.get(date)!.push(record)
          })

          dayGroups.forEach((records, date) => {
            const checkIns = records.filter((r: { type: string }) => r.type === 'check_in')
            const hours = checkIns.reduce((sum: number, r: { worked_hours?: number }) => sum + (r.worked_hours || 0), 0)
            const status = checkIns[0]?.status || null
            const projectName = checkIns[0]?.project?.name

            dataMap.set(date, {
              date,
              hours,
              status,
              project_name: projectName,
            })
          })

          setAttendanceData(dataMap)
        }

        // Fetch holidays (simplified - just weekend handling for now)
        const holidaySet = new Set<string>()
        // TODO: Fetch actual holidays from API
        setHolidays(holidaySet)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [employeeId, months])

  // Generate calendar days for a month
  const generateMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7 // Monday = 0
    const days: (Date | null)[] = []

    // Add padding for days before the first day
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Get cell color based on status
  const getCellStyle = (day: AttendanceDay | null, isWeekend: boolean, isToday: boolean) => {
    if (!day) {
      if (isWeekend) {
        return 'bg-gray-100 text-gray-400'
      }
      return 'bg-gray-50 text-gray-400'
    }

    if (day.status === 'approved') {
      return 'bg-green-500 text-white hover:bg-green-600'
    }
    if (day.status === 'pending') {
      return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
    }
    if (day.status === 'rejected') {
      return 'bg-red-500 text-white hover:bg-red-600'
    }
    if (day.status === 'modified') {
      return 'bg-orange-400 text-orange-900 hover:bg-orange-500'
    }

    if (isWeekend) {
      return 'bg-gray-100 text-gray-400'
    }

    return 'bg-gray-50 text-gray-500 hover:bg-gray-100'
  }

  const handlePrevPeriod = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1))
  }

  const handleNextPeriod = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1))
  }

  const handleDayClick = (date: Date | null) => {
    if (!date || !onDayClick) return
    const dateStr = date.toISOString().split('T')[0]
    onDayClick(dateStr, attendanceData.get(dateStr) || null)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Tööaja kalender</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPeriod}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400 text-sm font-medium px-2">
            {months[0].name} - {months[2].name} {months[0].year}
          </span>
          <button
            onClick={handleNextPeriod}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {months.map(({ year, month, name }) => {
            const days = generateMonthDays(year, month)

            return (
              <div key={`${year}-${month}`}>
                {/* Month name */}
                <div className="text-center mb-2">
                  <span className="text-gray-300 font-medium text-sm">{name}</span>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS_SHORT.map((day, i) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-medium py-1 ${
                        i >= 5 ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="aspect-square" />
                    }

                    const dateStr = date.toISOString().split('T')[0]
                    const dayData = attendanceData.get(dateStr) || null
                    const dayOfWeek = (date.getDay() + 6) % 7 // Monday = 0
                    const isWeekend = dayOfWeek >= 5
                    const isToday = dateStr === today
                    const isHoliday = holidays.has(dateStr)

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(date)}
                        title={
                          dayData
                            ? `${dateStr}: ${dayData.hours}h ${dayData.project_name ? `(${dayData.project_name})` : ''} - ${dayData.status || 'N/A'}`
                            : dateStr
                        }
                        className={`
                          aspect-square flex items-center justify-center
                          text-xs font-medium rounded transition-colors
                          ${getCellStyle(dayData, isWeekend || isHoliday, isToday)}
                          ${isToday ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {dayData && dayData.hours > 0 ? Math.round(dayData.hours) : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-gray-400">Kinnitatud</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span className="text-gray-400">Ootel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-400">Tagasi lükatud</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400" />
          <span className="text-gray-400">Muudetud</span>
        </div>
      </div>
    </div>
  )
}
