'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Package, AlertCircle } from 'lucide-react';
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
  manufacturer: string;
  model: string;
  serial_number: string;
  description: string;
  notes: string;
  status: string;
  condition: string;
}

export default function NewAssetPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    asset_code: '',
    name: '',
    type: 'asset',
    category_id: '',
    current_warehouse_id: '',
    is_consumable: false,
    quantity_available: 0,
    quantity_unit: 'tk',
    min_quantity: 0,
    max_quantity: 0,
    reorder_point: 0,
    purchase_price: 0,
    manufacturer: '',
    model: '',
    serial_number: '',
    description: '',
    notes: '',
    status: 'available',
    condition: 'good',
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories?flat=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data;
    },
  });

  const warehouses = warehousesData || [];
  const categories = categoriesData || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/warehouse/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create asset');
      }
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/warehouse/assets/${data.data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.asset_code || !formData.name) {
      setError('Kood ja nimi on kohustuslikud');
      return;
    }

    // Prepare data
    const submitData = {
      ...formData,
      category_id: formData.category_id || undefined,
      current_warehouse_id: formData.current_warehouse_id || undefined,
      purchase_price: formData.purchase_price || undefined,
      min_quantity: formData.is_consumable ? formData.min_quantity : undefined,
      max_quantity: formData.is_consumable ? formData.max_quantity : undefined,
      reorder_point: formData.is_consumable ? formData.reorder_point : undefined,
      quantity_available: formData.is_consumable ? formData.quantity_available : undefined,
    };

    createMutation.mutate(submitData as FormData);
  };

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-set is_consumable based on type
      if (field === 'type') {
        newData.is_consumable = value === 'consumable';
      }

      return newData;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/warehouse/assets" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lisa uus vara</h1>
          <p className="text-slate-600 text-sm mt-1">
            Lisa vara, tükikaup või tööriist laosüsteemi
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
                placeholder="nt. VAR-001"
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
                placeholder="Vara nimi"
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
                placeholder="Tootja nimi"
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
                placeholder="Mudeli number"
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
                placeholder="SN-12345"
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
                placeholder="0.00"
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
              placeholder="Vara kirjeldus..."
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
                <p className="mt-1 text-xs text-slate-500">
                  Hoiatus kui kogus langeb alla selle
                </p>
              </div>
            </div>
          </div>
        )}

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
            href="/warehouse/assets"
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
                Salvestamine...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvesta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
