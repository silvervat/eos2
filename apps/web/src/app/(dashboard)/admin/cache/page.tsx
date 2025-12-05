'use client'

import { useState } from 'react'
import {
  Trash2,
  RefreshCw,
  HardDrive,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface CacheItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  action: () => Promise<void>
}

export default function CacheManagementPage() {
  const [clearing, setClearing] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearLocalStorage = async () => {
    const workSession = localStorage.getItem('workSession')
    const sidebarState = localStorage.getItem('sidebar-collapsed')

    localStorage.clear()

    // Restore critical items
    if (workSession) localStorage.setItem('workSession', workSession)
    if (sidebarState) localStorage.setItem('sidebar-collapsed', sidebarState)
  }

  const clearSessionStorage = async () => {
    sessionStorage.clear()
  }

  const clearReactQueryCache = async () => {
    // Dispatch custom event that QueryClient listens to
    window.dispatchEvent(new CustomEvent('clear-query-cache'))
  }

  const clearServiceWorkerCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  const clearIndexedDB = async () => {
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!)
              request.onsuccess = () => resolve()
              request.onerror = () => reject(request.error)
            })
          }
          return Promise.resolve()
        })
      )
    }
  }

  const clearAll = async () => {
    await clearLocalStorage()
    await clearSessionStorage()
    await clearReactQueryCache()
    await clearServiceWorkerCache()
    await clearIndexedDB()
  }

  const cacheItems: CacheItem[] = [
    {
      id: 'localStorage',
      name: 'Local Storage',
      description: 'Salvestatud seaded ja eelistused (v.a. tööaja sessioon)',
      icon: <HardDrive className="w-5 h-5" />,
      action: clearLocalStorage,
    },
    {
      id: 'sessionStorage',
      name: 'Session Storage',
      description: 'Ajutised sessiooniandmed',
      icon: <Clock className="w-5 h-5" />,
      action: clearSessionStorage,
    },
    {
      id: 'reactQuery',
      name: 'React Query Cache',
      description: 'API päringute vahemälu (andmed laetakse uuesti)',
      icon: <Database className="w-5 h-5" />,
      action: clearReactQueryCache,
    },
    {
      id: 'serviceWorker',
      name: 'Service Worker Cache',
      description: 'Brauseri vahemällu salvestatud failid',
      icon: <RefreshCw className="w-5 h-5" />,
      action: clearServiceWorkerCache,
    },
    {
      id: 'indexedDB',
      name: 'IndexedDB',
      description: 'Brauseri andmebaas (suuremad andmed)',
      icon: <Database className="w-5 h-5" />,
      action: clearIndexedDB,
    },
  ]

  const handleClear = async (item: CacheItem) => {
    setClearing(item.id)
    setSuccess(null)
    setError(null)

    try {
      await item.action()
      setSuccess(`${item.name} edukalt puhastatud!`)
    } catch (err) {
      setError(`Viga ${item.name} puhastamisel: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setClearing(null)
    }
  }

  const handleClearAll = async () => {
    setClearing('all')
    setSuccess(null)
    setError(null)

    try {
      await clearAll()
      setSuccess('Kõik vahemälud edukalt puhastatud!')
    } catch (err) {
      setError(`Viga puhastamisel: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setClearing(null)
    }
  }

  const handleHardRefresh = () => {
    // Force reload from server
    window.location.reload()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vahemälu haldus</h1>
          <p className="text-slate-600 text-sm mt-1">
            Puhasta brauseri vahemälu ja taaskäivita rakendus
          </p>
        </div>
        <button
          onClick={handleHardRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium transition-colors hover:bg-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Taaskäivita
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Clear All Button */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Puhasta kogu vahemälu</h2>
              <p className="text-sm text-slate-500">
                Eemaldab kõik salvestatud andmed ja vahemälu (v.a. autentimine)
              </p>
            </div>
          </div>
          <button
            onClick={handleClearAll}
            disabled={clearing !== null}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {clearing === 'all' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Puhastan...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Puhasta kõik
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Cache Items */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-medium text-slate-700">Vahemälu tüübid</h3>
        </div>
        <div className="divide-y">
          {cacheItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{item.name}</h4>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleClear(item)}
                disabled={clearing !== null}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {clearing === item.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Puhastan...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Puhasta
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2">Millal vahemälu puhastada?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Kui rakendus käitub ootamatult või on aeglane</li>
          <li>• Pärast suuremat uuendust süsteemis</li>
          <li>• Kui andmed ei uuene korrektselt</li>
          <li>• Testimise ja silumise ajal</li>
        </ul>
      </div>
    </div>
  )
}
