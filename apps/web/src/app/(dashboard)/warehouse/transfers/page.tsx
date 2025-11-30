'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowRight, CheckCircle, XCircle, Clock, Truck, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

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
        <Link href="/warehouse/transfers/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#279989' }}>
          <Plus className="h-4 w-4" /> Loo ülekanne
        </Link>
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
              <th className="text-left px-4 py-3 text-sm font-semibold">Kust → Kuhu</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Staatus</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Kuupäev</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8">Laadimine...</td></tr>
            ) : !data?.data?.length ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Ülekandeid ei leitud</td></tr>
            ) : data.data.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-sm">{t.transfer_number}</td>
                <td className="px-4 py-3">{t.asset?.name}</td>
                <td className="px-4 py-3 text-sm">{t.from_warehouse?.name || '-'} → {t.to_warehouse?.name || '-'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded-full bg-slate-100">{statusLabels[t.status] || t.status}</span></td>
                <td className="px-4 py-3 text-sm">{new Date(t.created_at).toLocaleDateString('et-EE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
