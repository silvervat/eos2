'use client'

/**
 * Personnel - Personali ülevaade
 */

import React from 'react'
import Link from 'next/link'
import { Users, Building2, UserPlus, TrendingUp } from 'lucide-react'

export default function PersonnelPage() {
  // Mock statistika
  const stats = {
    totalEmployees: 24,
    activeUsers: 18,
    groups: 5,
    newThisMonth: 3,
  }

  const recentEmployees = [
    { id: '1', name: 'Mari Maasikas', position: 'Projektijuht', department: 'Projektid', hasUser: true },
    { id: '2', name: 'Jaan Tamm', position: 'Monteerija', department: 'Montaaž', hasUser: true },
    { id: '3', name: 'Kati Kask', position: 'Müügijuht', department: 'Müük', hasUser: true },
    { id: '4', name: 'Peeter Pärn', position: 'Tehnik', department: 'PTV', hasUser: false },
    { id: '5', name: 'Liis Lepp', position: 'Raamatupidaja', department: 'Admin', hasUser: true },
  ]

  const groups = [
    { name: 'Administraatorid', members: 3, permissions: 'Kõik õigused' },
    { name: 'Projektijuhid', members: 5, permissions: 'Projektid, Arved, Dokumendid' },
    { name: 'Monteerijad', members: 8, permissions: 'Montaaž projektid, Ladu' },
    { name: 'Müügimeeskond', members: 4, permissions: 'Müük, Kliendid, Arved' },
    { name: 'Vaatajad', members: 4, permissions: 'Ainult vaatamine' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personaal</h1>
          <p className="text-gray-500">Töötajate ja kasutajagruppide haldus</p>
        </div>
        <Link
          href="/personnel/employees/new"
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Lisa töötaja
        </Link>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Töötajaid kokku</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kasutajakontoga</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kasutajagrupid</p>
              <p className="text-3xl font-bold text-purple-600">{stats.groups}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Uued sel kuul</p>
              <p className="text-3xl font-bold text-orange-600">{stats.newThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Kaks veergu */}
      <div className="grid grid-cols-2 gap-6">
        {/* Viimased töötajad */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Töötajad</h2>
            <Link href="/personnel/employees" className="text-sm text-[#279989] hover:underline">
              Vaata kõiki →
            </Link>
          </div>
          <div className="divide-y">
            {recentEmployees.map((emp) => (
              <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-medium text-gray-600">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.position} • {emp.department}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  emp.hasUser ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {emp.hasUser ? 'Kasutaja olemas' : 'Kasutajata'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kasutajagrupid */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Kasutajagrupid</h2>
            <Link href="/personnel/groups" className="text-sm text-[#279989] hover:underline">
              Halda gruppe →
            </Link>
          </div>
          <div className="divide-y">
            {groups.map((group) => (
              <div key={group.name} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-800">{group.name}</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {group.members} liiget
                  </span>
                </div>
                <p className="text-sm text-gray-500">{group.permissions}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>💡 Vihje:</strong> Töötajad, kellel on kasutajakonto, saavad portaali sisse logida.
          Kasutajagrupid määravad, milliseid mooduleid ja funktsioone töötaja näeb.
        </p>
      </div>
    </div>
  )
}
