'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Paperclip,
  Edit,
  Trash2,
  MoreVertical,
  X,
  User,
  AtSign,
  Image,
  File,
  AlertCircle,
} from 'lucide-react'
import type { QuoteComment, QuoteCommentCreateInput } from '@rivest/types'

interface User {
  id: string
  name: string
  avatar?: string
}

interface CommentsThreadProps {
  quoteId: string
  currentUserId: string
  currentUserName: string
}

export default function CommentsThread({
  quoteId,
  currentUserId,
  currentUserName,
}: CommentsThreadProps) {
  const [comments, setComments] = useState<QuoteComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      setError('Kommentaaride laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }, [quoteId])

  // Fetch available users for mentions
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setAvailableUsers(data.users || [])
      }
    } catch {
      // Non-critical, ignore
    }
  }, [])

  useEffect(() => {
    fetchComments()
    fetchUsers()
  }, [fetchComments, fetchUsers])

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Handle @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setNewComment(text)

    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex >= 0) {
      const afterAt = text.slice(lastAtIndex + 1)
      const spaceIndex = afterAt.indexOf(' ')
      if (spaceIndex === -1) {
        setMentionSearch(afterAt.toLowerCase())
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Insert mention
  const insertMention = (user: User) => {
    const lastAtIndex = newComment.lastIndexOf('@')
    const beforeAt = newComment.slice(0, lastAtIndex)
    setNewComment(`${beforeAt}@${user.name} `)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  // Extract mentions from text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.matchAll(mentionRegex)
    const names = Array.from(matches, (m) => m[1])
    return availableUsers.filter((u) => names.includes(u.name)).map((u) => u.id)
  }

  // Send comment
  const handleSend = async () => {
    if (!newComment.trim()) return

    setIsSending(true)
    setError(null)

    try {
      const mentions = extractMentions(newComment)

      const res = await fetch(`/api/quotes/${quoteId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newComment.trim(),
          mentions,
        }),
      })

      if (!res.ok) {
        throw new Error('Kommentaari saatmine ebaõnnestus')
      }

      setNewComment('')
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kommentaari saatmine ebaõnnestus')
    } finally {
      setIsSending(false)
    }
  }

  // Edit comment
  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return

    try {
      const res = await fetch(`/api/quotes/${quoteId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editText.trim(),
          mentions: extractMentions(editText),
        }),
      })

      if (!res.ok) {
        throw new Error('Kommentaari muutmine ebaõnnestus')
      }

      setEditingComment(null)
      setEditText('')
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kommentaari muutmine ebaõnnestus')
    }
  }

  // Delete comment
  const handleDelete = async (commentId: string) => {
    if (!confirm('Kas olete kindel, et soovite selle kommentaari kustutada?')) return

    try {
      const res = await fetch(`/api/quotes/${quoteId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Kommentaari kustutamine ebaõnnestus')
      }

      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kommentaari kustutamine ebaõnnestus')
    }
  }

  // Start editing
  const startEditing = (comment: QuoteComment) => {
    setEditingComment(comment.id)
    setEditText(comment.text)
    setActiveMenu(null)
  }

  // Format timestamp
  const formatTimestamp = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just nüüd'
    if (minutes < 60) return `${minutes} min tagasi`
    if (hours < 24) return `${hours} h tagasi`
    if (days < 7) return `${days} p tagasi`
    return d.toLocaleDateString('et-EE')
  }

  // Highlight mentions in text
  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-[#279989] font-medium hover:underline cursor-pointer">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(mentionSearch) && u.id !== currentUserId
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200">
        <MessageSquare className="w-5 h-5 text-slate-600" />
        <h3 className="font-medium text-slate-900">Arutelu</h3>
        <span className="text-sm text-slate-500">({comments.length})</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#279989]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>Kommentaare pole veel.</p>
            <p className="text-sm">Alustage arutelu!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {comment.userAvatar ? (
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm">{comment.userName}</span>
                  <span className="text-xs text-slate-400">{formatTimestamp(comment.createdAt)}</span>
                  {comment.isEdited && (
                    <span className="text-xs text-slate-400">(muudetud)</span>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(comment.id)}
                        className="px-3 py-1 text-xs font-medium text-white rounded-lg"
                        style={{ backgroundColor: '#279989' }}
                      >
                        Salvesta
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null)
                          setEditText('')
                        }}
                        className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Tühista
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">
                    {renderText(comment.text)}
                  </p>
                )}

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 hover:bg-slate-200"
                      >
                        {att.mimeType?.startsWith('image/') ? (
                          <Image className="w-3.5 h-3.5" />
                        ) : (
                          <File className="w-3.5 h-3.5" />
                        )}
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {comment.userId === currentUserId && editingComment !== comment.id && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenu === comment.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => startEditing(comment)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="w-4 h-4" />
                        Muuda
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Kustuta
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Kirjuta kommentaar... (@kasutajanimi mainimiseks)"
            className="w-full px-3 py-2 pr-20 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
            rows={2}
          />

          {/* Mentions dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  {user.name}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              title="Lisa fail"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !newComment.trim()}
              className="p-1.5 text-white rounded disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#279989' }}
              title="Saada"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Vajuta Enter saatmiseks, Shift+Enter uue rea lisamiseks
        </p>
      </div>
    </div>
  )
}
