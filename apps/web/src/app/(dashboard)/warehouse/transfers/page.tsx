'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, QrCode, Warehouse, User, FolderKanban } from 'lucide-react';
import Link from 'next/link';

// Helper to get destination display
function getDestination(t: any): { name: string; type: string; icon: React.ReactNode } {
  if (t.to_warehouse?.name) {
    return { name: t.to_warehouse.name, type: 'Ladu', icon: <Warehouse className="h-4 w-4 text-blue-500" /> };
  }
  if (t.to_project?.name) {
    return { name: t.to_project.name, type: 'Projekt', icon: <FolderKanban className="h-4 w-4 text-green-500" /> };
  }
  if (t.to_user?.full_name) {
    return { name: t.to_user.full_name, type: 'Kasutaja', icon: <User className="h-4 w-4 text-purple-500" /> };
  }
  return { name: '-', type: '', icon: null };
}

// Status badge colors
function getStatusStyle(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'in_transit': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-transfers', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/warehouse/transfers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    },
  });

  const statusLabels: Record<string, string> = {
    pending: 'Ootel', approved: 'Kinnitatud', in_transit: 'Teel',
    delivered: 'Kohale toimetatud', rejected: 'Tagasi lükatud', cancelled: 'Tühistatud'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ülekanded</h1>
          <p className="text-slate-600 text-sm">Varade liigutamine</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/warehouse/transfer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#279989] text-[#279989] hover:bg-[#279989]/5"
          >
            <QrCode className="h-4 w-4" /> Kiire skannimine
          </Link>
          <Link
            href="/warehouse/transfers/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" /> Loo ülekanne
          </Link>
        </div>
      </div>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
        <option value="all">Kõik staatused</option>
        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">Nr</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Vara</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Kogus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Kust</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Kuhu</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Staatus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Kuupäev</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8">Laadimine...</td></tr>
            ) : !data?.data?.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Ülekandeid ei leitud</td></tr>
            ) : data.data.map((t: any) => {
              const dest = getDestination(t);
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm">{t.transfer_number}</td>
                  <td className="px-4 py-3">{t.asset?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{t.quantity || 1}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Warehouse className="h-4 w-4 text-slate-400" />
                      {t.from_warehouse?.name || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      {dest.icon}
                      <span>{dest.name}</span>
                      {dest.type && <span className="text-xs text-slate-400">({dest.type})</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(t.status)}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(t.created_at).toLocaleDateString('et-EE')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
