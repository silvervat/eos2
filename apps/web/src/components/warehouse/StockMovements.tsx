'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertCircle, Search, Package } from 'lucide-react';

interface StockMovement {
  id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'lost' | 'found' | 'damaged';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  notes?: string;
  created_at: string;
  warehouse?: { id: string; name: string };
  user?: { id: string; full_name: string };
}

interface StockMovementsProps {
  assetId: string;
  isConsumable?: boolean;
}

export function StockMovements({ assetId, isConsumable = true }: StockMovementsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    movement_type: 'in' as const,
    quantity: 1,
    reason: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: StockMovement[] }>({
    queryKey: ['stock-movements', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}/stock`);
      if (!res.ok) throw new Error('Failed to fetch stock movements');
      return res.json();
    },
    enabled: isConsumable,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/warehouse/assets/${assetId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create stock movement');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements', assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      setShowAddForm(false);
      setFormData({ movement_type: 'in', quantity: 1, reason: '', notes: '' });
    },
  });

  if (!isConsumable) {
    return (
      <div className="bg-slate-50 rounded-xl border p-6 text-center">
        <Package className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p className="text-slate-500">See vara ei ole tükikaup.</p>
        <p className="text-sm text-slate-400 mt-1">Laoseis kehtib ainult tükikaupadele.</p>
      </div>
    );
  }

  const movementTypeLabels: Record<string, string> = {
    in: 'Sissetulek',
    out: 'Väljaminek',
    adjustment: 'Korrigeerimine',
    transfer: 'Ülekanne',
    lost: 'Kadunud',
    found: 'Leitud',
    damaged: 'Kahjustatud',
  };

  const movementTypeIcons: Record<string, JSX.Element> = {
    in: <ArrowDownCircle className="h-4 w-4 text-green-500" />,
    out: <ArrowUpCircle className="h-4 w-4 text-red-500" />,
    adjustment: <RefreshCw className="h-4 w-4 text-blue-500" />,
    transfer: <RefreshCw className="h-4 w-4 text-purple-500" />,
    lost: <AlertCircle className="h-4 w-4 text-red-500" />,
    found: <Search className="h-4 w-4 text-green-500" />,
    damaged: <AlertCircle className="h-4 w-4 text-orange-500" />,
  };

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Laoseisu liikumised</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-white"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" /> Lisa liikumine
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 border-b bg-slate-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Liikumise tüüp</label>
              <select
                value={formData.movement_type}
                onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(movementTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kogus</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Põhjus</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Valikuline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Märkused</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Valikuline"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg text-white"
              style={{ backgroundColor: '#279989' }}
            >
              {createMutation.isPending ? 'Salvestan...' : 'Salvesta'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
            >
              Tühista
            </button>
          </div>
          {createMutation.error && (
            <p className="mt-2 text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </div>
      )}

      <div className="divide-y max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500">Laadimine...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>Liikumisi pole veel registreeritud</p>
          </div>
        ) : (
          data.data.map((movement) => (
            <div key={movement.id} className="p-4 hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {movementTypeIcons[movement.movement_type]}
                  <div>
                    <p className="font-medium">{movementTypeLabels[movement.movement_type]}</p>
                    {movement.reason && (
                      <p className="text-sm text-slate-500">{movement.reason}</p>
                    )}
                    {movement.notes && (
                      <p className="text-xs text-slate-400">{movement.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono">
                    <span className="text-slate-400">{movement.quantity_before}</span>
                    <span className="mx-2">→</span>
                    <span className="font-semibold">{movement.quantity_after}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(movement.created_at).toLocaleDateString('et-EE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {movement.user && (
                    <p className="text-xs text-slate-400">{movement.user.full_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
