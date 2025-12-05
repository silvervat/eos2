'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Play,
  Square,
  Pause,
  Clock,
  MapPin,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useWorkSession } from '@/contexts/WorkSessionContext'

interface Project {
  id: string
  name: string
  code: string
}

interface AttendanceCheckInCardProps {
  employeeId?: string
  onCheckIn?: () => void
  onCheckOut?: () => void
}

export default function AttendanceCheckInCard({
  employeeId,
  onCheckIn,
  onCheckOut,
}: AttendanceCheckInCardProps) {
  const {
    activeSession,
    elapsedSeconds,
    isLoading: contextLoading,
    startWork,
    pauseWork,
    resumeWork,
    stopWork,
  } = useWorkSession()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [notes, setNotes] = useState('')
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
      const projectName = projects.find((p) => p.id === selectedProject)?.name
      await startWork(selectedProject || undefined, projectName)

      setSuccess('Töö alustatud!')
      setNotes('')

      if (onCheckIn) {
        onCheckIn()
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
      await stopWork()

      const hoursWorked = (elapsedSeconds / 3600).toFixed(2)
      setSuccess(`Töö lõpetatud! Töötasid ${hoursWorked} tundi.`)
      setNotes('')

      if (onCheckOut) {
        onCheckOut()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseResume = () => {
    if (activeSession?.isPaused) {
      resumeWork()
    } else {
      pauseWork()
    }
  }

  const loading = isLoading || contextLoading

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                activeSession
                  ? activeSession.isPaused
                    ? 'bg-yellow-100'
                    : 'bg-green-100'
                  : 'bg-gray-100'
              }`}
            >
              <Clock
                className={`w-6 h-6 ${
                  activeSession
                    ? activeSession.isPaused
                      ? 'text-yellow-600'
                      : 'text-green-600'
                    : 'text-gray-500'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Tööaja arvestus</h3>
              <p className="text-sm text-gray-500">
                {activeSession
                  ? activeSession.isPaused
                    ? 'Paus'
                    : 'Töö käib'
                  : 'Pole tööl'}
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
            <div className={`text-5xl font-mono font-bold mb-2 ${activeSession.isPaused ? 'text-yellow-600' : 'text-gray-800'}`}>
              {formatElapsedTime(elapsedSeconds)}
            </div>
            {activeSession.isPaused && (
              <div className="text-sm text-yellow-600 mb-2">Paus</div>
            )}
            {activeSession.projectName && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{activeSession.projectName}</span>
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Alusta tööd
            </button>
          ) : (
            <>
              {/* Pause/Resume button */}
              <button
                onClick={handlePauseResume}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeSession.isPaused
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {activeSession.isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Jätka
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Paus
                  </>
                )}
              </button>

              {/* Stop button */}
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Lõpeta töö
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
