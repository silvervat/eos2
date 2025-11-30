'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ArrowRightLeft,
  Wrench,
  Download,
  Package,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  type: string;
  status: string;
  condition: string;
  quantity_available?: number;
  quantity_unit?: string;
  is_consumable: boolean;
  category?: {
    id: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
  };
  assigned_project?: {
    id: string;
    name: string;
  };
  next_maintenance_date?: string;
  photos?: Array<{
    id: string;
    thumbnail_url: string;
    is_primary: boolean;
  }>;
}

interface AssetsTableProps {
  onAssetClick?: (asset: Asset) => void;
  onCreateTransfer?: (assetId: string) => void;
  onScheduleMaintenance?: (assetId: string) => void;
}

export function AssetsTable({
  onAssetClick,
  onCreateTransfer,
  onScheduleMaintenance
}: AssetsTableProps) {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch assets
  const { data, isLoading, error } = useQuery({
    queryKey: ['warehouse-assets', debouncedSearch, warehouseFilter, statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('is_consumable', typeFilter === 'consumable' ? 'true' : 'false');

      const res = await fetch(`/api/warehouse/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const json = await res.json();
      return json.data;
    },
  });

  const warehouses = warehousesData || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
    },
  });

  // Handlers
  const handleDelete = async (assetId: string) => {
    if (confirm('Kas oled kindel, et soovid selle vara kustutada?')) {
      await deleteMutation.mutateAsync(assetId);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, selectedAssets);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssets.length === data?.data?.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(data?.data?.map((a: Asset) => a.id) || []);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant?: 'default' | 'outline' | 'destructive'; className?: string }> = {
      available: { className: 'bg-green-500 hover:bg-green-600' },
      in_use: { className: 'bg-blue-500 hover:bg-blue-600' },
      maintenance: { className: 'bg-yellow-500 hover:bg-yellow-600' },
      rented: { className: 'bg-purple-500 hover:bg-purple-600' },
      retired: { variant: 'outline' },
      lost: { variant: 'destructive' },
      damaged: { variant: 'destructive' },
    };

    const config = variants[status] || { variant: 'outline' };
    const labels: Record<string, string> = {
      available: 'Saadaval',
      in_use: 'Kasutuses',
      maintenance: 'Hoolduses',
      rented: 'Rendis',
      retired: 'Välja arvatud',
      lost: 'Kadunud',
      damaged: 'Kahjustatud',
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, { variant?: 'default' | 'outline' | 'destructive'; className?: string }> = {
      excellent: { className: 'bg-green-600 hover:bg-green-700' },
      good: { className: 'bg-green-500 hover:bg-green-600' },
      fair: { className: 'bg-yellow-500 hover:bg-yellow-600' },
      poor: { variant: 'destructive' },
    };

    const config = variants[condition] || { variant: 'outline' };
    const labels: Record<string, string> = {
      excellent: 'Suurepärane',
      good: 'Hea',
      fair: 'Rahuldav',
      poor: 'Halb',
    };

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className || ''}`}>
        {labels[condition] || condition}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Viga varade laadimisel</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Otsi vara (nimi, kood, seerianumber)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ladu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik laod</SelectItem>
            {warehouses?.map((w: { id: string; name: string }) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Staatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik staatused</SelectItem>
            <SelectItem value="available">Saadaval</SelectItem>
            <SelectItem value="in_use">Kasutuses</SelectItem>
            <SelectItem value="maintenance">Hoolduses</SelectItem>
            <SelectItem value="rented">Rendis</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tüüp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik tüübid</SelectItem>
            <SelectItem value="asset">Varad</SelectItem>
            <SelectItem value="consumable">Tükikaubad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedAssets.length} vara valitud
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('transfer')}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Loo ülekanne
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('qr')}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Prindi QR
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-4 w-4 mr-2" />
              Ekspordi
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={data?.data?.length > 0 && selectedAssets.length === data?.data?.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Kood</TableHead>
              <TableHead>Nimi</TableHead>
              <TableHead>Kategooria</TableHead>
              <TableHead>Ladu</TableHead>
              <TableHead>Staatus</TableHead>
              <TableHead>Seisukord</TableHead>
              <TableHead>Kogus</TableHead>
              <TableHead>Kasutaja/Projekt</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Laadimine...
                </TableCell>
              </TableRow>
            ) : !data?.data || data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Varasid ei leitud</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((asset: Asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="rounded"
                    />
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    <Link href={`/warehouse/assets/${asset.id}`} className="hover:underline">
                      {asset.asset_code}
                    </Link>
                  </TableCell>

                  <TableCell className="font-medium">
                    <Link href={`/warehouse/assets/${asset.id}`} className="hover:underline">
                      {asset.name}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {asset.category?.name || '-'}
                  </TableCell>

                  <TableCell>
                    {asset.warehouse?.name || '-'}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(asset.status)}
                  </TableCell>

                  <TableCell>
                    {getConditionBadge(asset.condition)}
                  </TableCell>

                  <TableCell>
                    {asset.is_consumable ? (
                      <span className="text-sm">
                        {asset.quantity_available} {asset.quantity_unit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {asset.assigned_user ? (
                      <div className="text-sm">
                        <div className="font-medium">{asset.assigned_user.full_name}</div>
                      </div>
                    ) : asset.assigned_project ? (
                      <div className="text-sm">
                        <div className="font-medium">{asset.assigned_project.name}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Tegevused</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link href={`/warehouse/assets/${asset.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Vaata
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Redigeeri
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onCreateTransfer?.(asset.id)}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Loo ülekanne
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onScheduleMaintenance?.(asset.id)}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Lisa hooldus
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <QrCode className="h-4 w-4 mr-2" />
                          Prindi QR kood
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Kustuta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Lehekülg {data.pagination.page} / {data.pagination.totalPages}
            {' '}(Kokku {data.pagination.total} vara)
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Eelmine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              Järgmine
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
