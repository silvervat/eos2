'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  Users,
  Calendar,
  Trash2,
  Filter,
  Settings,
  ChevronDown,
} from 'lucide-react'

interface Notification {
  id: string
  type: 'project' | 'invoice' | 'document' | 'comment' | 'alert' | 'employee' | 'deadline'
  title: string
  message: string
  time: string
  date: string
  isRead: boolean
  link?: string
}

// Mock notifications with dates
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'project',
    title: 'Projekt uuendatud',
    message: 'Tallinna objekt - staatus muudetud aktiiveks. Projektijuht: Mari Mets.',
    time: '5 min tagasi',
    date: '2024-03-15',
    isRead: false,
    link: '/projects/1',
  },
  {
    id: '2',
    type: 'comment',
    title: 'Uus kommentaar',
    message: 'Mari Mets kommenteeris dokumenti "Leping #123": "Palun vaadake üle punkt 4.2"',
    time: '15 min tagasi',
    date: '2024-03-15',
    isRead: false,
    link: '/documents/123',
  },
  {
    id: '3',
    type: 'invoice',
    title: 'Arve tähtaeg läheneb',
    message: 'Arve #1234 (Alltöö OÜ) tähtaeg on 2 päeva pärast. Summa: 5 600 EUR',
    time: '1 tund tagasi',
    date: '2024-03-15',
    isRead: false,
    link: '/invoices/1234',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Ohutushoiatus',
    message: 'Uus ohutusraport vajab ülevaatamist. Tõsidus: keskmine. Asukoht: Pärnu objekt.',
    time: '2 tundi tagasi',
    date: '2024-03-15',
    isRead: false,
    link: '/admin/safety',
  },
  {
    id: '5',
    type: 'employee',
    title: 'Uus töötaja',
    message: 'Jaan Tamm lisati meeskonda. Amet: Ehitusinsener. Osakond: Ehitus.',
    time: '3 tundi tagasi',
    date: '2024-03-15',
    isRead: true,
    link: '/employees',
  },
  {
    id: '6',
    type: 'deadline',
    title: 'Tähtaeg homme',
    message: 'Pärnu objekti 2. etapp - tähtaeg homme. Valmidus: 85%.',
    time: '5 tundi tagasi',
    date: '2024-03-15',
    isRead: true,
    link: '/projects/2',
  },
  {
    id: '7',
    type: 'document',
    title: 'Dokument jagatud',
    message: 'Peeter Kask jagas teiega dokumenti "Ehitusplaan v2.pdf"',
    time: 'Eile, 16:30',
    date: '2024-03-14',
    isRead: true,
    link: '/documents/456',
  },
  {
    id: '8',
    type: 'project',
    title: 'Projekt lõpetatud',
    message: 'Tartu objekt märgiti lõpetatuks. Projekti kestus: 8 kuud.',
    time: 'Eile, 14:00',
    date: '2024-03-14',
    isRead: true,
    link: '/projects/3',
  },
  {
    id: '9',
    type: 'invoice',
    title: 'Arve tasutud',
    message: 'Arve #1230 (Ehitus AS) on tasutud. Summa: 12 400 EUR.',
    time: '2 päeva tagasi',
    date: '2024-03-13',
    isRead: true,
    link: '/invoices/1230',
  },
  {
    id: '10',
    type: 'comment',
    title: 'Mainiti sind',
    message: 'Liis Tamm mainis sind kommentaaris: "@kasutaja palun vaata üle"',
    time: '3 päeva tagasi',
    date: '2024-03-12',
    isRead: true,
    link: '/documents/789',
  },
]

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  project: <FileText className="w-5 h-5" />,
  invoice: <FileText className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
  comment: <MessageSquare className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  employee: <Users className="w-5 h-5" />,
  deadline: <Calendar className="w-5 h-5" />,
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

const typeLabels: Record<Notification['type'], string> = {
  project: 'Projektid',
  invoice: 'Arved',
  document: 'Dokumendid',
  comment: 'Kommentaarid',
  alert: 'Hoiatused',
  employee: 'Töötajad',
  deadline: 'Tähtajad',
}

type FilterType = 'all' | Notification['type']

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === filter)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const deleteAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead))
  }

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = notification.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  const formatDateHeader = (date: string) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (date === today) return 'Täna'
    if (date === yesterday) return 'Eile'

    return new Date(date).toLocaleDateString('et-EE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teavitused</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} lugemata teavitust`
              : 'Kõik teavitused on loetud'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings?tab=notifications"
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Seaded
          </Link>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {filter === 'all' ? 'Kõik tüübid' : typeLabels[filter]}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                <button
                  onClick={() => {
                    setFilter('all')
                    setShowFilterMenu(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                    filter === 'all' ? 'text-primary font-medium' : 'text-slate-700'
                  }`}
                >
                  Kõik tüübid
                </button>
                {(Object.keys(typeLabels) as Notification['type'][]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilter(type)
                      setShowFilterMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                      filter === type ? 'font-medium' : 'text-slate-700'
                    }`}
                    style={{ color: filter === type ? typeColors[type] : undefined }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: typeColors[type] }}
                    />
                    {typeLabels[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
              style={{ color: '#279989' }}
            >
              <CheckCheck className="w-4 h-4" />
              Märgi kõik loetuks
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              onClick={deleteAllRead}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Kustuta loetud
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <BellOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Teavitusi pole</h3>
          <p className="text-slate-500">
            {filter === 'all'
              ? 'Sul pole ühtegi teavitust.'
              : `Sul pole ühtegi "${typeLabels[filter]}" teavitust.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-slate-500 mb-3">
                {formatDateHeader(date)}
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                {dateNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative group ${
                      notification.isRead ? '' : 'bg-blue-50/30'
                    }`}
                  >
                    <Link
                      href={notification.link || '#'}
                      onClick={() => markAsRead(notification.id)}
                      className="block p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${typeColors[notification.type]}15`,
                            color: typeColors[notification.type],
                          }}
                        >
                          {typeIcons[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.isRead && (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: '#279989' }}
                                />
                              )}
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${typeColors[notification.type]}15`,
                                color: typeColors[notification.type],
                              }}
                            >
                              {typeLabels[notification.type]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            markAsRead(notification.id)
                          }}
                          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Märgi loetuks"
                        >
                          <Check className="w-4 h-4 text-slate-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          deleteNotification(notification.id)
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                        title="Kustuta"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
