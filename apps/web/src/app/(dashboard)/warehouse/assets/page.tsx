'use client';

import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { AssetsTable } from '@/components/warehouse/AssetsTable';
import Link from 'next/link';

export default function WarehouseAssetsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Varad</h1>
          <p className="text-muted-foreground">
            Kõik varad, tükikaubad ja tööriistad
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
            <Upload className="h-4 w-4 mr-2" />
            Impordi
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Ekspordi
          </Button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border rounded-lg p-6">
        <AssetsTable />
      </div>
    </div>
  );
}
