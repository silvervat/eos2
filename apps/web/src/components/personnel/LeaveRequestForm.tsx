'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  User,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface LeaveType {
  id: string
  name: string
  code: string
  color: string
  icon: string
  days_per_year: number | null
  requires_document: boolean
  requires_substitute: boolean
  min_notice_days: number
}

interface Employee {
  id: string
  full_name: string
  employee_code: string
}

interface LeaveBalance {
  id: string
  leave_type_id: string
  total_days: number
  used_days: number
  planned_days: number
  remaining_days: number
  leave_type: LeaveType
}

interface LeaveRequestFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  employeeId?: string
}

export default function LeaveRequestForm({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
}: LeaveRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Form state
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [substituteId, setSubstituteId] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Calculated working days
  const [workingDays, setWorkingDays] = useState<number>(0)

  // Fetch initial data
  useEffect(() => {
    if (!isOpen) return

    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch leave types
        const typesResponse = await fetch('/api/personnel/leave-types')
        const typesResult = await typesResponse.json()
        if (typesResult.data) {
          setLeaveTypes(typesResult.data)
        }

        // Fetch leave balances
        const balancesResponse = await fetch('/api/personnel/leave-balances')
        const balancesResult = await balancesResponse.json()
        if (balancesResult.data) {
          setLeaveBalances(balancesResult.data)
        }

        // Fetch employees for substitute selection
        const employeesResponse = await fetch('/api/employees?status=active&limit=100')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.data) {
          setEmployees(employeesResult.data)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Andmete laadimine ebaõnnestus')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isOpen])

  // Calculate working days when dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      setWorkingDays(0)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      setWorkingDays(0)
      return
    }

    let count = 0
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    setWorkingDays(count)
  }, [startDate, endDate])

  // Get selected leave type details
  const selectedType = leaveTypes.find((t) => t.id === selectedLeaveType)
  const selectedBalance = leaveBalances.find((b) => b.leave_type_id === selectedLeaveType)

  // Get minimum date (today + min_notice_days)
  const getMinDate = () => {
    const min = new Date()
    const noticeDays = selectedType?.min_notice_days || 1
    min.setDate(min.getDate() + noticeDays)
    return min.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validation
      if (!selectedLeaveType) {
        throw new Error('Palun vali puhkuse tüüp')
      }
      if (!startDate || !endDate) {
        throw new Error('Palun vali kuupäevad')
      }
      if (workingDays <= 0) {
        throw new Error('Valitud perioodis pole tööpäevi')
      }
      if (selectedType?.requires_substitute && !substituteId) {
        throw new Error('Asendaja on kohustuslik')
      }
      if (selectedBalance && workingDays > selectedBalance.remaining_days) {
        throw new Error(`Sul pole piisavalt puhkusepäevi. Jääk: ${selectedBalance.remaining_days} päeva`)
      }

      const response = await fetch('/api/personnel/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId: selectedLeaveType,
          startDate,
          endDate,
          workingDays,
          substituteId: substituteId || null,
          reason: reason || null,
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Taotluse esitamine ebaõnnestus')
      }

      setSuccess('Puhkusetaotlus esitatud!')

      // Reset form
      setSelectedLeaveType('')
      setStartDate('')
      setEndDate('')
      setSubstituteId('')
      setReason('')
      setNotes('')

      if (onSuccess) {
        onSuccess()
      }

      // Close modal after delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Viga taotluse esitamisel')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Uus puhkusetaotlus</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puhkuse tüüp *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {leaveTypes.map((type) => {
                  const balance = leaveBalances.find((b) => b.leave_type_id === type.id)
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedLeaveType(type.id)}
                      className={`
                        p-3 rounded-lg border text-left transition-colors
                        ${selectedLeaveType === type.id
                          ? 'border-[#279989] bg-[#279989]/5 ring-2 ring-[#279989]'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{type.icon || '📅'}</span>
                        <span className="font-medium text-gray-800">{type.name}</span>
                      </div>
                      {balance && (
                        <p className="text-xs text-gray-500 mt-1">
                          Jääk: {balance.remaining_days} / {balance.total_days} päeva
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Algus *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Lõpp *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDate()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  required
                />
              </div>
            </div>

            {/* Working days info */}
            {workingDays > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{workingDays}</strong> tööpäeva
                  {selectedBalance && (
                    <span className="ml-2">
                      (jääb {selectedBalance.remaining_days - workingDays} päeva)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Substitute */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Asendaja {selectedType?.requires_substitute ? '*' : '(valikuline)'}
              </label>
              <select
                value={substituteId}
                onChange={(e) => setSubstituteId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                required={selectedType?.requires_substitute}
              >
                <option value="">Vali asendaja...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Põhjus (valikuline)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Lisa põhjendus..."
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989] resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Märkmed (valikuline)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lisainfo..."
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989] resize-none"
              />
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tühista
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedLeaveType || workingDays <= 0}
                className="flex-1 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saadan...
                  </>
                ) : (
                  'Esita taotlus'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
