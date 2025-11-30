'use client';

import { Button } from '@/components/ui/button';
import { Plus, QrCode, ArrowRightLeft, Package, Download } from 'lucide-react';
import { WarehouseStats } from '@/components/warehouse/WarehouseStats';
import { AssetsTable } from '@/components/warehouse/AssetsTable';
import Link from 'next/link';

export default function WarehousePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Laohaldus</h1>
          <p className="text-muted-foreground">
            Varade, tükikaupade ja tööriistade haldamine
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/warehouse/assets/new">
              <Plus className="h-4 w-4 mr-2" />
              Lisa vara
            </Link>
          </Button>
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Skaneeri
          </Button>
          <Button variant="outline" asChild>
            <Link href="/warehouse/transfers/new">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Loo ülekanne
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Ekspordi
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <WarehouseStats />

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/warehouse/assets"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <Package className="h-8 w-8 mb-2 text-blue-600" />
          <h3 className="font-semibold">Varad</h3>
          <p className="text-sm text-muted-foreground">Kõik varad</p>
        </Link>

        <Link
          href="/warehouse/transfers"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <ArrowRightLeft className="h-8 w-8 mb-2 text-purple-600" />
          <h3 className="font-semibold">Ülekanded</h3>
          <p className="text-sm text-muted-foreground">Varade liigutamine</p>
        </Link>

        <Link
          href="/warehouse/maintenance"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <h3 className="font-semibold">Hooldused</h3>
          <p className="text-sm text-muted-foreground">Hoolduste kalender</p>
        </Link>

        <Link
          href="/warehouse/assets?low_stock=true"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3 className="font-semibold">Madal laoseis</h3>
          <p className="text-sm text-muted-foreground">Tähelepanu vajav</p>
        </Link>
      </div>

      {/* Assets Table */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Viimased varad</h2>
          <Button variant="ghost" asChild>
            <Link href="/warehouse/assets">Vaata kõiki →</Link>
          </Button>
        </div>
        <AssetsTable />
      </div>
    </div>
  );
}
