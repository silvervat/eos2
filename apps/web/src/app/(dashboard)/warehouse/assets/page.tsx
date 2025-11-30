'use client';

import { Plus, Download, Upload } from 'lucide-react';
import { AssetsTable } from '@/components/warehouse/AssetsTable';
import Link from 'next/link';

export default function WarehouseAssetsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Varad</h1>
          <p className="text-slate-600 text-sm mt-1">
            Kõik varad, tükikaubad ja tööriistad
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
            <Upload className="h-4 w-4" />
            Impordi
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Ekspordi
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <AssetsTable />
      </div>
    </div>
  );
}
