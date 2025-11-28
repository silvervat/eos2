'use client'

import { useState } from 'react'
import { User, Building, Bell, Shield, Palette, Globe, Save } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'profile', label: 'Profiil', icon: User },
    { id: 'company', label: 'Ettevõte', icon: Building },
    { id: 'notifications', label: 'Teavitused', icon: Bell },
    { id: 'security', label: 'Turvalisus', icon: Shield },
    { id: 'appearance', label: 'Välimus', icon: Palette },
    { id: 'language', label: 'Keel', icon: Globe },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seaded</h1>
        <p className="text-slate-600 text-sm mt-1">Halda oma konto ja rakenduse seadeid</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Profiili seaded</h2>

                <div className="flex items-center gap-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: '#279989' }}
                  >
                    JK
                  </div>
                  <div>
                    <button className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
                      Muuda pilti
                    </button>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG või GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Eesnimi</label>
                    <input
                      type="text"
                      defaultValue="Jaan"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Perekonnanimi</label>
                    <input
                      type="text"
                      defaultValue="Kask"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                    <input
                      type="email"
                      defaultValue="jaan@rivest.ee"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      defaultValue="+372 5123 4567"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Ettevõtte seaded</h2>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ettevõtte nimi</label>
                    <input
                      type="text"
                      defaultValue="Rivest OÜ"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registrikood</label>
                    <input
                      type="text"
                      defaultValue="12345678"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">KMKR number</label>
                    <input
                      type="text"
                      defaultValue="EE123456789"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Aadress</label>
                    <textarea
                      rows={2}
                      defaultValue="Ehitajate tee 1, 10117 Tallinn"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Teavituste seaded</h2>

                <div className="space-y-4">
                  {[
                    { label: 'E-posti teavitused', description: 'Saa teavitusi e-postile' },
                    { label: 'SMS teavitused', description: 'Saa teavitusi telefonile' },
                    { label: 'Projekti uuendused', description: 'Teavitused projektide muudatustest' },
                    { label: 'Arve meeldetuletused', description: 'Meeldetuletused tähtaja lähenemisest' },
                    { label: 'Turundussõnumid', description: 'Uudised ja pakkumised' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-sm text-slate-500">{item.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#279989]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Turvalisuse seaded</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Praegune parool</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Uus parool</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kinnita uus parool</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-3">Kaheastmeline autentimine</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Lisa täiendav turvakiht oma kontole</p>
                    <button className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
                      Lülita sisse
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Välimuse seaded</h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Teema</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'light', label: 'Hele' },
                      { id: 'dark', label: 'Tume' },
                      { id: 'system', label: 'Süsteemne' },
                    ].map((theme) => (
                      <label
                        key={theme.id}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={theme.id}
                          defaultChecked={theme.id === 'light'}
                          className="text-[#279989]"
                        />
                        <span>{theme.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Peamine värv</label>
                  <div className="flex gap-3">
                    {['#279989', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-white ring-2 ring-slate-200 hover:ring-slate-400 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Keele seaded</h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rakenduse keel</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="et">Eesti keel</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ajavöönd</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="Europe/Tallinn">Tallinn (EET, UTC+2)</option>
                    <option value="Europe/London">London (GMT, UTC+0)</option>
                    <option value="Europe/Berlin">Berlin (CET, UTC+1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kuupäeva formaat</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="DD.MM.YYYY">28.11.2024</option>
                    <option value="MM/DD/YYYY">11/28/2024</option>
                    <option value="YYYY-MM-DD">2024-11-28</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#279989' }}
              >
                <Save className="h-4 w-4" />
                {saved ? 'Salvestatud!' : 'Salvesta muudatused'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
