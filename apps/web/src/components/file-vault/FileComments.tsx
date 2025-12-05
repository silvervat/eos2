'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input } from '@rivest/ui'
import {
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  User,
} from 'lucide-react'

interface CommentUser {
  full_name: string
  avatar_url: string | null
}

interface Comment {
  id: string
  content: string
  parent_id: string | null
  mentions: string[]
  is_edited: boolean
  edited_at: string | null
  created_at: string
  created_by: string
  user: CommentUser
  replies?: Comment[]
}

interface FileCommentsProps {
  fileId: string
  fileName: string
}

export function FileComments({ fileId, fileName }: FileCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/file-vault/comments?fileId=${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Submit new comment
  const handleSubmit = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/file-vault/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          content: content.trim(),
          parentId: parentId || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (parentId) {
          // Add reply to parent comment
          setComments(prev =>
            prev.map(c =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), data.comment] }
                : c
            )
          )
          setReplyContent('')
          setReplyingTo(null)
        } else {
          // Add new root comment
          setComments(prev => [...prev, data.comment])
          setNewComment('')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Tundmatu viga' }))
        console.error('Comment submission failed:', response.status, errorData)
        alert(errorData.error || 'Kommentaari lisamine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Võrguühenduse viga. Palun proovi uuesti.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('et-EE')
  }

  // Render single comment
  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-8 mt-2' : ''}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name}
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
            <span className="font-medium text-sm text-slate-900">
              {comment.user.full_name}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-slate-400">(muudetud)</span>
            )}
          </div>

          <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          {!isReply && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#279989]"
              >
                <Reply className="w-3.5 h-3.5" />
                Vasta
              </button>
            </div>
          )}

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Kirjuta vastus..."
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(comment.id)
                  }
                }}
              />
              <Button
                onClick={() => handleSubmit(comment.id)}
                disabled={!replyContent.trim() || isSubmitting}
                className="h-8 px-3 bg-[#279989] hover:bg-[#1e7a6d]"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-slate-100 pl-2 mt-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200">
        <MessageSquare className="w-5 h-5 text-[#279989]" />
        <h3 className="font-medium text-slate-900">Kommentaarid</h3>
        <span className="text-sm text-slate-500">({comments.length})</span>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#279989]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Kommentaare pole veel</p>
            <p className="text-sm">Ole esimene, kes kommenteerib!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      {/* New comment input */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Lisa kommentaar..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={!newComment.trim() || isSubmitting}
            className="bg-[#279989] hover:bg-[#1e7a6d]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FileComments
