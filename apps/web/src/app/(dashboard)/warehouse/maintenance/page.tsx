'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wrench, CheckCircle, Clock, AlertTriangle, Calendar, Play, X } from 'lucide-react';
import Link from 'next/link';

interface Maintenance {
  id: string;
  asset_id: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date?: string;
  due_date?: string;
  description?: string;
  work_performed?: string;
  total_cost?: number;
  performed_by_company?: string;
  asset?: {
    id: string;
    name: string;
    asset_code: string;
  };
  performed_by?: {
    id: string;
    full_name: string;
  };
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);

  // Fetch maintenance records
  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-maintenance', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('maintenance_type', typeFilter);
      const res = await fetch(`/api/warehouse/maintenance?${params}`);
      if (!res.ok) throw new Error('Failed to fetch maintenance records');
      return res.json();
    },
  });

  // Fetch upcoming maintenance
  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/maintenance?upcoming=true&limit=10');
      if (!res.ok) throw new Error('Failed to fetch upcoming maintenance');
      return res.json();
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, completed_date }: { id: string; status: string; completed_date?: string }) => {
      const res = await fetch(`/api/warehouse/maintenance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, completed_date }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
    },
  });

  const maintenanceRecords = data?.data || [];
  const upcomingMaintenance = upcomingData?.data || [];

  const typeLabels: Record<string, string> = {
    routine: 'Regulaarne',
    repair: 'Remont',
    inspection: 'Ülevaatus',
    calibration: 'Kalibreerimine',
    certification: 'Sertifitseerimine',
  };

  const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    scheduled: { label: 'Planeeritud', color: 'bg-blue-100 text-blue-700', icon: <Calendar className="h-4 w-4" /> },
    in_progress: { label: 'Käimas', color: 'bg-yellow-100 text-yellow-700', icon: <Play className="h-4 w-4" /> },
    completed: { label: 'Tehtud', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: 'Tühistatud', color: 'bg-gray-100 text-gray-700', icon: <X className="h-4 w-4" /> },
    overdue: { label: 'Tähtaeg möödas', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-4 w-4" /> },
  };

  const handleStartMaintenance = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'in_progress' });
  };

  const handleCompleteMaintenance = (id: string) => {
    updateStatusMutation.mutate({
      id,
      status: 'completed',
      completed_date: new Date().toISOString(),
    });
  };

  const handleCancelMaintenance = (id: string) => {
    if (confirm('Kas oled kindel, et soovid hoolduse tühistada?')) {
      updateStatusMutation.mutate({ id, status: 'cancelled' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hooldused</h1>
          <p className="text-slate-600 text-sm mt-1">
            Varade hoolduste planeerimine ja jälgimine
          </p>
        </div>

        <Link
          href="/warehouse/maintenance/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa hooldus
        </Link>
      </div>

      {/* Upcoming Maintenance Alert */}
      {upcomingMaintenance.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">Eelseisvad hooldused</h2>
          </div>
          <div className="space-y-2">
            {upcomingMaintenance.slice(0, 5).map((m: Maintenance) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{m.asset?.name}</span>
                  <span className="text-yellow-700"> - {typeLabels[m.maintenance_type]}</span>
                </span>
                <span className="text-yellow-700">
                  {new Date(m.scheduled_date).toLocaleDateString('et-EE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Kõik staatused</option>
          {Object.entries(statusLabels).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Kõik tüübid</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Planeeritud</span>
          </div>
          <p className="text-2xl font-bold">
            {maintenanceRecords.filter((m: Maintenance) => m.status === 'scheduled').length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <Play className="h-5 w-5" />
            <span className="text-sm font-medium">Käimas</span>
          </div>
          <p className="text-2xl font-bold">
            {maintenanceRecords.filter((m: Maintenance) => m.status === 'in_progress').length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Tähtaeg möödas</span>
          </div>
          <p className="text-2xl font-bold">
            {maintenanceRecords.filter((m: Maintenance) => m.status === 'overdue').length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Tehtud (sel kuul)</span>
          </div>
          <p className="text-2xl font-bold">
            {maintenanceRecords.filter((m: Maintenance) => {
              if (m.status !== 'completed' || !m.completed_date) return false;
              const completedDate = new Date(m.completed_date);
              const now = new Date();
              return completedDate.getMonth() === now.getMonth() &&
                     completedDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Vara</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tüüp</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Staatus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Planeeritud</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Teostaja</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kulu</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Toimingud</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <span className="ml-3 text-slate-600">Laadimine...</span>
                  </div>
                </td>
              </tr>
            ) : maintenanceRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hooldusi ei leitud</p>
                </td>
              </tr>
            ) : (
              maintenanceRecords.map((m: Maintenance) => {
                const statusConfig = statusLabels[m.status] || { label: m.status, color: 'bg-gray-100 text-gray-700', icon: null };
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/warehouse/assets/${m.asset_id}`} className="hover:underline">
                        <p className="font-medium text-slate-900">{m.asset?.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{m.asset?.asset_code}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {typeLabels[m.maintenance_type] || m.maintenance_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(m.scheduled_date).toLocaleDateString('et-EE')}
                      {m.completed_date && (
                        <p className="text-xs text-green-600">
                          Tehtud: {new Date(m.completed_date).toLocaleDateString('et-EE')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {m.performed_by?.full_name || m.performed_by_company || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {m.total_cost ? `${m.total_cost.toFixed(2)} €` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartMaintenance(m.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Alusta hooldust"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {(m.status === 'scheduled' || m.status === 'in_progress') && (
                          <button
                            onClick={() => handleCompleteMaintenance(m.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Märgi tehtuks"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {m.status !== 'completed' && m.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelMaintenance(m.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Tühista"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
