'use client'

import React, { useMemo } from 'react'
import { Play, Pause, Square, Clock, Loader2 } from 'lucide-react'
import { useWorkSession } from '@/contexts/WorkSessionContext'

export default function HeaderWorkTimer() {
  const { activeSession, elapsedSeconds, isLoading, pauseWork, resumeWork, stopWork } = useWorkSession()

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600)
    const mins = Math.floor((elapsedSeconds % 3600) / 60)
    const secs = elapsedSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [elapsedSeconds])

  if (!activeSession) {
    return null
  }

  const handlePauseResume = () => {
    if (activeSession.isPaused) {
      resumeWork()
    } else {
      pauseWork()
    }
  }

  const handleStop = async () => {
    try {
      await stopWork()
    } catch (err) {
      console.error('Error stopping work:', err)
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
      {/* Timer indicator */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${activeSession.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
        <Clock className="w-3.5 h-3.5 text-green-600" />
      </div>

      {/* Time display */}
      <span className={`font-mono text-sm font-medium ${activeSession.isPaused ? 'text-yellow-700' : 'text-green-700'}`}>
        {formattedTime}
      </span>

      {/* Project name (truncated) */}
      {activeSession.projectName && (
        <span className="hidden md:inline text-xs text-gray-500 max-w-24 truncate" title={activeSession.projectName}>
          {activeSession.projectName}
        </span>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-1 ml-1">
        {/* Pause/Resume button */}
        <button
          onClick={handlePauseResume}
          disabled={isLoading}
          className={`p-1 rounded transition-colors ${
            activeSession.isPaused
              ? 'text-green-600 hover:bg-green-100'
              : 'text-yellow-600 hover:bg-yellow-100'
          } disabled:opacity-50`}
          title={activeSession.isPaused ? 'Jätka' : 'Peata'}
        >
          {activeSession.isPaused ? (
            <Play className="w-3.5 h-3.5" />
          ) : (
            <Pause className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Stop button */}
        <button
          onClick={handleStop}
          disabled={isLoading}
          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
          title="Lõpeta töö"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
