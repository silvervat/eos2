'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Play,
  Square,
  Clock,
  MapPin,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  code: string
}

interface AttendanceCheckInCardProps {
  employeeId?: string
  onCheckIn?: (data: CheckInData) => void
  onCheckOut?: (data: CheckOutData) => void
}

interface CheckInData {
  projectId?: string
  latitude?: number
  longitude?: number
  gpsAccuracy?: number
  notes?: string
}

interface CheckOutData {
  latitude?: number
  longitude?: number
  gpsAccuracy?: number
  notes?: string
}

interface ActiveSession {
  id: string
  project_id?: string
  project_name?: string
  timestamp: string
  elapsed_seconds: number
}

export default function AttendanceCheckInCard({
  employeeId,
  onCheckIn,
  onCheckOut,
}: AttendanceCheckInCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
  } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?status=active&limit=100')
        const result = await response.json()
        if (result.data) {
          setProjects(result.data)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      }
    }
    fetchProjects()
  }, [])

  // Check for active session
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(
          `/api/personnel/attendance?employeeId=${employeeId || ''}&startDate=${today}&endDate=${today}&limit=10`
        )
        const result = await response.json()

        if (result.data && result.data.length > 0) {
          // Find the last check_in without a corresponding check_out
          const checkIns = result.data.filter((r: { type: string }) => r.type === 'check_in')
          const checkOuts = result.data.filter((r: { type: string }) => r.type === 'check_out')

          if (checkIns.length > checkOuts.length) {
            const lastCheckIn = checkIns[0]
            const checkInTime = new Date(lastCheckIn.timestamp)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - checkInTime.getTime()) / 1000)

            setActiveSession({
              id: lastCheckIn.id,
              project_id: lastCheckIn.project_id,
              project_name: lastCheckIn.project?.name,
              timestamp: lastCheckIn.timestamp,
              elapsed_seconds: elapsed,
            })
            setElapsedTime(elapsed)
          }
        }
      } catch (err) {
        console.error('Error checking active session:', err)
      }
    }

    checkActiveSession()
  }, [employeeId])

  // Timer for elapsed time
  useEffect(() => {
    if (!activeSession) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get GPS location
  const getGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }

    setGpsStatus('loading')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setGpsStatus('success')
      },
      (err) => {
        console.error('GPS error:', err)
        setGpsStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  // Get GPS on mount
  useEffect(() => {
    getGpsLocation()
  }, [getGpsLocation])

  const handleCheckIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/personnel/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check_in',
          projectId: selectedProject || null,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          gpsAccuracy: gpsLocation?.accuracy,
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed')
      }

      setSuccess('Töö alustatud!')
      setActiveSession({
        id: result.id,
        project_id: result.project_id,
        project_name: projects.find((p) => p.id === selectedProject)?.name,
        timestamp: result.timestamp,
        elapsed_seconds: 0,
      })
      setElapsedTime(0)
      setNotes('')

      if (onCheckIn) {
        onCheckIn({
          projectId: selectedProject || undefined,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          gpsAccuracy: gpsLocation?.accuracy,
          notes: notes || undefined,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/personnel/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check_out',
          projectId: activeSession?.project_id || null,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          gpsAccuracy: gpsLocation?.accuracy,
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Check-out failed')
      }

      const hoursWorked = (elapsedTime / 3600).toFixed(2)
      setSuccess(`Töö lõpetatud! Töötasid ${hoursWorked} tundi.`)
      setActiveSession(null)
      setElapsedTime(0)
      setNotes('')

      if (onCheckOut) {
        onCheckOut({
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          gpsAccuracy: gpsLocation?.accuracy,
          notes: notes || undefined,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                activeSession ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Clock
                className={`w-6 h-6 ${activeSession ? 'text-green-600' : 'text-gray-500'}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Tööaja arvestus</h3>
              <p className="text-sm text-gray-500">
                {activeSession ? 'Töö käib' : 'Pole tööl'}
              </p>
            </div>
          </div>

          {/* GPS Status */}
          <div className="flex items-center gap-2 text-sm">
            {gpsStatus === 'loading' && (
              <>
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-gray-500">GPS...</span>
              </>
            )}
            {gpsStatus === 'success' && (
              <>
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-green-600">GPS OK</span>
              </>
            )}
            {gpsStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600">GPS puudub</span>
              </>
            )}
          </div>
        </div>

        {/* Timer display when active */}
        {activeSession && (
          <div className="mb-6 text-center">
            <div className="text-5xl font-mono font-bold text-gray-800 mb-2">
              {formatElapsedTime(elapsedTime)}
            </div>
            {activeSession.project_name && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{activeSession.project_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Project selection (only when not checked in) */}
        {!activeSession && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projekt (valikuline)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
            >
              <option value="">Vali projekt...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Märkmed (valikuline)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lisa märkmeid..."
            rows={2}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989] resize-none"
          />
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!activeSession ? (
            <button
              onClick={handleCheckIn}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Alusta tööd
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Lõpeta töö
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
