'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rivest/ui';
import { ArrowLeft, Edit, Trash2, ArrowRightLeft, Wrench, QrCode, Package, MapPin, User, FolderKanban, Calendar, FileText, ImageIcon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { StockMovements } from '@/components/warehouse/StockMovements';
import { PhotoGallery } from '@/components/warehouse/PhotoGallery';

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const { data: assetResponse, isLoading, error } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    enabled: !!assetId,
  });

  const asset = assetResponse?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold mb-2">Vara ei leitud</h2>
        <Link href="/warehouse/assets" className="text-primary hover:underline">Tagasi</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/warehouse/assets" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <p className="text-slate-600 font-mono">{asset.asset_code}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Ülevaade</TabsTrigger>
          <TabsTrigger value="photos">Fotod</TabsTrigger>
          {asset.is_consumable && <TabsTrigger value="stock">Laoseis</TabsTrigger>}
          <TabsTrigger value="history">Ajalugu</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="bg-white rounded-xl border p-6">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">Kategooria:</span> {asset.category?.name || '-'}</div>
              <div><span className="text-slate-500">Ladu:</span> {asset.warehouse?.name || '-'}</div>
              <div><span className="text-slate-500">Staatus:</span> {asset.status}</div>
              <div><span className="text-slate-500">Seisukord:</span> {asset.condition}</div>
              {asset.is_consumable && (
                <>
                  <div><span className="text-slate-500">Saadaval:</span> {asset.quantity_available || 0}</div>
                  <div><span className="text-slate-500">Miinimum:</span> {asset.min_quantity || 0}</div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="photos" className="mt-4">
          <PhotoGallery assetId={assetId} />
        </TabsContent>
        {asset.is_consumable && (
          <TabsContent value="stock" className="mt-4">
            <StockMovements assetId={assetId} isConsumable={asset.is_consumable} />
          </TabsContent>
        )}
        <TabsContent value="history" className="mt-4">
          <div className="bg-white rounded-xl border p-6 text-center text-slate-500">
            Ajalugu pole veel saadaval
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
