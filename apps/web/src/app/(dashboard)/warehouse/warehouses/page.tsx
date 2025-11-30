'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Warehouse, MapPin, User, X, Loader2 } from 'lucide-react';

interface WarehouseData {
  id: string;
  code: string;
  name: string;
  type: 'main' | 'mobile' | 'external' | 'vehicle';
  location: string | null;
  address: string | null;
  manager_id: string | null;
  capacity_m3: number | null;
  temperature_controlled: boolean;
  security_level: 'low' | 'standard' | 'high' | 'maximum';
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  manager?: { id: string; full_name: string; email: string } | null;
}

const typeLabels: Record<string, string> = {
  main: 'Pealadu',
  mobile: 'Mobiilne',
  external: 'Väline',
  vehicle: 'Sõiduk',
};

const statusLabels: Record<string, string> = {
  active: 'Aktiivne',
  inactive: 'Mitteaktiivne',
  maintenance: 'Hoolduses',
};

const securityLabels: Record<string, string> = {
  low: 'Madal',
  standard: 'Tavaline',
  high: 'Kõrge',
  maximum: 'Maksimum',
};

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'main' as const,
    location: '',
    address: '',
    capacity_m3: '',
    temperature_controlled: false,
    security_level: 'standard' as const,
    notes: '',
  });

  // Fetch warehouses
  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/warehouse/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          capacity_m3: data.capacity_m3 ? parseFloat(data.capacity_m3) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create warehouse');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/warehouse/warehouses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          capacity_m3: data.capacity_m3 ? parseFloat(data.capacity_m3) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update warehouse');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/warehouses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete warehouse');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const openModal = (warehouse?: WarehouseData) => {
    setError(null);
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        type: warehouse.type,
        location: warehouse.location || '',
        address: warehouse.address || '',
        capacity_m3: warehouse.capacity_m3?.toString() || '',
        temperature_controlled: warehouse.temperature_controlled,
        security_level: warehouse.security_level,
        notes: warehouse.notes || '',
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        code: '',
        name: '',
        type: 'main',
        location: '',
        address: '',
        capacity_m3: '',
        temperature_controlled: false,
        security_level: 'standard',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Kas oled kindel, et tahad kustutada lao "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const warehouses: WarehouseData[] = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Laod</h1>
          <p className="text-slate-600 text-sm">Halda laohooneid ja asukohti</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" /> Lisa ladu
        </button>
      </div>

      {/* Warehouses grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#279989]" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Warehouse className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Ladusid ei leitud</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-[#279989] hover:underline"
          >
            Lisa esimene ladu
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#279989]/10 rounded-lg">
                    <Warehouse className="h-6 w-6 text-[#279989]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{warehouse.name}</h3>
                    <p className="text-sm text-slate-500">{warehouse.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(warehouse)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse.id, warehouse.name)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                    {typeLabels[warehouse.type]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    warehouse.status === 'active' ? 'bg-green-100 text-green-700' :
                    warehouse.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusLabels[warehouse.status]}
                  </span>
                </div>

                {warehouse.location && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>{warehouse.location}</span>
                  </div>
                )}

                {warehouse.manager && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="h-4 w-4" />
                    <span>{warehouse.manager.full_name}</span>
                  </div>
                )}

                {warehouse.capacity_m3 && (
                  <div className="text-slate-500">
                    Maht: {warehouse.capacity_m3} m³
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingWarehouse ? 'Muuda ladu' : 'Lisa uus ladu'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kood *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="LAO-01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tüüp</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nimi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Peakontor ladu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Asukoht</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Tallinn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aadress</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Lao tn 1, Tallinn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Maht (m³)</label>
                  <input
                    type="number"
                    value={formData.capacity_m3}
                    onChange={(e) => setFormData({ ...formData, capacity_m3: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Turvalisus</label>
                  <select
                    value={formData.security_level}
                    onChange={(e) => setFormData({ ...formData, security_level: e.target.value as typeof formData.security_level })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(securityLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="temp_controlled"
                  checked={formData.temperature_controlled}
                  onChange={(e) => setFormData({ ...formData, temperature_controlled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="temp_controlled" className="text-sm">
                  Temperatuurikontrolliga
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Märkmed</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Lisainfo..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#279989' }}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : editingWarehouse ? 'Salvesta' : 'Lisa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
