'use client'

/**
 * Leave - Puhkused
 * Puhkuste taotlemine ja ülevaade
 */

import React, { useState, useEffect } from 'react'
import {
  CalendarDays,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import LeaveRequestForm from '@/components/personnel/LeaveRequestForm'

interface LeaveBalance {
  id: string
  leave_type_id: string
  total_days: number
  used_days: number
  planned_days: number
  remaining_days: number
  leave_type: {
    id: string
    name: string
    code: string
    color: string
    icon: string
  }
}

interface LeaveRequest {
  id: string
  start_date: string
  end_date: string
  working_days: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason?: string
  leave_type: {
    name: string
    color: string
    icon: string
  }
  substitute?: {
    full_name: string
  }
  approved_by_employee?: {
    full_name: string
  }
  created_at: string
}

export default function LeavePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch balances
      const balancesResponse = await fetch('/api/personnel/leave-balances')
      const balancesResult = await balancesResponse.json()
      if (balancesResult.data) {
        setBalances(balancesResult.data)
      }

      // Fetch requests
      const requestsResponse = await fetch('/api/personnel/leave-requests?limit=20')
      const requestsResult = await requestsResponse.json()
      if (requestsResult.data) {
        setRequests(requestsResult.data)
      }
    } catch (error) {
      console.error('Error fetching leave data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Kinnitatud
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ootel
          </span>
        )
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Tagasi lükatud
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            Tühistatud
          </span>
        )
      default:
        return null
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (start === end) {
      return startDate.toLocaleDateString('et-EE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }

    return `${startDate.toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
    })} - ${endDate.toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }

  // Calculate totals
  const totalDays = balances.reduce((sum, b) => sum + b.total_days, 0)
  const usedDays = balances.reduce((sum, b) => sum + b.used_days, 0)
  const plannedDays = balances.reduce((sum, b) => sum + b.planned_days, 0)
  const remainingDays = balances.reduce((sum, b) => sum + b.remaining_days, 0)

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const upcomingLeaves = requests.filter(
    (r) => r.status === 'approved' && new Date(r.start_date) >= new Date()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Puhkused</h1>
          <p className="text-gray-500">Puhkuste taotlemine ja jälgimine</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Uus taotlus
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kokku päevi</p>
              <p className="text-3xl font-bold text-gray-800">{totalDays}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kasutatud</p>
              <p className="text-3xl font-bold text-orange-600">{usedDays}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Planeeritud</p>
              <p className="text-3xl font-bold text-yellow-600">{plannedDays}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jääk</p>
              <p className="text-3xl font-bold text-green-600">{remainingDays}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance by type */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Puhkuse saldod</h2>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 py-8 text-center text-gray-500">Laen...</div>
          ) : balances.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-gray-500">
              Puhkuse saldod pole veel seadistatud
            </div>
          ) : (
            balances.map((balance) => (
              <div
                key={balance.id}
                className="p-4 rounded-lg border hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{balance.leave_type.icon || '📅'}</span>
                  <span className="font-medium text-gray-800">
                    {balance.leave_type.name}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((balance.used_days + balance.planned_days) / balance.total_days) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {balance.used_days + balance.planned_days} / {balance.total_days} päeva
                  </span>
                  <span className="font-medium text-green-600">
                    Jääk: {balance.remaining_days}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending requests alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                {pendingRequests.length} taotlust ootab kinnitamist
              </p>
              <p className="text-sm text-yellow-600">
                Sinu juhil on kinnitamisel {pendingRequests.length} puhkusetaotlust
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming leaves */}
      {upcomingLeaves.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Tulevased puhkused</h2>
          </div>
          <div className="divide-y">
            {upcomingLeaves.slice(0, 3).map((leave) => (
              <div
                key={leave.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${leave.leave_type.color}20` }}
                  >
                    {leave.leave_type.icon || '📅'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{leave.leave_type.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateRange(leave.start_date, leave.end_date)} ({leave.working_days} päeva)
                    </p>
                  </div>
                </div>
                {getStatusBadge(leave.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All requests */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Kõik taotlused</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tüüp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Periood
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Päevi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Asendaja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Staatus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Esitatud
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">

                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Laen...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Taotlusi pole
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{request.leave_type.icon || '📅'}</span>
                        <span className="text-sm font-medium text-gray-800">
                          {request.leave_type.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateRange(request.start_date, request.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {request.working_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {request.substitute?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('et-EE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave request form modal */}
      <LeaveRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
