'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Archive,
  Folder,
  Info,
  Users,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  User,
  Download,
  Eye,
  Edit3,
  Share2,
  Trash2,
  ExternalLink,
  Copy,
  Calendar,
  HardDrive,
  Tag,
  MapPin,
} from 'lucide-react'
import { Button, Input } from '@rivest/ui'

interface FileInfo {
  id: string
  name: string
  originalName?: string
  mimeType: string
  sizeBytes: number
  extension?: string
  path: string
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  owner?: {
    fullName: string
    email: string
  }
  tags?: string[]
  gpsLocation?: string
  takenAt?: string
  cameraMake?: string
  cameraModel?: string
}

interface Activity {
  id: string
  action: string
  createdAt: string
  user?: {
    fullName: string
  }
  details?: Record<string, unknown>
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    full_name: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface FileInfoSidebarProps {
  open: boolean
  onClose: () => void
  fileId: string | null
  folderId?: string | null
  isFolder?: boolean
  onDownload?: () => void
  onShare?: () => void
  onDelete?: () => void
  onRename?: () => void
}

// File icon helper
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive
  return File
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('et-EE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min tagasi`
  if (hours < 24) return `${hours}h tagasi`
  if (days < 7) return `${days} päeva tagasi`
  return formatDate(dateString)
}

// Action type labels
const actionLabels: Record<string, string> = {
  upload: 'Laadis üles',
  download: 'Laadis alla',
  view: 'Vaatas',
  edit: 'Muutis',
  rename: 'Nimetas ümber',
  move: 'Teisaldas',
  share: 'Jagas',
  comment: 'Kommenteeris',
  delete: 'Kustutas',
  restore: 'Taastas',
}

export function FileInfoSidebar({
  open,
  onClose,
  fileId,
  folderId,
  isFolder = false,
  onDownload,
  onShare,
  onDelete,
  onRename,
}: FileInfoSidebarProps) {
  const [file, setFile] = useState<FileInfo | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'details' | 'activity' | 'description'>('details')
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    activity: false,
    comments: true,
    description: false,
  })

  // Fetch file info
  const fetchFileInfo = useCallback(async () => {
    if (!fileId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/file-vault/files/${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setFile(data)
      }
    } catch (error) {
      console.error('Error fetching file info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  // Fetch activity
  const fetchActivity = useCallback(async () => {
    if (!fileId) return

    try {
      const response = await fetch(`/api/file-vault/files/${fileId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }, [fileId])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!fileId) return

    try {
      const response = await fetch(`/api/file-vault/comments?fileId=${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [fileId])

  // Submit a new comment
  const submitComment = async () => {
    if (!fileId || !newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch('/api/file-vault/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
      } else {
        const error = await response.json()
        alert(error.error || 'Kommentaari lisamine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Kommentaari lisamine ebaõnnestus')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  useEffect(() => {
    if (open && fileId) {
      fetchFileInfo()
      fetchActivity()
      fetchComments()
    }
  }, [open, fileId, fetchFileInfo, fetchActivity, fetchComments])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!open) return null

  const FileIcon = file ? getFileIcon(file.mimeType) : isFolder ? Folder : File

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            {isFolder ? (
              <Folder className="w-5 h-5 text-amber-500" />
            ) : (
              <FileIcon className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-slate-900 truncate text-sm">
              {file?.name || 'Laadin...'}
            </h3>
            {file?.originalName && file.originalName !== file.name && (
              <p className="text-xs text-slate-500 truncate">
                Algne: {file.originalName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      {!isFolder && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200">
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="flex-1 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Laadi alla
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="flex-1 h-8 text-xs"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              Jaga
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#279989] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Details Section */}
            <div className="border-b border-slate-100">
              <button
                onClick={() => toggleSection('details')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Üksikasjad</span>
                </div>
                {expandedSections.details ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedSections.details && file && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Type */}
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Tüüp</p>
                      <p className="text-sm text-slate-900">{file.mimeType}</p>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="flex items-start gap-3">
                    <HardDrive className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Suurus</p>
                      <p className="text-sm text-slate-900">{formatFileSize(file.sizeBytes)}</p>
                    </div>
                  </div>

                  {/* Dimensions (for images/videos) */}
                  {file.width && file.height && (
                    <div className="flex items-start gap-3">
                      <ImageIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Mõõtmed</p>
                        <p className="text-sm text-slate-900">{file.width} × {file.height}px</p>
                      </div>
                    </div>
                  )}

                  {/* Path */}
                  <div className="flex items-start gap-3">
                    <Folder className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Asukoht</p>
                      <p className="text-sm text-slate-900 break-all">{file.path || '/'}</p>
                    </div>
                  </div>

                  {/* Owner */}
                  {file.owner && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Omanik</p>
                        <p className="text-sm text-slate-900">{file.owner.fullName}</p>
                      </div>
                    </div>
                  )}

                  {/* Created */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Loodud</p>
                      <p className="text-sm text-slate-900">{formatDate(file.createdAt)}</p>
                    </div>
                  </div>

                  {/* Modified */}
                  <div className="flex items-start gap-3">
                    <Edit3 className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Muudetud</p>
                      <p className="text-sm text-slate-900">{formatDate(file.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Camera info (for photos) */}
                  {file.cameraMake && (
                    <div className="flex items-start gap-3">
                      <ImageIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Kaamera</p>
                        <p className="text-sm text-slate-900">
                          {file.cameraMake} {file.cameraModel}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Photo date */}
                  {file.takenAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Pildistatud</p>
                        <p className="text-sm text-slate-900">{formatDate(file.takenAt)}</p>
                      </div>
                    </div>
                  )}

                  {/* GPS Location */}
                  {file.gpsLocation && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Asukoht</p>
                        <p className="text-sm text-slate-900">{file.gpsLocation}</p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Sildid</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Activity Section */}
            <div className="border-b border-slate-100">
              <button
                onClick={() => toggleSection('activity')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Tegevused</span>
                  {activities.length > 0 && (
                    <span className="text-xs text-slate-400">({activities.length})</span>
                  )}
                </div>
                {expandedSections.activity ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedSections.activity && (
                <div className="px-4 pb-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Tegevusi pole veel
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-3 h-3 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900">
                              <span className="font-medium">
                                {activity.user?.fullName || 'Keegi'}
                              </span>{' '}
                              {actionLabels[activity.action] || activity.action}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatRelativeTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="border-b border-slate-100">
              <button
                onClick={() => toggleSection('comments')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Kommentaarid</span>
                  {comments.length > 0 && (
                    <span className="text-xs text-slate-400">({comments.length})</span>
                  )}
                </div>
                {expandedSections.comments ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedSections.comments && (
                <div className="px-4 pb-4">
                  {/* Comment input */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Lisa kommentaar..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          submitComment()
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={submitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      style={{ backgroundColor: '#279989' }}
                    >
                      {isSubmittingComment ? '...' : 'Lisa'}
                    </Button>
                  </div>

                  {/* Comments list */}
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-2">
                      Kommentaare pole veel
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-3 h-3 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                {comment.user?.full_name || 'Tundmatu'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatRelativeTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        {onRename && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRename}
            className="w-full justify-start text-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Nimeta ümber
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Kustuta
          </Button>
        )}
      </div>
    </div>
  )
}

export default FileInfoSidebar
