'use client'

/**
 * Personnel - Töötajate nimekiri
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { UserPlus, Search, Filter, ArrowUpDown, ChevronDown, Mail, Phone, User, MoreVertical, Edit, Trash2, Key } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  startDate: string
  status: 'active' | 'inactive' | 'vacation'
  hasUser: boolean
  userId?: string
  group?: string
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Mari Maasikas', email: 'mari@rivest.ee', phone: '+372 5551 1234', position: 'Projektijuht', department: 'Projektid', startDate: '2022-03-15', status: 'active', hasUser: true, userId: 'u1', group: 'Projektijuhid' },
  { id: '2', name: 'Jaan Tamm', email: 'jaan@rivest.ee', phone: '+372 5552 2345', position: 'Vanem monteerija', department: 'Montaaž', startDate: '2021-06-01', status: 'active', hasUser: true, userId: 'u2', group: 'Monteerijad' },
  { id: '3', name: 'Kati Kask', email: 'kati@rivest.ee', phone: '+372 5553 3456', position: 'Müügijuht', department: 'Müük', startDate: '2023-01-10', status: 'active', hasUser: true, userId: 'u3', group: 'Müügimeeskond' },
  { id: '4', name: 'Peeter Pärn', email: 'peeter@rivest.ee', phone: '+372 5554 4567', position: 'Tehnik', department: 'PTV', startDate: '2023-06-20', status: 'active', hasUser: false, group: 'Monteerijad' },
  { id: '5', name: 'Liis Lepp', email: 'liis@rivest.ee', phone: '+372 5555 5678', position: 'Raamatupidaja', department: 'Admin', startDate: '2020-09-01', status: 'active', hasUser: true, userId: 'u5', group: 'Administraatorid' },
  { id: '6', name: 'Toomas Kuusk', email: 'toomas@rivest.ee', phone: '+372 5556 6789', position: 'Monteerija', department: 'Montaaž', startDate: '2022-11-15', status: 'vacation', hasUser: true, userId: 'u6', group: 'Monteerijad' },
  { id: '7', name: 'Anna Saar', email: 'anna@rivest.ee', phone: '+372 5557 7890', position: 'Assistent', department: 'Admin', startDate: '2024-02-01', status: 'active', hasUser: true, userId: 'u7', group: 'Vaatajad' },
  { id: '8', name: 'Marten Mets', email: 'marten@rivest.ee', phone: '+372 5558 8901', position: 'Laojuhataja', department: 'Ladu', startDate: '2021-04-10', status: 'active', hasUser: true, userId: 'u8', group: 'Projektijuhid' },
  { id: '9', name: 'Kersti Kivi', email: 'kersti@rivest.ee', phone: '+372 5559 9012', position: 'Müügiesindaja', department: 'Müük', startDate: '2023-09-01', status: 'inactive', hasUser: false },
  { id: '10', name: 'Raivo Rand', email: 'raivo@rivest.ee', phone: '+372 5550 0123', position: 'Tehnik', department: 'PTV', startDate: '2024-01-15', status: 'active', hasUser: true, userId: 'u10', group: 'Monteerijad' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  inactive: { label: 'Mitteaktiivne', color: 'text-gray-700', bg: 'bg-gray-100' },
  vacation: { label: 'Puhkusel', color: 'text-blue-700', bg: 'bg-blue-100' },
}

type SortField = 'name' | 'department' | 'position' | 'startDate' | 'status'
type SortDirection = 'asc' | 'desc'

export default function EmployeesPage() {
  const [employees] = useState<Employee[]>(mockEmployees)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [groupBy, setGroupBy] = useState<string>('none')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))]

  // Filter and sort
  const filteredEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      const matchesSearch = search === '' ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.position.toLowerCase().includes(search.toLowerCase())
      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (sortDirection === 'desc') [aVal, bVal] = [bVal, aVal]
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    })

    return result
  }, [employees, search, departmentFilter, statusFilter, sortField, sortDirection])

  // Group employees
  const groupedEmployees = useMemo(() => {
    if (groupBy === 'none') return { 'all': filteredEmployees }
    const groups: Record<string, Employee[]> = {}
    filteredEmployees.forEach(emp => {
      const key = groupBy === 'department' ? emp.department : (emp.group || 'Grupita')
      if (!groups[key]) groups[key] = []
      groups[key].push(emp)
    })
    return groups
  }, [filteredEmployees, groupBy])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredEmployees.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredEmployees.map(e => e.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Töötajad</h1>
          <p className="text-gray-500 text-sm">{filteredEmployees.length} töötajat</p>
        </div>
        <Link
          href="/personnel/employees/new"
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Lisa töötaja
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi nime, e-posti või ametikoha järgi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            />
          </div>

          {/* Department filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="all">Kõik osakonnad</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="all">Kõik staatused</option>
            <option value="active">Aktiivne</option>
            <option value="inactive">Mitteaktiivne</option>
            <option value="vacation">Puhkusel</option>
          </select>

          {/* Group by */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="none">Grupeeri...</option>
            <option value="department">Osakonna järgi</option>
            <option value="group">Kasutajagrupi järgi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b text-xs">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredEmployees.length && filteredEmployees.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-900">
                  Nimi {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('position')} className="flex items-center gap-1 hover:text-gray-900">
                  Ametikoht {sortField === 'position' && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('department')} className="flex items-center gap-1 hover:text-gray-900">
                  Osakond {sortField === 'department' && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="text-left px-3 py-2">Kontakt</th>
              <th className="text-left px-3 py-2">Kasutajagrupp</th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-900">
                  Staatus {sortField === 'status' && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="text-left px-3 py-2">Kasutaja</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {Object.entries(groupedEmployees).map(([groupName, emps]) => (
              <React.Fragment key={groupName}>
                {groupBy !== 'none' && (
                  <tr className="bg-gray-100">
                    <td colSpan={9} className="px-3 py-2 font-medium text-gray-700">
                      {groupName} ({emps.length})
                    </td>
                  </tr>
                )}
                {emps.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{emp.position}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{emp.department}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      <div>{emp.email}</div>
                      <div>{emp.phone}</div>
                    </td>
                    <td className="px-3 py-2">
                      {emp.group ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{emp.group}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[emp.status].bg} ${statusConfig[emp.status].color}`}>
                        {statusConfig[emp.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {emp.hasUser ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1 w-fit">
                          <User className="w-3 h-3" /> Jah
                        </span>
                      ) : (
                        <button className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1 hover:bg-blue-200">
                          <Key className="w-3 h-3" /> Loo
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selection actions */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-4 shadow-lg">
          <span className="text-sm">{selectedRows.size} valitud</span>
          <button className="text-sm hover:text-red-400">Kustuta</button>
          <button className="text-sm hover:text-blue-400">Muuda gruppi</button>
        </div>
      )}
    </div>
  )
}
