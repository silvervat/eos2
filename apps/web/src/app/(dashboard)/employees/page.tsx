'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { Plus, Search, ChevronUp, ChevronDown, Mail, Phone, MoreVertical } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  status: 'active' | 'inactive' | 'on_leave'
  startDate: string
  avatar?: string
}

// Mock data
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Mari Maasikas',
    email: 'mari@rivest.ee',
    phone: '+372 5123 4567',
    position: 'Projektijuht',
    department: 'Juhtimine',
    status: 'active',
    startDate: '2022-03-15',
  },
  {
    id: '2',
    name: 'Jaan Tamm',
    email: 'jaan@rivest.ee',
    phone: '+372 5234 5678',
    position: 'Ehitusinsener',
    department: 'Ehitus',
    status: 'active',
    startDate: '2021-08-01',
  },
  {
    id: '3',
    name: 'Liisa Lepp',
    email: 'liisa@rivest.ee',
    phone: '+372 5345 6789',
    position: 'Raamatupidaja',
    department: 'Finants',
    status: 'active',
    startDate: '2020-01-10',
  },
  {
    id: '4',
    name: 'Peeter Paju',
    email: 'peeter@rivest.ee',
    phone: '+372 5456 7890',
    position: 'Ehitaja',
    department: 'Ehitus',
    status: 'on_leave',
    startDate: '2023-05-20',
  },
  {
    id: '5',
    name: 'Kati Kask',
    email: 'kati@rivest.ee',
    phone: '+372 5567 8901',
    position: 'Müügijuht',
    department: 'Müük',
    status: 'active',
    startDate: '2022-11-01',
  },
  {
    id: '6',
    name: 'Andres Allik',
    email: 'andres@rivest.ee',
    phone: '+372 5678 9012',
    position: 'Objektijuht',
    department: 'Ehitus',
    status: 'active',
    startDate: '2021-02-15',
  },
  {
    id: '7',
    name: 'Marika Mets',
    email: 'marika@rivest.ee',
    phone: '+372 5789 0123',
    position: 'Personalijuht',
    department: 'HR',
    status: 'inactive',
    startDate: '2019-06-01',
  },
]

const columnHelper = createColumnHelper<Employee>()

const statusColors: Record<Employee['status'], { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktiivne' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Mitteaktiivne' },
  on_leave: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Puhkusel' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function EmployeesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Töötaja',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
              style={{ backgroundColor: '#279989' }}
            >
              {getInitials(info.getValue())}
            </div>
            <div>
              <div className="font-medium text-slate-900">{info.getValue()}</div>
              <div className="text-sm text-slate-500">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('position', {
        header: 'Ametikoht',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('department', {
        header: 'Osakond',
        cell: (info) => (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Telefon',
        cell: (info) => (
          <a href={`tel:${info.getValue()}`} className="text-slate-600 hover:text-slate-900">
            {info.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Staatus',
        cell: (info) => {
          const status = info.getValue()
          const colors = statusColors[status]
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {colors.label}
            </span>
          )
        },
      }),
      columnHelper.accessor('startDate', {
        header: 'Alguskuupäev',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('et-EE'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex gap-1">
            <a
              href={`mailto:${info.row.original.email}`}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Saada e-kiri"
            >
              <Mail className="h-4 w-4 text-slate-500" />
            </a>
            <a
              href={`tel:${info.row.original.phone}`}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Helista"
            >
              <Phone className="h-4 w-4 text-slate-500" />
            </a>
            <button
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Rohkem"
            >
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: mockEmployees,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Stats
  const stats = useMemo(() => {
    return {
      total: mockEmployees.length,
      active: mockEmployees.filter((e) => e.status === 'active').length,
      onLeave: mockEmployees.filter((e) => e.status === 'on_leave').length,
      departments: [...new Set(mockEmployees.map((e) => e.department))].length,
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Töötajad</h1>
          <p className="text-slate-600 text-sm mt-1">Halda töötajaid ja nende andmeid</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa töötaja
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Kokku töötajaid</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Aktiivseid</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Puhkusel</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.onLeave}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Osakondi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.departments}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi töötajaid..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-4 w-4" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-4 w-4" />}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Kuvatakse {table.getFilteredRowModel().rows.length} töötajat
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Eelmine
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Järgmine
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
