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
const MONTHS_SHORT = ['Jaan', 'Veeb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Det']

export default function ThreeMonthCalendar({
  employeeId,
  onDayClick,
}: ThreeMonthCalendarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceDay>>(new Map())
  const [holidays, setHolidays] = useState<Set<string>>(new Set())

  const months = useMemo(() => {
    const result = []
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      result.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        name: MONTHS_SHORT[date.getMonth()],
      })
    }
    return result
  }, [currentDate])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const startDate = new Date(months[0].year, months[0].month, 1)
      const endDate = new Date(months[2].year, months[2].month + 1, 0)

      try {
        const attendanceResponse = await fetch(
          `/api/personnel/attendance?employeeId=${employeeId || ''}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=100`
        )
        const attendanceResult = await attendanceResponse.json()

        if (attendanceResult.data) {
          const dataMap = new Map<string, AttendanceDay>()
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

            dataMap.set(date, { date, hours, status, project_name: projectName })
          })

          setAttendanceData(dataMap)
        }
        setHolidays(new Set<string>())
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [employeeId, months])

  const generateMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day))
    return days
  }

  const getCellStyle = (day: AttendanceDay | null, isWeekend: boolean) => {
    if (!day) return isWeekend ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 text-gray-300'
    if (day.status === 'approved') return 'bg-[#279989] text-white'
    if (day.status === 'pending') return 'bg-yellow-400 text-yellow-900'
    if (day.status === 'rejected') return 'bg-red-500 text-white'
    if (day.status === 'modified') return 'bg-orange-400 text-white'
    return isWeekend ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 text-gray-400'
  }

  const handlePrevPeriod = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1))
  const handleNextPeriod = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1))
  const handleDayClick = (date: Date | null) => {
    if (!date || !onDayClick) return
    const dateStr = date.toISOString().split('T')[0]
    onDayClick(dateStr, attendanceData.get(dateStr) || null)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-xl border p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Tööaja kalender</span>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevPeriod} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-gray-500 px-1">
            {months[0].name} - {months[2].name} {months[0].year}
          </span>
          <button onClick={handleNextPeriod} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {months.map(({ year, month, name }) => {
            const days = generateMonthDays(year, month)
            return (
              <div key={`${year}-${month}`}>
                <div className="text-center mb-1">
                  <span className="text-[10px] font-medium text-gray-600">{name}</span>
                </div>
                <div className="grid grid-cols-7 gap-px mb-px">
                  {WEEKDAYS_SHORT.map((day, i) => (
                    <div key={day} className={`text-center text-[8px] ${i >= 5 ? 'text-gray-400' : 'text-gray-500'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="w-4 h-4" />
                    const dateStr = date.toISOString().split('T')[0]
                    const dayData = attendanceData.get(dateStr) || null
                    const dayOfWeek = (date.getDay() + 6) % 7
                    const isWeekend = dayOfWeek >= 5
                    const isToday = dateStr === today

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(date)}
                        title={dayData ? `${dayData.hours}h` : dateStr}
                        className={`
                          w-4 h-4 flex items-center justify-center text-[7px] font-medium rounded-sm
                          ${getCellStyle(dayData, isWeekend || holidays.has(dateStr))}
                          ${isToday ? 'ring-1 ring-blue-400' : ''}
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

      {/* Compact legend */}
      <div className="mt-2 flex items-center justify-center gap-3 text-[8px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#279989]" />
          <span className="text-gray-500">OK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-yellow-400" />
          <span className="text-gray-500">Ootel</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-red-500" />
          <span className="text-gray-500">Keeld</span>
        </div>
      </div>
    </div>
  )
}
