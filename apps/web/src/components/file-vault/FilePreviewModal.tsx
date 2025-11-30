'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Download,
  Share2,
  Trash2,
  Star,
  StarOff,
  MessageSquare,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Loader2,
  Send,
  MapPin,
  Check,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'

interface FileItem {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string
  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string
  storageKey?: string
  isStarred?: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  commentCount?: number
  folder?: {
    id: string
    name: string
    path: string
  }
}

interface Comment {
  id: string
  content: string
  positionX?: number
  positionY?: number
  markerNumber?: number
  parentId?: string
  isResolved: boolean
  createdAt: string
  author: {
    full_name: string
    avatar_url?: string
  }
}

interface FilePreviewModalProps {
  file: FileItem | null
  files?: FileItem[]
  isOpen: boolean
  onClose: () => void
  vaultId: string
  onFileChange?: (file: FileItem) => void
  onDelete?: (fileId: string) => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FilePreviewModal({
  file,
  files = [],
  isOpen,
  onClose,
  vaultId,
  onFileChange,
  onDelete,
}: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [comments, setComments] = useState<{ location: Comment[]; general: Comment[] }>({
    location: [],
    general: [],
  })
  const [newComment, setNewComment] = useState('')
  const [isAddingLocationComment, setIsAddingLocationComment] = useState(false)
  const [pendingMarker, setPendingMarker] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const currentIndex = files.findIndex((f) => f.id === file?.id)
  const canGoNext = currentIndex < files.length - 1
  const canGoPrev = currentIndex > 0

  const isImage = file?.mimeType?.startsWith('image/')
  const isVideo = file?.mimeType?.startsWith('video/')
  const isAudio = file?.mimeType?.startsWith('audio/')
  const isPdf = file?.mimeType === 'application/pdf'

  // Load preview URL
  useEffect(() => {
    if (!file || !isOpen) return

    const loadPreview = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/file-vault/files/${file.id}/download`)
        const data = await response.json()
        if (data.downloadUrl) {
          setPreviewUrl(data.downloadUrl)
        }
      } catch (error) {
        console.error('Error loading preview:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
    loadComments()
    checkFavorite()
  }, [file?.id, isOpen])

  const loadComments = async () => {
    if (!file) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/comments`)
      const data = await response.json()
      setComments({
        location: data.locationComments || [],
        general: data.generalComments || [],
      })
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const checkFavorite = async () => {
    if (!file) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/favorite`)
      const data = await response.json()
      setIsFavorited(data.isFavorited)
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const handleDownload = async () => {
    if (!file) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/download`)
      const data = await response.json()
      if (data.downloadUrl) {
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = file.name
        link.click()
      }
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!file) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/favorite`, {
        method: 'POST',
      })
      const data = await response.json()
      setIsFavorited(data.isFavorited)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleDelete = async () => {
    if (!file || !confirm('Kas oled kindel, et soovid selle faili kustutada?')) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/delete`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onDelete?.(file.id)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleShare = async () => {
    if (!file) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 24 * 7 }), // 7 days
      })
      const data = await response.json()
      if (data.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl)
        alert(`Jagamislink kopeeritud: ${data.shareUrl}`)
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingLocationComment || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPendingMarker({ x, y })
  }

  const handleAddComment = async (isLocation = false) => {
    if (!file || !newComment.trim()) return

    try {
      const body: any = { content: newComment }
      if (isLocation && pendingMarker) {
        body.positionX = pendingMarker.x
        body.positionY = pendingMarker.y
      }

      const response = await fetch(`/api/file-vault/files/${file.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setNewComment('')
        setPendingMarker(null)
        setIsAddingLocationComment(false)
        loadComments()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handlePrevFile = () => {
    if (canGoPrev) {
      onFileChange?.(files[currentIndex - 1])
      setZoom(1)
      setRotation(0)
    }
  }

  const handleNextFile = () => {
    if (canGoNext) {
      onFileChange?.(files[currentIndex + 1])
      setZoom(1)
      setRotation(0)
    }
  }

  if (!isOpen || !file) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex">
      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between bg-black/50 text-white">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-medium truncate max-w-md">{file.name}</h3>
              <p className="text-xs text-white/60">
                {formatFileSize(file.sizeBytes)} • {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleToggleFavorite} className="text-white hover:bg-white/10">
              {isFavorited ? <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/10">
              <Download className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-white hover:bg-white/10">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-white hover:bg-white/10 hover:text-red-400">
              <Trash2 className="w-5 h-5" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button
              variant={showComments ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowComments(!showComments)}
              className={showComments ? 'bg-white/20' : 'text-white hover:bg-white/10'}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Navigation arrows */}
          {canGoPrev && (
            <button
              onClick={handlePrevFile}
              className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {canGoNext && (
            <button
              onClick={handleNextFile}
              className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {isLoading ? (
            <Loader2 className="w-12 h-12 animate-spin text-white/50" />
          ) : isImage && previewUrl ? (
            <div
              ref={imageRef}
              className="relative cursor-crosshair"
              onClick={handleImageClick}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
            >
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-[80vh] max-w-full object-contain"
              />
              {/* Location markers */}
              {comments.location.map((comment) => (
                <button
                  key={comment.id}
                  className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    activeCommentId === comment.id
                      ? 'bg-blue-500 text-white scale-125'
                      : 'bg-red-500 text-white hover:scale-110'
                  }`}
                  style={{
                    left: `${comment.positionX}%`,
                    top: `${comment.positionY}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveCommentId(activeCommentId === comment.id ? null : comment.id)
                  }}
                >
                  {comment.markerNumber}
                </button>
              ))}
              {/* Pending marker */}
              {pendingMarker && (
                <div
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-green-500 text-white flex items-center justify-center animate-pulse"
                  style={{
                    left: `${pendingMarker.x}%`,
                    top: `${pendingMarker.y}%`,
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
              )}
            </div>
          ) : isVideo && previewUrl ? (
            <video src={previewUrl} controls className="max-h-[80vh] max-w-full" />
          ) : isAudio && previewUrl ? (
            <div className="bg-white/10 p-8 rounded-xl">
              <Music className="w-24 h-24 text-white/50 mx-auto mb-4" />
              <audio src={previewUrl} controls className="w-80" />
            </div>
          ) : isPdf && previewUrl ? (
            <iframe src={previewUrl} className="w-full h-full bg-white" title={file.name} />
          ) : (
            <div className="text-center text-white/50">
              <File className="w-24 h-24 mx-auto mb-4" />
              <p>Eelvaadet ei saa kuvada</p>
              <Button onClick={handleDownload} className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Laadi alla
              </Button>
            </div>
          )}
        </div>

        {/* Image controls */}
        {isImage && (
          <div className="h-12 flex items-center justify-center gap-2 bg-black/50">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="text-white hover:bg-white/10">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="text-white hover:bg-white/10">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => setRotation((r) => r + 90)} className="text-white hover:bg-white/10">
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="text-white hover:bg-white/10">
              <Maximize2 className="w-4 h-4" />
            </Button>
            {isImage && (
              <>
                <div className="w-px h-6 bg-white/20 mx-2" />
                <Button
                  variant={isAddingLocationComment ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setIsAddingLocationComment(!isAddingLocationComment)
                    setPendingMarker(null)
                  }}
                  className={isAddingLocationComment ? 'bg-green-500' : 'text-white hover:bg-white/10'}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Lisa märkus
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Comments Sidebar */}
      {showComments && (
        <div className="w-96 bg-white flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-slate-900">Kommentaarid</h3>
            <p className="text-sm text-slate-500">
              {comments.location.length + comments.general.length} kommentaari
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Location comments */}
            {comments.location.length > 0 && (
              <div className="p-4 border-b">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">Märkused pildil</h4>
                <div className="space-y-3">
                  {comments.location.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        activeCommentId === comment.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                      onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                          {comment.markerNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-900">{comment.author.full_name}</span>
                            <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General comments */}
            <div className="p-4">
              <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">Üldised kommentaarid</h4>
              <div className="space-y-3">
                {comments.general.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900">{comment.author.full_name}</span>
                      <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.content}</p>
                  </div>
                ))}
                {comments.general.length === 0 && comments.location.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Kommentaare pole veel</p>
                )}
              </div>
            </div>
          </div>

          {/* Add comment */}
          <div className="p-4 border-t">
            {pendingMarker ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <MapPin className="w-4 h-4" />
                  Märkuse asukoht valitud
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Lisa kommentaar sellele kohale..."
                  className="w-full p-2 border rounded-lg resize-none h-20 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingMarker(null)
                      setNewComment('')
                    }}
                    className="flex-1"
                  >
                    Tühista
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddComment(true)}
                    disabled={!newComment.trim()}
                    className="flex-1 bg-[#279989]"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Lisa
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Lisa kommentaar..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment(false)
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => handleAddComment(false)}
                  disabled={!newComment.trim()}
                  className="bg-[#279989]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
