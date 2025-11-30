'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ArrowRightLeft,
  Wrench,
  QrCode,
  Package,
  MapPin,
  User,
  FolderKanban,
  Calendar,
  Euro,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const { data: assetResponse, isLoading, error } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    enabled: !!assetId,
  });

  const asset = assetResponse?.data;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant?: 'default' | 'outline' | 'destructive'; className?: string }> = {
      available: { className: 'bg-green-500' },
      in_use: { className: 'bg-blue-500' },
      maintenance: { className: 'bg-yellow-500' },
      rented: { className: 'bg-purple-500' },
      retired: { variant: 'outline' },
      lost: { variant: 'destructive' },
      damaged: { variant: 'destructive' },
    };
    const labels: Record<string, string> = {
      available: 'Saadaval',
      in_use: 'Kasutuses',
      maintenance: 'Hoolduses',
      rented: 'Rendis',
      retired: 'Välja arvatud',
      lost: 'Kadunud',
      damaged: 'Kahjustatud',
    };
    const config = variants[status] || { variant: 'outline' };
    return <Badge variant={config.variant} className={config.className}>{labels[status] || status}</Badge>;
  };

  const getConditionBadge = (condition: string) => {
    const labels: Record<string, string> = {
      excellent: 'Suurepärane',
      good: 'Hea',
      fair: 'Rahuldav',
      poor: 'Halb',
    };
    return <Badge variant="outline">{labels[condition] || condition}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laadimine...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Vara ei leitud</h2>
          <p className="text-muted-foreground mb-4">Vara selle ID-ga ei eksisteeri</p>
          <Button asChild>
            <Link href="/warehouse/assets">Tagasi varade juurde</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/warehouse/assets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              {getStatusBadge(asset.status)}
              {getConditionBadge(asset.condition)}
            </div>
            <p className="text-muted-foreground font-mono">{asset.asset_code}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR kood
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Loo ülekanne
          </Button>
          <Button variant="outline" size="sm">
            <Wrench className="h-4 w-4 mr-2" />
            Lisa hooldus
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Muuda
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Kustuta
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Ülevaade</TabsTrigger>
              <TabsTrigger value="history">Ajalugu</TabsTrigger>
              <TabsTrigger value="photos">Fotod</TabsTrigger>
              <TabsTrigger value="maintenance">Hooldused</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Põhiandmed</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kategooria</p>
                      <p className="font-medium">{asset.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tüüp</p>
                      <p className="font-medium">
                        {asset.type === 'asset' ? 'Vara' :
                         asset.type === 'consumable' ? 'Tükikaup' :
                         asset.type === 'tool' ? 'Tööriist' : asset.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tootja</p>
                      <p className="font-medium">{asset.manufacturer || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mudel</p>
                      <p className="font-medium">{asset.model || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seerianumber</p>
                      <p className="font-medium font-mono">{asset.serial_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Triipkood</p>
                      <p className="font-medium font-mono">{asset.barcode || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {asset.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Kirjeldus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{asset.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Consumable Info */}
                {asset.is_consumable && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Laoseis</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Saadaval</p>
                        <p className="font-medium text-lg">{asset.quantity_available} {asset.quantity_unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reserveeritud</p>
                        <p className="font-medium">{asset.quantity_reserved || 0} {asset.quantity_unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min kogus</p>
                        <p className="font-medium">{asset.min_quantity || '-'} {asset.quantity_unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tellimispunkt</p>
                        <p className="font-medium">{asset.reorder_point || '-'} {asset.quantity_unit}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Financial Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Finantside andmed</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ostuhind</p>
                      <p className="font-medium">{asset.purchase_price ? `${asset.purchase_price} €` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Praegune väärtus</p>
                      <p className="font-medium">{asset.current_value ? `${asset.current_value} €` : '-'}</p>
                    </div>
                    {asset.is_consumable && (
                      <div>
                        <p className="text-sm text-muted-foreground">Keskmine hind</p>
                        <p className="font-medium">{asset.average_price ? `${asset.average_price} €` : '-'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ajalugu pole veel saadaval</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Fotosid pole veel lisatud</p>
                  <Button variant="outline" className="mt-4">
                    Lisa foto
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hooldusi pole veel lisatud</p>
                  <Button variant="outline" className="mt-4">
                    Lisa hooldus
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Asukoht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{asset.warehouse?.name || 'Määramata'}</p>
              {asset.location?.path && (
                <p className="text-sm text-muted-foreground">{asset.location.path}</p>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          {(asset.assigned_user || asset.assigned_project) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {asset.assigned_user ? <User className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
                  Määratud
                </CardTitle>
              </CardHeader>
              <CardContent>
                {asset.assigned_user && (
                  <div>
                    <p className="font-medium">{asset.assigned_user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{asset.assigned_user.email}</p>
                  </div>
                )}
                {asset.assigned_project && (
                  <div>
                    <p className="font-medium">{asset.assigned_project.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{asset.assigned_project.code}</p>
                  </div>
                )}
                {asset.assigned_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Alates {new Date(asset.assigned_at).toLocaleDateString('et-EE')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Maintenance */}
          {asset.requires_maintenance && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Hooldus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Järgmine hooldus</p>
                    <p className="font-medium">
                      {asset.next_maintenance_date
                        ? new Date(asset.next_maintenance_date).toLocaleDateString('et-EE')
                        : 'Määramata'}
                    </p>
                  </div>
                  {asset.last_maintenance_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Viimane hooldus</p>
                      <p className="font-medium">
                        {new Date(asset.last_maintenance_date).toLocaleDateString('et-EE')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Kuupäevad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {asset.purchase_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ostetud</span>
                  <span>{new Date(asset.purchase_date).toLocaleDateString('et-EE')}</span>
                </div>
              )}
              {asset.warranty_expires_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Garantii lõpeb</span>
                  <span>{new Date(asset.warranty_expires_at).toLocaleDateString('et-EE')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lisatud</span>
                <span>{new Date(asset.created_at).toLocaleDateString('et-EE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uuendatud</span>
                <span>{new Date(asset.updated_at).toLocaleDateString('et-EE')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
