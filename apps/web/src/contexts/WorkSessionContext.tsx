'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface WorkSession {
  id: string
  projectId?: string
  projectName?: string
  startTime: Date
  isPaused: boolean
  pausedAt?: Date
  totalPausedSeconds: number
}

interface WorkSessionContextType {
  activeSession: WorkSession | null
  elapsedSeconds: number
  isLoading: boolean
  startWork: (projectId?: string, projectName?: string) => Promise<void>
  pauseWork: () => void
  resumeWork: () => void
  stopWork: () => Promise<void>
  refreshSession: () => Promise<void>
}

const WorkSessionContext = createContext<WorkSessionContextType | undefined>(undefined)

export function WorkSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('workSession')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        const session: WorkSession = {
          ...parsed,
          startTime: new Date(parsed.startTime),
          pausedAt: parsed.pausedAt ? new Date(parsed.pausedAt) : undefined,
        }
        setActiveSession(session)
      } catch (e) {
        console.error('Error parsing saved work session:', e)
        localStorage.removeItem('workSession')
      }
    }
  }, [])

  // Save session to localStorage when it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('workSession', JSON.stringify(activeSession))
    } else {
      localStorage.removeItem('workSession')
    }
  }, [activeSession])

  // Timer logic
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0)
      return
    }

    const calculateElapsed = () => {
      if (activeSession.isPaused && activeSession.pausedAt) {
        // When paused, elapsed time is up to pause moment minus total paused time
        const pausedAt = activeSession.pausedAt
        const totalSeconds = Math.floor((pausedAt.getTime() - activeSession.startTime.getTime()) / 1000)
        return Math.max(0, totalSeconds - activeSession.totalPausedSeconds)
      } else {
        // When running, calculate from start minus total paused
        const now = new Date()
        const totalSeconds = Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000)
        return Math.max(0, totalSeconds - activeSession.totalPausedSeconds)
      }
    }

    setElapsedSeconds(calculateElapsed())

    if (!activeSession.isPaused) {
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [activeSession])

  const refreshSession = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(
        `/api/personnel/attendance?startDate=${today}&endDate=${today}&limit=10`
      )
      const result = await response.json()

      if (result.data && result.data.length > 0) {
        const checkIns = result.data.filter((r: { type: string }) => r.type === 'check_in')
        const checkOuts = result.data.filter((r: { type: string }) => r.type === 'check_out')

        if (checkIns.length > checkOuts.length) {
          const lastCheckIn = checkIns[0]
          const startTime = new Date(lastCheckIn.timestamp)

          // Check if we have a saved session with pause state
          const savedSession = localStorage.getItem('workSession')
          let isPaused = false
          let pausedAt: Date | undefined
          let totalPausedSeconds = 0

          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession)
              if (parsed.id === lastCheckIn.id) {
                isPaused = parsed.isPaused || false
                pausedAt = parsed.pausedAt ? new Date(parsed.pausedAt) : undefined
                totalPausedSeconds = parsed.totalPausedSeconds || 0
              }
            } catch (e) {
              console.error('Error parsing saved session:', e)
            }
          }

          setActiveSession({
            id: lastCheckIn.id,
            projectId: lastCheckIn.project_id,
            projectName: lastCheckIn.project?.name,
            startTime,
            isPaused,
            pausedAt,
            totalPausedSeconds,
          })
        } else {
          setActiveSession(null)
        }
      }
    } catch (err) {
      console.error('Error refreshing session:', err)
    }
  }, [])

  // Check for active session on mount
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const startWork = useCallback(async (projectId?: string, projectName?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/personnel/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check_in',
          projectId: projectId || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed')
      }

      setActiveSession({
        id: result.id,
        projectId,
        projectName,
        startTime: new Date(),
        isPaused: false,
        totalPausedSeconds: 0,
      })
    } catch (err) {
      console.error('Error starting work:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const pauseWork = useCallback(() => {
    if (!activeSession || activeSession.isPaused) return

    setActiveSession({
      ...activeSession,
      isPaused: true,
      pausedAt: new Date(),
    })
  }, [activeSession])

  const resumeWork = useCallback(() => {
    if (!activeSession || !activeSession.isPaused || !activeSession.pausedAt) return

    const pauseDuration = Math.floor((new Date().getTime() - activeSession.pausedAt.getTime()) / 1000)

    setActiveSession({
      ...activeSession,
      isPaused: false,
      pausedAt: undefined,
      totalPausedSeconds: activeSession.totalPausedSeconds + pauseDuration,
    })
  }, [activeSession])

  const stopWork = useCallback(async () => {
    if (!activeSession) return

    setIsLoading(true)
    try {
      // Calculate actual worked hours (excluding paused time)
      const workedSeconds = elapsedSeconds
      const workedHours = workedSeconds / 3600

      const response = await fetch('/api/personnel/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check_out',
          projectId: activeSession.projectId || null,
          workedHours,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Check-out failed')
      }

      setActiveSession(null)
      setElapsedSeconds(0)
    } catch (err) {
      console.error('Error stopping work:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [activeSession, elapsedSeconds])

  return (
    <WorkSessionContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        isLoading,
        startWork,
        pauseWork,
        resumeWork,
        stopWork,
        refreshSession,
      }}
    >
      {children}
    </WorkSessionContext.Provider>
  )
}

export function useWorkSession() {
  const context = useContext(WorkSessionContext)
  if (context === undefined) {
    throw new Error('useWorkSession must be used within a WorkSessionProvider')
  }
  return context
}
