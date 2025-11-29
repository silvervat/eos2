'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  Users,
  Calendar,
  X,
} from 'lucide-react'

export interface Notification {
  id: string
  type: 'project' | 'invoice' | 'document' | 'comment' | 'alert' | 'employee' | 'deadline'
  title: string
  message: string
  time: string
  isRead: boolean
  link?: string
}

// Mock notifications - will be replaced with real data from Supabase
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'project',
    title: 'Projekt uuendatud',
    message: 'Tallinna objekt - staatus muudetud aktiiveks',
    time: '5 min tagasi',
    isRead: false,
    link: '/projects/1',
  },
  {
    id: '2',
    type: 'comment',
    title: 'Uus kommentaar',
    message: 'Mari Mets kommenteeris dokumenti "Leping #123"',
    time: '15 min tagasi',
    isRead: false,
    link: '/documents/123',
  },
  {
    id: '3',
    type: 'invoice',
    title: 'Arve tähtaeg läheneb',
    message: 'Arve #1234 tähtaeg on 2 päeva pärast',
    time: '1 tund tagasi',
    isRead: false,
    link: '/invoices/1234',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Ohutushoiatus',
    message: 'Uus ohutusraport vajab ülevaatamist',
    time: '2 tundi tagasi',
    isRead: true,
    link: '/admin/safety',
  },
  {
    id: '5',
    type: 'employee',
    title: 'Uus töötaja',
    message: 'Jaan Tamm lisati meeskonda',
    time: '3 tundi tagasi',
    isRead: true,
    link: '/employees',
  },
  {
    id: '6',
    type: 'deadline',
    title: 'Tähtaeg homme',
    message: 'Pärnu objekti 2. etapp - tähtaeg homme',
    time: '5 tundi tagasi',
    isRead: true,
    link: '/projects/2',
  },
]

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  project: <FileText className="w-4 h-4" />,
  invoice: <FileText className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  employee: <Users className="w-4 h-4" />,
  deadline: <Calendar className="w-4 h-4" />,
}

const typeColors: Record<Notification['type'], string> = {
  project: '#279989',
  invoice: '#eab308',
  document: '#3b82f6',
  comment: '#8b5cf6',
  alert: '#ef4444',
  employee: '#22c55e',
  deadline: '#f97316',
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Teavitused</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: '#279989' }}
              >
                <CheckCheck className="w-3 h-3" />
                Märgi kõik loetuks
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Teavitusi pole</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`relative group ${
                      notification.isRead ? 'bg-white' : 'bg-blue-50/50'
                    }`}
                  >
                    <Link
                      href={notification.link || '#'}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsOpen(false)
                      }}
                      className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${typeColors[notification.type]}15`,
                            color: typeColors[notification.type],
                          }}
                        >
                          {typeIcons[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                            style={{ backgroundColor: '#279989' }}
                          />
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="absolute top-3 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-opacity"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium hover:underline"
              style={{ color: '#279989' }}
            >
              Vaata kõiki teavitusi
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
