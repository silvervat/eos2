'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rivest/ui';
import {
  ArrowLeft, Edit, Trash2, ArrowRightLeft, Wrench, QrCode, Package,
  MapPin, User, FolderKanban, Calendar, DollarSign, Tag, Info,
  AlertTriangle, Truck, Clock
} from 'lucide-react';
import Link from 'next/link';
import { StockMovements } from '@/components/warehouse/StockMovements';
import { PhotoGallery } from '@/components/warehouse/PhotoGallery';
import { QRCodeModal } from '@/components/warehouse/QRCodeModal';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const assetId = params.id as string;

  const [showQRModal, setShowQRModal] = useState(false);

  const { data: assetResponse, isLoading, error } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    enabled: !!assetId,
  });

  // Fetch transfers for this asset
  const { data: transfersData } = useQuery({
    queryKey: ['asset-transfers', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/transfers?asset_id=${assetId}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    },
    enabled: !!assetId,
  });

  // Fetch maintenance for this asset
  const { data: maintenanceData } = useQuery({
    queryKey: ['asset-maintenance', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/maintenance?asset_id=${assetId}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch maintenance');
      return res.json();
    },
    enabled: !!assetId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
      router.push('/warehouse/assets');
    },
  });

  const asset = assetResponse?.data;
  const transfers = transfersData?.data || [];
  const maintenances = maintenanceData?.data || [];

  const statusLabels: Record<string, { label: string; color: string }> = {
    available: { label: 'Saadaval', color: 'bg-green-100 text-green-700' },
    in_use: { label: 'Kasutuses', color: 'bg-blue-100 text-blue-700' },
    maintenance: { label: 'Hoolduses', color: 'bg-yellow-100 text-yellow-700' },
    rented: { label: 'Rendis', color: 'bg-purple-100 text-purple-700' },
    retired: { label: 'Välja arvatud', color: 'bg-gray-100 text-gray-700' },
    lost: { label: 'Kadunud', color: 'bg-red-100 text-red-700' },
    damaged: { label: 'Kahjustatud', color: 'bg-red-100 text-red-700' },
  };

  const conditionLabels: Record<string, { label: string; color: string }> = {
    excellent: { label: 'Suurepärane', color: 'bg-green-100 text-green-700' },
    good: { label: 'Hea', color: 'bg-green-50 text-green-600' },
    fair: { label: 'Rahuldav', color: 'bg-yellow-100 text-yellow-700' },
    poor: { label: 'Halb', color: 'bg-red-100 text-red-700' },
  };

  const handleDelete = () => {
    if (confirm('Kas oled kindel, et soovid selle vara kustutada?')) {
      deleteMutation.mutate();
    }
  };

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
        <Link href="/warehouse/assets" className="text-primary hover:underline">Tagasi varade nimekirja</Link>
      </div>
    );
  }

  const statusConfig = statusLabels[asset.status] || { label: asset.status, color: 'bg-gray-100' };
  const conditionConfig = conditionLabels[asset.condition] || { label: asset.condition, color: 'bg-gray-100' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/warehouse/assets" className="p-2 hover:bg-slate-100 rounded-lg mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-slate-600 font-mono mt-1">{asset.asset_code}</p>
            {asset.category && (
              <p className="text-sm text-slate-500 mt-1">{asset.category.name}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <QrCode className="h-4 w-4" />
            QR kood
          </button>
          <Link
            href={`/warehouse/transfers/new?asset_id=${assetId}`}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Loo ülekanne
          </Link>
          <Link
            href={`/warehouse/maintenance/new?asset_id=${assetId}`}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Wrench className="h-4 w-4" />
            Lisa hooldus
          </Link>
          <Link
            href={`/warehouse/assets/${assetId}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#279989' }}
          >
            <Edit className="h-4 w-4" />
            Muuda
          </Link>
        </div>
      </div>

      {/* Low stock warning */}
      {asset.is_consumable && asset.reorder_point && asset.quantity_available <= asset.reorder_point && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>Madal laoseis! Saadaval: {asset.quantity_available} {asset.quantity_unit} (tellimispunkt: {asset.reorder_point})</span>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Ülevaade</TabsTrigger>
          <TabsTrigger value="photos">Fotod</TabsTrigger>
          {asset.is_consumable && <TabsTrigger value="stock">Laoseis</TabsTrigger>}
          <TabsTrigger value="transfers">Ülekanded</TabsTrigger>
          <TabsTrigger value="maintenance">Hooldused</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Põhiandmed</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Tüüp:</span>
                    <span className="font-medium">
                      {asset.type === 'asset' ? 'Vara' : asset.type === 'consumable' ? 'Tükikaup' : 'Tööriist'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Seisukord:</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${conditionConfig.color}`}>
                      {conditionConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Ladu:</span>
                    <span className="font-medium">{asset.warehouse?.name || '-'}</span>
                  </div>
                  {asset.assigned_user && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Kasutaja:</span>
                      <span className="font-medium">{asset.assigned_user.full_name}</span>
                    </div>
                  )}
                  {asset.assigned_project && (
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Projekt:</span>
                      <span className="font-medium">{asset.assigned_project.name}</span>
                    </div>
                  )}
                </div>

                {asset.description && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">{asset.description}</p>
                  </div>
                )}
              </div>

              {/* Product Info */}
              {(asset.manufacturer || asset.model || asset.serial_number) && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Toote andmed</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {asset.manufacturer && (
                      <div>
                        <span className="text-slate-500 text-sm">Tootja</span>
                        <p className="font-medium">{asset.manufacturer}</p>
                      </div>
                    )}
                    {asset.model && (
                      <div>
                        <span className="text-slate-500 text-sm">Mudel</span>
                        <p className="font-medium">{asset.model}</p>
                      </div>
                    )}
                    {asset.serial_number && (
                      <div>
                        <span className="text-slate-500 text-sm">Seerianumber</span>
                        <p className="font-medium font-mono">{asset.serial_number}</p>
                      </div>
                    )}
                    {asset.barcode && (
                      <div>
                        <span className="text-slate-500 text-sm">Triipkood</span>
                        <p className="font-medium font-mono">{asset.barcode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Consumable Info */}
              {asset.is_consumable && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Laoseisu info</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{asset.quantity_available || 0}</p>
                      <p className="text-sm text-slate-500">Saadaval</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{asset.quantity_reserved || 0}</p>
                      <p className="text-sm text-slate-500">Reserveeritud</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{asset.min_quantity || 0}</p>
                      <p className="text-sm text-slate-500">Miinimum</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{asset.reorder_point || 0}</p>
                      <p className="text-sm text-slate-500">Tellimispunkt</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Finantsiinfo</h2>
                <div className="space-y-3">
                  {asset.purchase_price && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ostuhind</span>
                      <span className="font-medium">{asset.purchase_price.toFixed(2)} €</span>
                    </div>
                  )}
                  {asset.current_value && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Praegune väärtus</span>
                      <span className="font-medium">{asset.current_value.toFixed(2)} €</span>
                    </div>
                  )}
                  {asset.average_price && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Keskmine hind</span>
                      <span className="font-medium">{asset.average_price.toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Kuupäevad</h2>
                <div className="space-y-3">
                  {asset.purchase_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ostmise kuupäev</span>
                      <span>{new Date(asset.purchase_date).toLocaleDateString('et-EE')}</span>
                    </div>
                  )}
                  {asset.warranty_expires_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Garantii kuni</span>
                      <span>{new Date(asset.warranty_expires_at).toLocaleDateString('et-EE')}</span>
                    </div>
                  )}
                  {asset.next_maintenance_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Järgmine hooldus</span>
                      <span>{new Date(asset.next_maintenance_date).toLocaleDateString('et-EE')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Loodud</span>
                    <span>{new Date(asset.created_at).toLocaleDateString('et-EE')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {asset.notes && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Märkmed</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{asset.notes}</p>
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Kustuta vara
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          <PhotoGallery assetId={assetId} />
        </TabsContent>

        {/* Stock Tab */}
        {asset.is_consumable && (
          <TabsContent value="stock" className="mt-4">
            <StockMovements assetId={assetId} isConsumable={asset.is_consumable} />
          </TabsContent>
        )}

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {transfers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ülekandeid pole</p>
                <Link
                  href={`/warehouse/transfers/new?asset_id=${assetId}`}
                  className="mt-4 inline-block text-primary hover:underline"
                >
                  Loo esimene ülekanne
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Kuupäev</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Tüüp</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Kust → Kuhu</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Staatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transfers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(t.created_at).toLocaleDateString('et-EE')}
                      </td>
                      <td className="px-4 py-3 text-sm">{t.transfer_type}</td>
                      <td className="px-4 py-3 text-sm">
                        {t.from_warehouse?.name || '-'} → {t.to_warehouse?.name || t.to_user?.full_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {maintenances.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Hooldusi pole</p>
                <Link
                  href={`/warehouse/maintenance/new?asset_id=${assetId}`}
                  className="mt-4 inline-block text-primary hover:underline"
                >
                  Lisa esimene hooldus
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Kuupäev</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Tüüp</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Staatus</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Kulu</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {maintenances.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(m.scheduled_date).toLocaleDateString('et-EE')}
                      </td>
                      <td className="px-4 py-3 text-sm">{m.maintenance_type}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100">
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {m.total_cost ? `${m.total_cost.toFixed(2)} €` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        asset={{
          id: asset.id,
          asset_code: asset.asset_code,
          name: asset.name,
          qr_code: asset.qr_code,
        }}
      />
    </div>
  );
}
