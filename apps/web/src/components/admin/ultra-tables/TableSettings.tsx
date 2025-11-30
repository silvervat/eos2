'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface TableSettingsProps {
  table: any
  onUpdate: () => void
}

const COLORS = [
  '#3B82F6', // Blue
  '#279989', // Rivest Green
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
]

const ICONS = ['📊', '📁', '📋', '🎯', '🚀', '💼', '🏗️', '⚙️', '👥', '📈', '📝', '🔧']

export function TableSettings({ table, onUpdate }: TableSettingsProps) {
  const [name, setName] = useState(table.name)
  const [description, setDescription] = useState(table.description || '')
  const [color, setColor] = useState(table.color || '#3B82F6')
  const [icon, setIcon] = useState(table.icon || '📊')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/ultra-tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, icon }),
      })

      if (response.ok) {
        onUpdate()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-slate-900">Põhiandmed</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tabeli nimi
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tabeli nimi"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Kirjeldus
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Valikuline kirjeldus..."
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Appearance Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-slate-900">Välimus</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ikoon
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all ${
                  icon === i
                    ? 'bg-[#279989]/10 ring-2 ring-[#279989]'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Värv
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-12 h-12 rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Eelvaade</h3>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{name || 'Tabeli nimi'}</h4>
            <p className="text-sm text-slate-600 mt-0.5">
              {description || 'Kirjeldus puudub'}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6e] transition-colors font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Salvestan...' : saved ? 'Salvestatud!' : 'Salvesta'}
        </button>
      </div>
    </div>
  )
}
