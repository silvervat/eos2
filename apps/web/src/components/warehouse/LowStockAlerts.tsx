'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LowStockItem {
  id: string;
  name: string;
  asset_code: string;
  quantity_available: number;
  reorder_point: number;
  min_quantity: number;
  stock_percent: number;
  shortage: number;
  urgency: 'critical' | 'warning' | 'low';
  warehouse?: { id: string; name: string };
  category?: { id: string; name: string };
}

interface LowStockResponse {
  data: LowStockItem[];
  summary: {
    total: number;
    critical: number;
    warning: number;
  };
}

interface LowStockAlertsProps {
  warehouseId?: string;
  compact?: boolean;
  limit?: number;
}

export function LowStockAlerts({ warehouseId, compact = false, limit }: LowStockAlertsProps) {
  const { data, isLoading } = useQuery<LowStockResponse>({
    queryKey: ['low-stock', warehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouse_id', warehouseId);
      const res = await fetch(`/api/warehouse/assets/low-stock?${params}`);
      if (!res.ok) throw new Error('Failed to fetch low stock items');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const items = limit ? data?.data?.slice(0, limit) : data?.data;

  if (!items?.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Laoseis korras</h3>
        </div>
        <p className="text-slate-500 text-sm">Ühtegi toodet pole madalal laoseisel.</p>
      </div>
    );
  }

  const urgencyColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const urgencyLabels = {
    critical: 'Kriitiline',
    warning: 'Hoiatus',
    low: 'Madal',
  };

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Madal laoseis</h3>
          {data?.summary && (
            <div className="flex gap-2 text-xs">
              {data.summary.critical > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {data.summary.critical} kriitilist
                </span>
              )}
              {data.summary.warning > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {data.summary.warning} hoiatust
                </span>
              )}
            </div>
          )}
        </div>
        {!compact && (
          <Link href="/warehouse/assets?filter=low-stock" className="text-sm text-primary hover:underline flex items-center gap-1">
            Vaata kõiki <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-slate-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/warehouse/assets/${item.id}`} className="font-medium hover:text-primary">
                  {item.name}
                </Link>
                <p className="text-xs text-slate-500 font-mono">{item.asset_code}</p>
                {item.warehouse && !compact && (
                  <p className="text-xs text-slate-400 mt-1">{item.warehouse.name}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full border ${urgencyColors[item.urgency]}`}>
                  {urgencyLabels[item.urgency]}
                </span>
                <div className="mt-2 text-sm">
                  <span className="font-semibold text-slate-900">{item.quantity_available}</span>
                  <span className="text-slate-400"> / {item.reorder_point}</span>
                </div>
                <p className="text-xs text-slate-500">Puudu: {item.shortage}</p>
              </div>
            </div>
            {!compact && (
              <div className="mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.urgency === 'critical' ? 'bg-red-500' :
                      item.urgency === 'warning' ? 'bg-amber-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(item.stock_percent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {limit && data?.data && data.data.length > limit && (
        <div className="p-3 border-t bg-slate-50 text-center">
          <Link href="/warehouse/assets?filter=low-stock" className="text-sm text-primary hover:underline">
            Vaata veel {data.data.length - limit} toodet
          </Link>
        </div>
      )}
    </div>
  );
}
