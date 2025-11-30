'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Wrench, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  asset_id: string;
  maintenance_type: string;
  scheduled_date: string;
  due_date: string;
  performed_by_user_id: string;
  performed_by_company: string;
  description: string;
  cost: number;
  labor_cost: number;
  parts_cost: number;
  external_service_cost: number;
}

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <NewMaintenanceContent />
    </Suspense>
  );
}

function NewMaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id');

  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    asset_id: preselectedAssetId || '',
    maintenance_type: 'routine',
    scheduled_date: new Date().toISOString().split('T')[0],
    due_date: '',
    performed_by_user_id: '',
    performed_by_company: '',
    description: '',
    cost: 0,
    labor_cost: 0,
    parts_cost: 0,
    external_service_cost: 0,
  });

  // Fetch assets
  const { data: assetsData } = useQuery({
    queryKey: ['warehouse-assets-for-maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/assets?limit=500');
      if (!res.ok) throw new Error('Failed to fetch assets');
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

  const assets = assetsData?.data || [];
  const users = usersData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await fetch('/api/warehouse/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create maintenance');
      }
      return res.json();
    },
    onSuccess: () => {
      router.push('/warehouse/maintenance');
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

    if (!formData.scheduled_date) {
      setError('Palun vali planeeritud kuupäev');
      return;
    }

    const submitData: Partial<FormData> = {
      asset_id: formData.asset_id,
      maintenance_type: formData.maintenance_type,
      scheduled_date: formData.scheduled_date,
      due_date: formData.due_date || undefined,
      performed_by_user_id: formData.performed_by_user_id || undefined,
      performed_by_company: formData.performed_by_company || undefined,
      description: formData.description || undefined,
      labor_cost: formData.labor_cost || undefined,
      parts_cost: formData.parts_cost || undefined,
      external_service_cost: formData.external_service_cost || undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const typeLabels: Record<string, string> = {
    routine: 'Regulaarne hooldus',
    repair: 'Remont',
    inspection: 'Ülevaatus',
    calibration: 'Kalibreerimine',
    certification: 'Sertifitseerimine',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/warehouse/maintenance" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lisa hooldus</h1>
          <p className="text-slate-600 text-sm mt-1">
            Planeeri vara hooldus või remont
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
        {/* Asset & Type */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Hoolduse andmed</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hoolduse tüüp *
              </label>
              <select
                value={formData.maintenance_type}
                onChange={(e) => handleChange('maintenance_type', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Planeeritud kuupäev *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tähtaeg
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
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
              placeholder="Hoolduse kirjeldus või tööde loetelu..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Performer */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Teostaja</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Töötaja
              </label>
              <select
                value={formData.performed_by_user_id}
                onChange={(e) => handleChange('performed_by_user_id', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Vali töötaja</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Välise teenusepakkuja
              </label>
              <input
                type="text"
                value={formData.performed_by_company}
                onChange={(e) => handleChange('performed_by_company', e.target.value)}
                placeholder="Ettevõtte nimi"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Planeeritud kulud</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tööjõukulu (EUR)
              </label>
              <input
                type="number"
                value={formData.labor_cost || ''}
                onChange={(e) => handleChange('labor_cost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Varuosade kulu (EUR)
              </label>
              <input
                type="number"
                value={formData.parts_cost || ''}
                onChange={(e) => handleChange('parts_cost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Välisteenuse kulu (EUR)
              </label>
              <input
                type="number"
                value={formData.external_service_cost || ''}
                onChange={(e) => handleChange('external_service_cost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between text-lg font-semibold">
              <span>Kokku:</span>
              <span>{((formData.labor_cost || 0) + (formData.parts_cost || 0) + (formData.external_service_cost || 0)).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/warehouse/maintenance"
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
                <Wrench className="h-4 w-4" />
                Salvesta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
