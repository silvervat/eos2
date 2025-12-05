'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Image as ImageIcon } from 'lucide-react'
import {
  type Project,
  type ProjectType,
  type ProjectStatus,
  PROJECT_TYPES,
  PROJECT_STATUSES,
} from '@/hooks/use-projects'

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'thumbnailUrl',
    header: '',
    cell: ({ row }) => {
      const thumbnailUrl = row.getValue('thumbnailUrl') as string | undefined
      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={row.original.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-400" />
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'code',
    header: 'Kood',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-slate-600">
        {row.getValue('code')}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-slate-900"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nimi
        {column.getIsSorted() === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    ),
    cell: ({ row }) => (
      <div>
        <span className="font-medium text-slate-900">{row.getValue('name')}</span>
        {row.original.description && (
          <p className="text-sm text-slate-500 truncate max-w-xs">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tüüp',
    cell: ({ row }) => {
      const type = row.getValue('type') as ProjectType
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          {PROJECT_TYPES[type] || type}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'client',
    header: 'Klient',
    cell: ({ row }) => {
      const client = row.original.client
      return (
        <span className="text-sm text-slate-600">
          {client?.name || '-'}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Staatus',
    cell: ({ row }) => {
      const status = row.getValue('status') as ProjectStatus
      const config = PROJECT_STATUSES[status] || PROJECT_STATUSES.starting
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
          {config.label}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'budget',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-slate-900"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Eelarve
        {column.getIsSorted() === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    ),
    cell: ({ row }) => {
      const budget = row.getValue('budget') as number | undefined
      if (!budget) return <span className="text-slate-400">-</span>
      return (
        <span className="font-medium text-right block">
          {budget.toLocaleString('et-EE')} €
        </span>
      )
    },
  },
  {
    accessorKey: 'city',
    header: 'Linn',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.getValue('city') || '-'}
      </span>
    ),
  },
]

interface ProjectsTableProps {
  data: Project[]
  isLoading?: boolean
  onRowClick?: (project: Project) => void
}

export function ProjectsTable({ data, isLoading, onRowClick }: ProjectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-slate-600">Laadin projekte...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi projekte..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={(columnFilters.find(f => f.id === 'type')?.value as string[])?.join(',') || ''}
            onChange={(e) => {
              const value = e.target.value
              setColumnFilters(prev => {
                const other = prev.filter(f => f.id !== 'type')
                if (!value) return other
                return [...other, { id: 'type', value: value.split(',') }]
              })
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Kõik tüübid</option>
            {Object.entries(PROJECT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={(columnFilters.find(f => f.id === 'status')?.value as string[])?.join(',') || ''}
            onChange={(e) => {
              const value = e.target.value
              setColumnFilters(prev => {
                const other = prev.filter(f => f.id !== 'status')
                if (!value) return other
                return [...other, { id: 'status', value: value.split(',') }]
              })
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Kõik staatused</option>
            {Object.entries(PROJECT_STATUSES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
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
                    className="text-left px-6 py-3 text-sm font-semibold text-slate-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  Projekte ei leitud
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Näitan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            -{Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            / {table.getFilteredRowModel().rows.length} projektist
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Eelmine
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Järgmine
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
