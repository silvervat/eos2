'use client';

import { Plus, QrCode, ArrowRightLeft, Package, Download, Wrench, AlertTriangle } from 'lucide-react';
import { WarehouseStats } from '@/components/warehouse/WarehouseStats';
import { AssetsTable } from '@/components/warehouse/AssetsTable';
import { LowStockAlerts } from '@/components/warehouse/LowStockAlerts';
import Link from 'next/link';

export default function WarehousePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laohaldus</h1>
          <p className="text-slate-600 text-sm mt-1">
            Varade, tükikaupade ja tööriistade haldamine
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/warehouse/assets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" />
            Lisa vara
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <QrCode className="h-4 w-4" />
            Skaneeri
          </button>
          <Link
            href="/warehouse/transfers/new"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Loo ülekanne
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Ekspordi
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <WarehouseStats />

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/warehouse/assets"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
        >
          <Package className="h-8 w-8 mb-2 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Varad</h3>
          <p className="text-sm text-slate-600">Kõik varad</p>
        </Link>

        <Link
          href="/warehouse/transfers"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
        >
          <ArrowRightLeft className="h-8 w-8 mb-2 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Ülekanded</h3>
          <p className="text-sm text-slate-600">Varade liigutamine</p>
        </Link>

        <Link
          href="/warehouse/maintenance"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
        >
          <Wrench className="h-8 w-8 mb-2 text-yellow-600" />
          <h3 className="font-semibold text-slate-900">Hooldused</h3>
          <p className="text-sm text-slate-600">Hoolduste kalender</p>
        </Link>

        <Link
          href="/warehouse/assets?low_stock=true"
          className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
        >
          <AlertTriangle className="h-8 w-8 mb-2 text-red-600" />
          <h3 className="font-semibold text-slate-900">Madal laoseis</h3>
          <p className="text-sm text-slate-600">Tähelepanu vajav</p>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Viimased varad</h2>
            <Link href="/warehouse/assets" className="text-sm text-primary hover:underline">
              Vaata kõiki →
            </Link>
          </div>
          <AssetsTable />
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1">
          <LowStockAlerts limit={5} compact />
        </div>
      </div>
    </div>
  );
}
