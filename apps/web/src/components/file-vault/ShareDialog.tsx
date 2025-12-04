'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Input } from '@rivest/ui'
import {
  X,
  Link2,
  Copy,
  Check,
  Lock,
  Calendar,
  Download,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultId: string
  fileId?: string
  folderId?: string
  fileName?: string
}

interface Share {
  id: string
  shortCode: string
  shareUrl: string
  allowDownload: boolean
  allowUpload: boolean
  expiresAt: string | null
  downloadLimit: number | null
  downloadsCount: number
  hasPassword: boolean
  title: string | null
  message: string | null
  createdAt: string
}

export function ShareDialog({
  open,
  onOpenChange,
  vaultId,
  fileId,
  folderId,
  fileName,
}: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // New share form state
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState<string>('')
  const [downloadLimit, setDownloadLimit] = useState<string>('')

  // Load existing shares
  useEffect(() => {
    if (open && vaultId && (fileId || folderId)) {
      loadShares()
    }
  }, [open, vaultId, fileId, folderId])

  const loadShares = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ vaultId })
      if (fileId) params.set('fileId', fileId)
      if (folderId) params.set('folderId', folderId)

      const response = await fetch(`/api/file-vault/shares?${params}`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      console.error('Error loading shares:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createShare = async () => {
    setIsCreating(true)
    try {
      // Calculate expiration date
      let expiresAt = null
      if (expiresIn) {
        const now = new Date()
        const hours = parseInt(expiresIn)
        if (!isNaN(hours)) {
          expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
        }
      }

      const response = await fetch('/api/file-vault/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId,
          fileId: fileId || null,
          folderId: folderId || null,
          password: password || null,
          expiresAt,
          downloadLimit: downloadLimit ? parseInt(downloadLimit) : null,
        }),
      })

      if (response.ok) {
        const newShare = await response.json()
        setShares([newShare, ...shares])
        setShowForm(false)
        setPassword('')
        setExpiresIn('')
        setDownloadLimit('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create share')
      }
    } catch (error) {
      console.error('Error creating share:', error)
      alert('Jagamislingi loomine ebaõnnestus')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteShare = async (shareId: string) => {
    if (!confirm('Kas oled kindel, et soovid jagamislingi kustutada?')) return

    try {
      const response = await fetch(`/api/file-vault/shares/${shareId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShares(shares.filter(s => s.id !== shareId))
      } else {
        alert('Kustutamine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error deleting share:', error)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#279989]/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#279989]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Jaga faili</h2>
              <p className="text-sm text-slate-500 truncate max-w-[200px]">
                {fileName || 'Valitud fail'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto">
          {/* Create new share */}
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full mb-4 bg-[#279989] hover:bg-[#1e7a6d] text-white"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Loo uus jagamislink
            </Button>
          ) : (
            <div className="mb-4 p-4 border border-slate-200 rounded-lg space-y-3">
              <h3 className="font-medium text-slate-900">Uus jagamislink</h3>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Parool (valikuline)
                </label>
                <Input
                  type="password"
                  placeholder="Jäta tühjaks, kui parooli pole vaja"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Aegub (tundides)
                </label>
                <Input
                  type="number"
                  placeholder="nt. 24, 48, 168 (nädal)"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  <Download className="w-3 h-3 inline mr-1" />
                  Allalaadimiste limiit
                </label>
                <Input
                  type="number"
                  placeholder="nt. 10, 100"
                  value={downloadLimit}
                  onChange={(e) => setDownloadLimit(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setPassword('')
                    setExpiresIn('')
                    setDownloadLimit('')
                  }}
                  className="flex-1"
                >
                  Tühista
                </Button>
                <Button
                  onClick={createShare}
                  disabled={isCreating}
                  className="flex-1 bg-[#279989] hover:bg-[#1e7a6d] text-white"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Loo link'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Existing shares */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">
              Olemasolevad lingid ({shares.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Jagamislinke pole veel loodud
              </p>
            ) : (
              shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded truncate">
                          {share.shortCode}
                        </code>
                        {share.hasPassword && (
                          <span title="Parooliga kaitstud">
                            <Lock className="w-3 h-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Loodud: {formatDate(share.createdAt)}
                      </p>
                      {share.expiresAt && (
                        <p className="text-xs text-amber-600">
                          Aegub: {formatDate(share.expiresAt)}
                        </p>
                      )}
                      {share.downloadLimit && (
                        <p className="text-xs text-slate-500">
                          Allalaadimisi: {share.downloadsCount}/{share.downloadLimit}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => copyToClipboard(share.shareUrl, share.id)}
                      >
                        {copied === share.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => window.open(share.shareUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-red-600 hover:text-red-700"
                        onClick={() => deleteShare(share.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Sulge
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ShareDialog
