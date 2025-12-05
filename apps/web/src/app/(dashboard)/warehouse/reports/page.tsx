'use client'

import { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileText,
  Package,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'

interface Report {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  type: 'inventory' | 'movement' | 'maintenance' | 'analysis'
}

const reports: Report[] = [
  {
    id: 'inventory-status',
    name: 'Laoseis',
    description: 'Ülevaade kõigist varadest ja nende hetkeseisust',
    icon: Package,
    type: 'inventory',
  },
  {
    id: 'low-stock',
    name: 'Madal laoseis',
    description: 'Tooted, mille kogus on alla miinimumi',
    icon: AlertTriangle,
    type: 'inventory',
  },
  {
    id: 'movements',
    name: 'Liikumised',
    description: 'Varade sissetulekud ja väljaminekud perioodis',
    icon: ArrowRightLeft,
    type: 'movement',
  },
  {
    id: 'maintenance-schedule',
    name: 'Hooldusgraafik',
    description: 'Planeeritud ja tehtud hooldused',
    icon: Wrench,
    type: 'maintenance',
  },
  {
    id: 'value-report',
    name: 'Väärtuste raport',
    description: 'Varade koguväärtus ja amortisatsioon',
    icon: TrendingUp,
    type: 'analysis',
  },
  {
    id: 'usage-analysis',
    name: 'Kasutuse analüüs',
    description: 'Varade kasutusstatistika ja efektiivsus',
    icon: BarChart3,
    type: 'analysis',
  },
]

export default function WarehouseReportsPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredReports = reports.filter(r =>
    selectedType === 'all' || r.type === selectedType
  )

  const handleExport = (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting ${reportId} as ${format}`)
    // TODO: Implement export
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: '#279989' }} />
            Raportid
          </h1>
          <p className="text-sm text-slate-500">Laohalduse raportid ja analüütika</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Kõik raportid</option>
            <option value="inventory">Laoseisu raportid</option>
            <option value="movement">Liikumiste raportid</option>
            <option value="maintenance">Hoolduse raportid</option>
            <option value="analysis">Analüütika</option>
          </select>
        </div>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{report.name}</h3>
                  <p className="text-sm text-slate-500">{report.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport(report.id, 'pdf')}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport(report.id, 'excel')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">1,234</p>
              <p className="text-sm text-slate-500">Varasid kokku</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">€456K</p>
              <p className="text-sm text-slate-500">Koguväärtus</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">23</p>
              <p className="text-sm text-slate-500">Madal laoseis</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-sm text-slate-500">Hooldust ootel</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
