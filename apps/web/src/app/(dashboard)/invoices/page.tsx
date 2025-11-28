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
  ColumnFiltersState,
} from '@tanstack/react-table'
import { Plus, Search, ChevronUp, ChevronDown, FileText, Download } from 'lucide-react'

interface Invoice {
  id: string
  number: string
  client: string
  project: string
  amount: number
  vat: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  createdAt: string
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'ARV-2024-001',
    client: 'OÜ Ehitaja',
    project: 'Maja ehitus Tallinnas',
    amount: 15000,
    vat: 3000,
    total: 18000,
    status: 'paid',
    dueDate: '2024-11-15',
    createdAt: '2024-10-15',
  },
  {
    id: '2',
    number: 'ARV-2024-002',
    client: 'AS Kinnisvara',
    project: 'Büroohoone renoveerimine',
    amount: 45000,
    vat: 9000,
    total: 54000,
    status: 'sent',
    dueDate: '2024-12-01',
    createdAt: '2024-11-01',
  },
  {
    id: '3',
    number: 'ARV-2024-003',
    client: 'MTÜ Kogukond',
    project: 'Kogukonnakeskuse remont',
    amount: 8500,
    vat: 1700,
    total: 10200,
    status: 'overdue',
    dueDate: '2024-11-10',
    createdAt: '2024-10-10',
  },
  {
    id: '4',
    number: 'ARV-2024-004',
    client: 'OÜ Ehitaja',
    project: 'Garaaži ehitus',
    amount: 12000,
    vat: 2400,
    total: 14400,
    status: 'draft',
    dueDate: '2024-12-15',
    createdAt: '2024-11-20',
  },
  {
    id: '5',
    number: 'ARV-2024-005',
    client: 'Eraisik Kask',
    project: 'Terrassi ehitus',
    amount: 5500,
    vat: 1100,
    total: 6600,
    status: 'paid',
    dueDate: '2024-11-20',
    createdAt: '2024-10-20',
  },
]

const columnHelper = createColumnHelper<Invoice>()

const statusColors: Record<Invoice['status'], { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Mustand' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Saadetud' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Makstud' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Tähtaja ületanud' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Tühistatud' },
}

export default function InvoicesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('number', {
        header: 'Arve nr',
        cell: (info) => (
          <span className="font-mono font-medium text-slate-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('client', {
        header: 'Klient',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('project', {
        header: 'Projekt',
        cell: (info) => (
          <span className="text-slate-600 truncate max-w-[200px] block">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('total', {
        header: 'Summa',
        cell: (info) => (
          <span className="font-semibold text-slate-900">
            {info.getValue().toLocaleString('et-EE')} €
          </span>
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
      columnHelper.accessor('dueDate', {
        header: 'Tähtaeg',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('et-EE'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex gap-1">
            <button
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Vaata"
            >
              <FileText className="h-4 w-4 text-slate-500" />
            </button>
            <button
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Lae alla PDF"
            >
              <Download className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: mockInvoices,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Calculate totals
  const totals = useMemo(() => {
    return mockInvoices.reduce(
      (acc, inv) => {
        acc.total += inv.total
        if (inv.status === 'paid') acc.paid += inv.total
        if (inv.status === 'sent') acc.pending += inv.total
        if (inv.status === 'overdue') acc.overdue += inv.total
        return acc
      },
      { total: 0, paid: 0, pending: 0, overdue: 0 }
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arved</h1>
          <p className="text-slate-600 text-sm mt-1">Halda arveid ja jälgi makseid</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Uus arve
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Kokku</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {totals.total.toLocaleString('et-EE')} €
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Makstud</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {totals.paid.toLocaleString('et-EE')} €
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Ootel</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {totals.pending.toLocaleString('et-EE')} €
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Tähtaja ületanud</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {totals.overdue.toLocaleString('et-EE')} €
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi arveid..."
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
            Kuvatakse {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            / {table.getFilteredRowModel().rows.length} arvet
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
