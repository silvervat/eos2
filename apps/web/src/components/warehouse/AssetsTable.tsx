'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivest/ui';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ArrowRightLeft,
  Wrench,
  Download,
  Package,
  ChevronDown,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  type: string;
  status: string;
  condition: string;
  quantity_available?: number;
  quantity_unit?: string;
  is_consumable: boolean;
  category?: {
    id: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
  };
  assigned_project?: {
    id: string;
    name: string;
  };
  next_maintenance_date?: string;
}

interface AssetsTableProps {
  onAssetClick?: (asset: Asset) => void;
  onCreateTransfer?: (assetId: string) => void;
  onScheduleMaintenance?: (assetId: string) => void;
}

export function AssetsTable({
  onAssetClick,
  onCreateTransfer,
  onScheduleMaintenance
}: AssetsTableProps) {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch assets
  const { data, isLoading, error } = useQuery({
    queryKey: ['warehouse-assets', debouncedSearch, warehouseFilter, statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('is_consumable', typeFilter === 'consumable' ? 'true' : 'false');

      const res = await fetch(`/api/warehouse/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const json = await res.json();
      return json.data;
    },
  });

  const warehouses = warehousesData || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
    },
  });

  // Handlers
  const handleDelete = async (assetId: string) => {
    if (confirm('Kas oled kindel, et soovid selle vara kustutada?')) {
      await deleteMutation.mutateAsync(assetId);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, selectedAssets);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssets.length === data?.data?.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(data?.data?.map((a: Asset) => a.id) || []);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      available: { label: 'Saadaval', className: 'bg-green-100 text-green-700' },
      in_use: { label: 'Kasutuses', className: 'bg-blue-100 text-blue-700' },
      maintenance: { label: 'Hoolduses', className: 'bg-yellow-100 text-yellow-700' },
      rented: { label: 'Rendis', className: 'bg-purple-100 text-purple-700' },
      retired: { label: 'Välja arvatud', className: 'bg-gray-100 text-gray-700' },
      lost: { label: 'Kadunud', className: 'bg-red-100 text-red-700' },
      damaged: { label: 'Kahjustatud', className: 'bg-red-100 text-red-700' },
    };
    const statusConfig = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getConditionBadge = (condition: string) => {
    const config: Record<string, { label: string; className: string }> = {
      excellent: { label: 'Suurepärane', className: 'bg-green-100 text-green-700' },
      good: { label: 'Hea', className: 'bg-green-50 text-green-600' },
      fair: { label: 'Rahuldav', className: 'bg-yellow-100 text-yellow-700' },
      poor: { label: 'Halb', className: 'bg-red-100 text-red-700' },
    };
    const condConfig = config[condition] || { label: condition, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${condConfig.className}`}>
        {condConfig.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Viga varade laadimisel</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi vara (nimi, kood, seerianumber)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Kõik laod</option>
          {warehouses?.map((w: { id: string; name: string }) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Kõik staatused</option>
          <option value="available">Saadaval</option>
          <option value="in_use">Kasutuses</option>
          <option value="maintenance">Hoolduses</option>
          <option value="rented">Rendis</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Kõik tüübid</option>
          <option value="asset">Varad</option>
          <option value="consumable">Tükikaubad</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-slate-100 rounded-lg">
          <span className="text-sm font-medium">
            {selectedAssets.length} vara valitud
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('transfer')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-white"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Loo ülekanne
            </button>
            <button
              onClick={() => handleBulkAction('qr')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-white"
            >
              <QrCode className="h-4 w-4" />
              Prindi QR
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Ekspordi
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={data?.data?.length > 0 && selectedAssets.length === data?.data?.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kood</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nimi</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategooria</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Ladu</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Staatus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Seisukord</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kogus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kasutaja/Projekt</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <span className="ml-3 text-slate-600">Laadimine...</span>
                  </div>
                </td>
              </tr>
            ) : !data?.data || data?.data?.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Varasid ei leitud</p>
                </td>
              </tr>
            ) : (
              data?.data?.map((asset: Asset) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="rounded border-slate-300"
                    />
                  </td>

                  <td className="px-4 py-3 font-mono text-sm text-slate-600">
                    <Link href={`/warehouse/assets/${asset.id}`} className="hover:underline hover:text-primary">
                      {asset.asset_code}
                    </Link>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/warehouse/assets/${asset.id}`} className="hover:underline hover:text-primary">
                      {asset.name}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {asset.category?.name || '-'}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {asset.warehouse?.name || '-'}
                  </td>

                  <td className="px-4 py-3">
                    {getStatusBadge(asset.status)}
                  </td>

                  <td className="px-4 py-3">
                    {getConditionBadge(asset.condition)}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {asset.is_consumable ? (
                      <span>{asset.quantity_available} {asset.quantity_unit}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {asset.assigned_user ? (
                      <span className="font-medium">{asset.assigned_user.full_name}</span>
                    ) : asset.assigned_project ? (
                      <span className="font-medium">{asset.assigned_project.name}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === asset.id ? null : asset.id)}
                      className="p-1 rounded hover:bg-slate-200"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-500" />
                    </button>
                    {openDropdown === asset.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                        <div className="py-1">
                          <Link
                            href={`/warehouse/assets/${asset.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            Vaata
                          </Link>
                          <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <Edit className="h-4 w-4" />
                            Redigeeri
                          </button>
                          <button
                            onClick={() => {
                              onCreateTransfer?.(asset.id);
                              setOpenDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            Loo ülekanne
                          </button>
                          <button
                            onClick={() => {
                              onScheduleMaintenance?.(asset.id);
                              setOpenDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Wrench className="h-4 w-4" />
                            Lisa hooldus
                          </button>
                          <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <QrCode className="h-4 w-4" />
                            Prindi QR kood
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(asset.id);
                              setOpenDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Kustuta
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Lehekülg {data.pagination.page} / {data.pagination.totalPages}
              {' '}(Kokku {data.pagination.total} vara)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Eelmine
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Järgmine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
