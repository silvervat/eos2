'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Package, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  asset_code: string;
  name: string;
  type: 'asset' | 'consumable' | 'tool';
  category_id: string;
  current_warehouse_id: string;
  is_consumable: boolean;
  quantity_available: number;
  quantity_unit: string;
  min_quantity: number;
  max_quantity: number;
  reorder_point: number;
  purchase_price: number;
  current_value: number;
  manufacturer: string;
  model: string;
  serial_number: string;
  description: string;
  notes: string;
  status: string;
  condition: string;
  requires_maintenance: boolean;
  maintenance_interval_days: number;
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const assetId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Fetch asset
  const { data: assetResponse, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    enabled: !!assetId,
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

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories?flat=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const warehouses = warehousesData?.data || [];
  const categories = categoriesData?.data || [];

  // Initialize form data when asset is loaded
  useEffect(() => {
    if (assetResponse?.data && !formData) {
      const asset = assetResponse.data;
      setFormData({
        asset_code: asset.asset_code || '',
        name: asset.name || '',
        type: asset.type || 'asset',
        category_id: asset.category_id || '',
        current_warehouse_id: asset.current_warehouse_id || '',
        is_consumable: asset.is_consumable || false,
        quantity_available: asset.quantity_available || 0,
        quantity_unit: asset.quantity_unit || 'tk',
        min_quantity: asset.min_quantity || 0,
        max_quantity: asset.max_quantity || 0,
        reorder_point: asset.reorder_point || 0,
        purchase_price: asset.purchase_price || 0,
        current_value: asset.current_value || 0,
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        description: asset.description || '',
        notes: asset.notes || '',
        status: asset.status || 'available',
        condition: asset.condition || 'good',
        requires_maintenance: asset.requires_maintenance || false,
        maintenance_interval_days: asset.maintenance_interval_days || 0,
      });
    }
  }, [assetResponse, formData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update asset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
      router.push(`/warehouse/assets/${assetId}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
      router.push('/warehouse/assets');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData?.asset_code || !formData?.name) {
      setError('Kood ja nimi on kohustuslikud');
      return;
    }

    const submitData: Partial<FormData> = {
      ...formData,
      category_id: formData.category_id || undefined,
      current_warehouse_id: formData.current_warehouse_id || undefined,
      purchase_price: formData.purchase_price || undefined,
      current_value: formData.current_value || undefined,
      min_quantity: formData.is_consumable ? formData.min_quantity : undefined,
      max_quantity: formData.is_consumable ? formData.max_quantity : undefined,
      reorder_point: formData.is_consumable ? formData.reorder_point : undefined,
      quantity_available: formData.is_consumable ? formData.quantity_available : undefined,
      maintenance_interval_days: formData.requires_maintenance ? formData.maintenance_interval_days : undefined,
    };

    updateMutation.mutate(submitData);
  };

  const handleDelete = () => {
    if (confirm('Kas oled kindel, et soovid selle vara kustutada? See tegevus on pöördumatu.')) {
      deleteMutation.mutate();
    }
  };

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    if (!formData) return;

    setFormData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, [field]: value };

      if (field === 'type') {
        newData.is_consumable = value === 'consumable';
      }

      return newData;
    });
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/warehouse/assets/${assetId}`} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Muuda vara</h1>
            <p className="text-slate-600 text-sm mt-1">
              {formData.name} ({formData.asset_code})
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Kustuta
        </button>
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
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Põhiandmed</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vara kood *
              </label>
              <input
                type="text"
                value={formData.asset_code}
                onChange={(e) => handleChange('asset_code', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nimi *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tüüp
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="asset">Vara</option>
                <option value="consumable">Tükikaup</option>
                <option value="tool">Tööriist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategooria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Vali kategooria</option>
                {categories.map((cat: { id: string; name: string; path: string }) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.path ? cat.path.replace(/\//g, ' > ') : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ladu
              </label>
              <select
                value={formData.current_warehouse_id}
                onChange={(e) => handleChange('current_warehouse_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Vali ladu</option>
                {warehouses.map((w: { id: string; name: string }) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Staatus
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="available">Saadaval</option>
                <option value="in_use">Kasutuses</option>
                <option value="maintenance">Hoolduses</option>
                <option value="rented">Rendis</option>
                <option value="retired">Välja arvatud</option>
                <option value="lost">Kadunud</option>
                <option value="damaged">Kahjustatud</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Seisukord
              </label>
              <select
                value={formData.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="excellent">Suurepärane</option>
                <option value="good">Hea</option>
                <option value="fair">Rahuldav</option>
                <option value="poor">Halb</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Toote andmed</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tootja
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mudel
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Seerianumber
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => handleChange('serial_number', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ostuhind (EUR)
              </label>
              <input
                type="number"
                value={formData.purchase_price || ''}
                onChange={(e) => handleChange('purchase_price', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Praegune väärtus (EUR)
              </label>
              <input
                type="number"
                value={formData.current_value || ''}
                onChange={(e) => handleChange('current_value', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kirjeldus
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Consumable Fields */}
        {formData.is_consumable && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Laoseisu andmed</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Saadaval kogus
                </label>
                <input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => handleChange('quantity_available', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ühik
                </label>
                <select
                  value={formData.quantity_unit}
                  onChange={(e) => handleChange('quantity_unit', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="tk">tk (tükk)</option>
                  <option value="kg">kg (kilogramm)</option>
                  <option value="l">l (liiter)</option>
                  <option value="m">m (meeter)</option>
                  <option value="m2">m² (ruutmeeter)</option>
                  <option value="m3">m³ (kuupmeeter)</option>
                  <option value="pcs">pcs (pieces)</option>
                  <option value="box">box (kast)</option>
                  <option value="pallet">pallet (alus)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Miinimum laoseis
                </label>
                <input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => handleChange('min_quantity', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Maksimum laoseis
                </label>
                <input
                  type="number"
                  value={formData.max_quantity}
                  onChange={(e) => handleChange('max_quantity', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tellimispunkt
                </label>
                <input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => handleChange('reorder_point', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Hoolduse seaded</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_maintenance}
                onChange={(e) => handleChange('requires_maintenance', e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Vajab regulaarset hooldust</span>
            </label>

            {formData.requires_maintenance && (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hooldusintervall (päevades)
                </label>
                <input
                  type="number"
                  value={formData.maintenance_interval_days}
                  onChange={(e) => handleChange('maintenance_interval_days', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Märkmed</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder="Sisemised märkmed..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/warehouse/assets/${assetId}`}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Tühista
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Salvestamine...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvesta muudatused
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
