'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, QrCode, Warehouse as WarehouseIcon, FolderKanban, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTransferBasket } from '@/hooks/use-transfer-basket';

// Dynamically import scanner to avoid SSR issues with camera
const FastScanner = dynamic(
  () => import('@/components/warehouse/mobile/FastScanner').then(mod => ({ default: mod.FastScanner })),
  { ssr: false, loading: () => <ScannerLoading /> }
);

function ScannerLoading() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p>Kaamera laadimine...</p>
      </div>
    </div>
  );
}

type TransferDestination = 'project' | 'warehouse' | 'user';

export default function TransferPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TransferPageContent />
    </Suspense>
  );
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
    </div>
  );
}

function TransferPageContent() {
  const router = useRouter();
  const [destinationType, setDestinationType] = useState<TransferDestination>('project');
  const [destinationId, setDestinationId] = useState<string>('');
  const [fromWarehouseId, setFromWarehouseId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentBasketId, setCurrentBasketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { createBasket, isCreating } = useTransferBasket();

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      return res.json();
    },
  });

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['warehouse-projects'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
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

  const warehouses = warehousesData?.data || [];
  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const handleStartScanning = async () => {
    setError(null);

    if (!destinationId) {
      setError('Palun vali sihtkoht');
      return;
    }

    try {
      // Create a new basket
      const basketParams: {
        from_warehouse_id?: string;
        to_project_id?: string;
        to_warehouse_id?: string;
        to_user_id?: string;
      } = {};

      if (fromWarehouseId) {
        basketParams.from_warehouse_id = fromWarehouseId;
      }

      if (destinationType === 'project') {
        basketParams.to_project_id = destinationId;
      } else if (destinationType === 'warehouse') {
        basketParams.to_warehouse_id = destinationId;
      } else if (destinationType === 'user') {
        basketParams.to_user_id = destinationId;
      }

      const basket = await createBasket(basketParams);
      setCurrentBasketId(basket.id);
      setIsScanning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Korvi loomine ebaõnnestus');
    }
  };

  const handleScannerClose = () => {
    setIsScanning(false);
  };

  const handleTransferComplete = () => {
    setIsScanning(false);
    router.push('/warehouse/transfers');
  };

  // If scanning, show full-screen scanner
  if (isScanning && currentBasketId) {
    return (
      <FastScanner
        basketId={currentBasketId}
        onClose={handleScannerClose}
        onComplete={handleTransferComplete}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/warehouse" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiire ülekanne</h1>
          <p className="text-slate-600 text-sm mt-1">
            Skänni tooteid ja vii üle korraga
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Source warehouse (optional) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lähtladu (valikuline)</h2>
        <select
          value={fromWarehouseId}
          onChange={(e) => setFromWarehouseId(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
        >
          <option value="">Kõik laod</option>
          {warehouses.map((w: { id: string; name: string; code: string }) => (
            <option key={w.id} value={w.id}>
              {w.name} {w.code ? `(${w.code})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Destination type */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sihtkoha tüüp</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setDestinationType('project');
              setDestinationId('');
            }}
            className={`p-4 rounded-xl border-2 text-center transition-colors ${
              destinationType === 'project'
                ? 'border-[#279989] bg-[#279989]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <FolderKanban
              className={`h-8 w-8 mx-auto mb-2 ${
                destinationType === 'project' ? 'text-[#279989]' : 'text-slate-400'
              }`}
            />
            <p className="font-medium text-sm">Projekt</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setDestinationType('warehouse');
              setDestinationId('');
            }}
            className={`p-4 rounded-xl border-2 text-center transition-colors ${
              destinationType === 'warehouse'
                ? 'border-[#279989] bg-[#279989]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <WarehouseIcon
              className={`h-8 w-8 mx-auto mb-2 ${
                destinationType === 'warehouse' ? 'text-[#279989]' : 'text-slate-400'
              }`}
            />
            <p className="font-medium text-sm">Ladu</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setDestinationType('user');
              setDestinationId('');
            }}
            className={`p-4 rounded-xl border-2 text-center transition-colors ${
              destinationType === 'user'
                ? 'border-[#279989] bg-[#279989]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <User
              className={`h-8 w-8 mx-auto mb-2 ${
                destinationType === 'user' ? 'text-[#279989]' : 'text-slate-400'
              }`}
            />
            <p className="font-medium text-sm">Kasutaja</p>
          </button>
        </div>
      </div>

      {/* Destination selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {destinationType === 'project' && 'Vali projekt'}
          {destinationType === 'warehouse' && 'Vali sihtladu'}
          {destinationType === 'user' && 'Vali kasutaja'}
        </h2>

        {destinationType === 'project' && (
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            required
          >
            <option value="">Vali projekt...</option>
            {projects.map((p: { id: string; name: string; code?: string; project_number?: string }) => (
              <option key={p.id} value={p.id}>
                {p.code || p.project_number ? `${p.code || p.project_number} - ` : ''}{p.name}
              </option>
            ))}
          </select>
        )}

        {destinationType === 'warehouse' && (
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            required
          >
            <option value="">Vali ladu...</option>
            {warehouses
              .filter((w: { id: string }) => w.id !== fromWarehouseId)
              .map((w: { id: string; name: string; code: string }) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''}
                </option>
              ))}
          </select>
        )}

        {destinationType === 'user' && (
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            required
          >
            <option value="">Vali kasutaja...</option>
            {users.map((u: { id: string; full_name: string; email?: string }) => (
              <option key={u.id} value={u.id}>
                {u.full_name} {u.email ? `(${u.email})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Start scanning button */}
      <button
        onClick={handleStartScanning}
        disabled={!destinationId || isCreating}
        className={`w-full py-5 rounded-xl text-lg font-semibold flex items-center justify-center gap-3 transition-colors ${
          destinationId && !isCreating
            ? 'bg-[#279989] text-white hover:bg-[#1f7a6d]'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isCreating ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            Ettevalmistamine...
          </>
        ) : (
          <>
            <QrCode className="h-6 w-6" />
            Alusta skannimist
          </>
        )}
      </button>

      {/* Info text */}
      <div className="text-center text-sm text-slate-500 space-y-1">
        <p>Skänni QR-koode või vöötkoode järjest.</p>
        <p>Sama toote skannimine suurendab kogust.</p>
        <p>Kinnita ülekanne kui kõik tooted on korvis.</p>
      </div>
    </div>
  );
}
