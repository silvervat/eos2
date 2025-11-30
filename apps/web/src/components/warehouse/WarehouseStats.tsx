'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@rivest/ui';
import {
  Package,
  PackageCheck,
  PackageX,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';

interface StatsProps {
  warehouseId?: string;
}

export function WarehouseStats({ warehouseId }: StatsProps) {
  const { data: assetsData } = useQuery({
    queryKey: ['warehouse-stats', warehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouse_id', warehouseId);

      const res = await fetch(`/api/warehouse/assets?${params}&limit=1000`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const { data: transfersData } = useQuery({
    queryKey: ['warehouse-transfers-pending'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/transfers?status=pending&limit=100');
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    },
  });

  // Calculate stats from assets
  const assets = assetsData?.data || [];
  const transfers = transfersData?.data || [];

  const totalAssets = assets.length;
  const availableAssets = assets.filter((a: any) => a.status === 'available').length;
  const inUseAssets = assets.filter((a: any) => a.status === 'in_use').length;
  const maintenanceAssets = assets.filter((a: any) => a.status === 'maintenance').length;
  const lowStockAssets = assets.filter((a: any) =>
    a.is_consumable && a.quantity_available <= (a.reorder_point || 0)
  ).length;
  const pendingTransfers = transfers.length;

  const totalValue = assets.reduce((sum: number, a: any) =>
    sum + (a.current_value || a.purchase_price || 0), 0
  );

  // Find assets needing maintenance
  const today = new Date();
  const upcomingMaintenance = assets.filter((a: any) => {
    if (!a.next_maintenance_date) return false;
    const maintenanceDate = new Date(a.next_maintenance_date);
    const daysUntil = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  }).length;

  const stats = [
    {
      title: 'Kokku varasid',
      value: totalAssets,
      icon: Package,
      description: 'Kõik varad süsteemis',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Saadaval',
      value: availableAssets,
      icon: PackageCheck,
      description: 'Valmis kasutamiseks',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Kasutuses',
      value: inUseAssets,
      icon: PackageX,
      description: 'Praegu kasutuses',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Hoolduses',
      value: maintenanceAssets,
      icon: Wrench,
      description: 'Hoolduse ootel',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Koguväärtus',
      value: `${totalValue.toLocaleString('et-EE')} €`,
      icon: TrendingUp,
      description: 'Varade väärtus',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Madal laoseis',
      value: lowStockAssets,
      icon: AlertTriangle,
      description: 'Vajab tellimist',
      color: lowStockAssets > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: lowStockAssets > 0 ? 'bg-red-100' : 'bg-gray-100',
    },
    {
      title: 'Ootel ülekanded',
      value: pendingTransfers,
      icon: ArrowRightLeft,
      description: 'Kinnitamist ootavad',
      color: pendingTransfers > 0 ? 'text-purple-600' : 'text-gray-600',
      bgColor: pendingTransfers > 0 ? 'bg-purple-100' : 'bg-gray-100',
    },
    {
      title: 'Tulev hooldus',
      value: upcomingMaintenance,
      icon: Clock,
      description: 'Järgmise 30 päeva jooksul',
      color: upcomingMaintenance > 0 ? 'text-amber-600' : 'text-gray-600',
      bgColor: upcomingMaintenance > 0 ? 'bg-amber-100' : 'bg-gray-100',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">{stat.title}</span>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
