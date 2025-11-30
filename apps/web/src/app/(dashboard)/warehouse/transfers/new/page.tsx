'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, ArrowRightLeft, AlertCircle, Package, User, FolderKanban, Warehouse as WarehouseIcon } from 'lucide-react';
import Link from 'next/link';

type TransferType = 'warehouse' | 'user' | 'project';

interface FormData {
  asset_id: string;
  quantity: number;
  transfer_type: TransferType;
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_user_id: string;
  to_user_id: string;
  to_project_id: string;
  expected_return_date: string;
  notes: string;
  reason: string;
}

export default function NewTransferPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <NewTransferContent />
    </Suspense>
  );
}

function NewTransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id');

  const [error, setError] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState('');

  const [formData, setFormData] = useState<FormData>({
    asset_id: preselectedAssetId || '',
    quantity: 1,
    transfer_type: 'warehouse',
    from_warehouse_id: '',
    to_warehouse_id: '',
    from_user_id: '',
    to_user_id: '',
    to_project_id: '',
    expected_return_date: '',
    notes: '',
    reason: '',
  });

  // Fetch assets for selection
  const { data: assetsData } = useQuery({
    queryKey: ['warehouse-assets', assetSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (assetSearch) params.append('search', assetSearch);
      const res = await fetch(`/api/warehouse/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      return res.json();
    },
  });

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['warehouse-users'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['warehouse-projects'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const assets = assetsData?.data || [];
  const warehouses = warehousesData?.data || [];
  const users = usersData?.data || [];
  const projects = projectsData?.data || [];

  // Find selected asset
  const selectedAsset = assets.find((a: any) => a.id === formData.asset_id);

  // Auto-set from_warehouse when asset is selected
  useEffect(() => {
    if (selectedAsset?.current_warehouse_id && !formData.from_warehouse_id) {
      setFormData(prev => ({
        ...prev,
        from_warehouse_id: selectedAsset.current_warehouse_id,
      }));
    }
  }, [selectedAsset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await fetch('/api/warehouse/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create transfer');
      }
      return res.json();
    },
    onSuccess: () => {
      router.push('/warehouse/transfers');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.asset_id) {
      setError('Palun vali vara');
      return;
    }

    // Prepare data based on transfer type
    const submitData: Partial<FormData> = {
      asset_id: formData.asset_id,
      quantity: formData.quantity,
      transfer_type: formData.transfer_type,
      notes: formData.notes || undefined,
      reason: formData.reason || undefined,
    };

    if (formData.transfer_type === 'warehouse') {
      if (!formData.to_warehouse_id) {
        setError('Palun vali sihtladu');
        return;
      }
      submitData.from_warehouse_id = formData.from_warehouse_id || undefined;
      submitData.to_warehouse_id = formData.to_warehouse_id;
    } else if (formData.transfer_type === 'user') {
      if (!formData.to_user_id) {
        setError('Palun vali kasutaja');
        return;
      }
      submitData.from_warehouse_id = formData.from_warehouse_id || undefined;
      submitData.to_user_id = formData.to_user_id;
      if (formData.expected_return_date) {
        submitData.expected_return_date = formData.expected_return_date;
      }
    } else if (formData.transfer_type === 'project') {
      if (!formData.to_project_id) {
        setError('Palun vali projekt');
        return;
      }
      submitData.from_warehouse_id = formData.from_warehouse_id || undefined;
      submitData.to_project_id = formData.to_project_id;
    }

    createMutation.mutate(submitData);
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/warehouse/transfers" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loo ülekanne</h1>
          <p className="text-slate-600 text-sm mt-1">
            Liiguta vara laost, kasutajale või projektile
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Selection */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Vali vara</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vara *
              </label>
              <select
                value={formData.asset_id}
                onChange={(e) => handleChange('asset_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value="">Vali vara</option>
                {assets.map((asset: any) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.name}
                    {asset.is_consumable ? ` (${asset.quantity_available} ${asset.quantity_unit})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Asset Info */}
            {selectedAsset && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-slate-400" />
                  <div>
                    <p className="font-medium">{selectedAsset.name}</p>
                    <p className="text-sm text-slate-600">
                      Kood: {selectedAsset.asset_code}
                      {selectedAsset.is_consumable && ` | Saadaval: ${selectedAsset.quantity_available} ${selectedAsset.quantity_unit}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity for consumables */}
            {selectedAsset?.is_consumable && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kogus
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  max={selectedAsset.quantity_available}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Transfer Type */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ülekande tüüp</h2>

          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleChange('transfer_type', 'warehouse')}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                formData.transfer_type === 'warehouse'
                  ? 'border-[#279989] bg-[#279989]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <WarehouseIcon className={`h-8 w-8 mx-auto mb-2 ${
                formData.transfer_type === 'warehouse' ? 'text-[#279989]' : 'text-slate-400'
              }`} />
              <p className="font-medium">Lattu</p>
              <p className="text-xs text-slate-500">Teise lattu</p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('transfer_type', 'user')}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                formData.transfer_type === 'user'
                  ? 'border-[#279989] bg-[#279989]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <User className={`h-8 w-8 mx-auto mb-2 ${
                formData.transfer_type === 'user' ? 'text-[#279989]' : 'text-slate-400'
              }`} />
              <p className="font-medium">Kasutajale</p>
              <p className="text-xs text-slate-500">Töötajale</p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('transfer_type', 'project')}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                formData.transfer_type === 'project'
                  ? 'border-[#279989] bg-[#279989]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <FolderKanban className={`h-8 w-8 mx-auto mb-2 ${
                formData.transfer_type === 'project' ? 'text-[#279989]' : 'text-slate-400'
              }`} />
              <p className="font-medium">Projektile</p>
              <p className="text-xs text-slate-500">Objektile</p>
            </button>
          </div>
        </div>

        {/* Source & Destination */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Kust ja kuhu</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Warehouse */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lähtladu
              </label>
              <select
                value={formData.from_warehouse_id}
                onChange={(e) => handleChange('from_warehouse_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Vali ladu</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination based on type */}
            {formData.transfer_type === 'warehouse' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sihtladu *
                </label>
                <select
                  value={formData.to_warehouse_id}
                  onChange={(e) => handleChange('to_warehouse_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">Vali ladu</option>
                  {warehouses
                    .filter((w: any) => w.id !== formData.from_warehouse_id)
                    .map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {formData.transfer_type === 'user' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kasutaja *
                </label>
                <select
                  value={formData.to_user_id}
                  onChange={(e) => handleChange('to_user_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">Vali kasutaja</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.transfer_type === 'project' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Projekt *
                </label>
                <select
                  value={formData.to_project_id}
                  onChange={(e) => handleChange('to_project_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">Vali projekt</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Expected return date for user transfers */}
          {formData.transfer_type === 'user' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Eeldatav tagastuskuupäev
              </label>
              <input
                type="date"
                value={formData.expected_return_date}
                onChange={(e) => handleChange('expected_return_date', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lisainfo</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Põhjus
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="Ülekande põhjus"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Märkmed
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Lisainformatsioon..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/warehouse/transfers"
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Tühista
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Loomisel...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                Loo ülekanne
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
