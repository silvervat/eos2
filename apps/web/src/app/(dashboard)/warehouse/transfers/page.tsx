'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-transfers', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/warehouse/transfers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      pending: {
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Ootel',
        className: 'bg-yellow-500',
      },
      approved: {
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Kinnitatud',
        className: 'bg-blue-500',
      },
      in_transit: {
        icon: <Truck className="h-3 w-3 mr-1" />,
        label: 'Teel',
        className: 'bg-purple-500',
      },
      delivered: {
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Kohale toimetatud',
        className: 'bg-green-500',
      },
      rejected: {
        icon: <XCircle className="h-3 w-3 mr-1" />,
        label: 'Tagasi lükatud',
        className: 'bg-red-500',
      },
      cancelled: {
        icon: <XCircle className="h-3 w-3 mr-1" />,
        label: 'Tühistatud',
        className: 'bg-gray-500',
      },
    };

    const statusConfig = config[status] || { icon: null, label: status, className: '' };

    return (
      <Badge className={`flex items-center ${statusConfig.className}`}>
        {statusConfig.icon}
        {statusConfig.label}
      </Badge>
    );
  };

  const getTransferTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      warehouse: 'Laost lattu',
      user: 'Kasutajale',
      project: 'Projektile',
      rental_out: 'Rent välja',
      rental_return: 'Rent tagasi',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ülekanded</h1>
          <p className="text-muted-foreground">
            Varade liigutamine ladude, kasutajate ja projektide vahel
          </p>
        </div>

        <Button asChild>
          <Link href="/warehouse/transfers/new">
            <Plus className="h-4 w-4 mr-2" />
            Loo ülekanne
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Staatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kõik staatused</SelectItem>
            <SelectItem value="pending">Ootel</SelectItem>
            <SelectItem value="approved">Kinnitatud</SelectItem>
            <SelectItem value="in_transit">Teel</SelectItem>
            <SelectItem value="delivered">Kohale toimetatud</SelectItem>
            <SelectItem value="rejected">Tagasi lükatud</SelectItem>
            <SelectItem value="cancelled">Tühistatud</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ülekande nr</TableHead>
              <TableHead>Vara</TableHead>
              <TableHead>Tüüp</TableHead>
              <TableHead>Kust → Kuhu</TableHead>
              <TableHead>Staatus</TableHead>
              <TableHead>Taotleja</TableHead>
              <TableHead>Kuupäev</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Laadimine...
                </TableCell>
              </TableRow>
            ) : !data?.data || data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ülekandeid ei leitud</p>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((transfer: any) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/warehouse/transfers/${transfer.id}`} className="hover:underline">
                      {transfer.transfer_number}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{transfer.asset?.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {transfer.asset?.asset_code}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getTransferTypeBadge(transfer.transfer_type)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{transfer.from_warehouse?.name || transfer.from_user?.full_name || '-'}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{transfer.to_warehouse?.name || transfer.to_user?.full_name || '-'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(transfer.status)}
                  </TableCell>

                  <TableCell>
                    {transfer.requested_by?.full_name || '-'}
                  </TableCell>

                  <TableCell>
                    {new Date(transfer.created_at).toLocaleDateString('et-EE')}
                  </TableCell>

                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/warehouse/transfers/${transfer.id}`}>
                        Vaata
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Lehekülg {data.pagination.page} / {data.pagination.totalPages}
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
