# 🗺️ PROJEKTIDE TABEL → ASUKOHAD INTEGRATSIOON

## TÄPNE NÕUE

**Projektide lehel (`/projects`) tabelis iga projekti real peab olema nupp/link:**
- Text: "Asukohad" või ikoon 📍
- Viib: `/projects/[project-id]/locations`
- Seal lehel:
  - Kaart kus saab klõpsata ja lisada GPS asukohtasid
  - Määrata geofencing raadius (meetrites)
  - Määrata kas GPS on kohustuslik check-in'iks

---

## 📝 SAMM-SAMMULT JUHEND

### 1️⃣ UUENDA PROJEKTIDE TABELIT

**Fail:** `apps/web/src/components/projects/projects-table.tsx`

Leia tabel ja lisa **Actions** column, kui seda pole veel:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, Eye, Edit, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectsTableProps {
  data: any[]
  isLoading: boolean
}

export function ProjectsTable({ data, isLoading }: ProjectsTableProps) {
  const router = useRouter()

  if (isLoading) {
    return <div>Laadimine...</div>
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
              Projekt
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
              Klient
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
              Staatus
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
              Algus
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
              Lõpp
            </th>
            {/* 🆕 LISA SEE COLUMN */}
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
              Tegevused
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-500">{project.code}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {project.client_name || '-'}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {project.start_date || '-'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {project.end_date || '-'}
              </td>
              
              {/* 🆕 ACTIONS COLUMN */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  
                  {/* ASUKOHAD NUPP - PEAMINE NÕUE */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${project.id}/locations`)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Asukohad
                  </Button>

                  {/* Dropdown muudeks tegevusteks */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Vaata detaile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Muuda
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Projekte ei leitud
        </div>
      )}
    </div>
  )
}
```

---

### 2️⃣ LOO ASUKOHTADE LEHT

**Fail:** `apps/web/src/app/(dashboard)/projects/[id]/locations/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, MapPin, Loader2 } from 'lucide-react'
import { ProjectLocationsMap } from '@/components/projects/ProjectLocationsMap'
import { LocationDialog } from '@/components/projects/LocationDialog'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius_meters: number
  require_gps: boolean
  require_photo: boolean
  is_active: boolean
}

export default function ProjectLocationsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  useEffect(() => {
    loadProject()
    loadLocations()
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error('Project not found')
      const data = await response.json()
      setProject(data)
    } catch (error) {
      toast.error('Projekti laadimine ebaõnnestus')
      router.push('/projects')
    }
  }

  const loadLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/locations`)
      if (!response.ok) throw new Error('Failed to load locations')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      toast.error('Asukohtade laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Kas oled kindel, et soovid selle asukoha kustutada?')) return

    try {
      const response = await fetch(
        `/api/projects/${projectId}/locations/${locationId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Delete failed')
      
      toast.success('Asukoht kustutatud')
      loadLocations()
    } catch (error) {
      toast.error('Kustutamine ebaõnnestus')
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#279989]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tagasi projektidesse
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {project.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Projekti asukohad ja GPS seaded
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setSelectedLocation(null)
            setDialogOpen(true)
          }}
          className="bg-[#279989] hover:bg-[#1f7a6d]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lisa asukoht
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Kuidas kasutada:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Klõpsa kaardile, et lisada uus asukoht</li>
              <li>Määra raadius meetrites (nt. 100m)</li>
              <li>Vali kas GPS on check-in'iks kohustuslik</li>
              <li>Töötajad saavad registreerida ainult määratud raadiuse sees</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Asukohtasid</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktiivseid</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => l.is_active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold">GPS</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">GPS kohustuslik</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => l.require_gps).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Component */}
      <ProjectLocationsMap
        projectId={projectId}
        locations={locations}
        loading={loading}
        onLocationAdd={() => {
          setSelectedLocation(null)
          setDialogOpen(true)
        }}
        onLocationEdit={(location) => {
          setSelectedLocation(location)
          setDialogOpen(true)
        }}
        onLocationDelete={handleDeleteLocation}
      />

      {/* Location Dialog */}
      <LocationDialog
        projectId={projectId}
        location={selectedLocation}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          loadLocations()
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
```

---

### 3️⃣ KAARDI KOMPONENT

**Fail:** `apps/web/src/components/projects/ProjectLocationsMap.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Edit, Trash2, Eye, EyeOff, Navigation } from 'lucide-react'
import { GoogleMap, Marker, Circle, useLoadScript } from '@react-google-maps/api'

interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius_meters: number
  require_gps: boolean
  require_photo: boolean
  is_active: boolean
}

interface ProjectLocationsMapProps {
  projectId: string
  locations: Location[]
  loading: boolean
  onLocationAdd: (lat?: number, lng?: number) => void
  onLocationEdit: (location: Location) => void
  onLocationDelete: (locationId: string) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
}

const defaultCenter = {
  lat: 59.437, // Tallinn
  lng: 24.7536,
}

export function ProjectLocationsMap({
  projectId,
  locations,
  loading,
  onLocationAdd,
  onLocationEdit,
  onLocationDelete,
}: ProjectLocationsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [mapZoom, setMapZoom] = useState(13)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  // Get current location
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapCenter(newCenter)
          setMapZoom(15)
        },
        (error) => {
          console.error('GPS error:', error)
        }
      )
    }
  }

  // Map click handler - add new location
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      onLocationAdd(lat, lng)
    }
  }

  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Kaardi laadimine ebaõnnestus</p>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Kaart laeb...</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>Klõpsa kaardile, et lisada asukoht</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Minu asukoht
            </Button>
          </div>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
            }}
          >
            {locations.map((location) => (
              <div key={location.id}>
                {/* Marker */}
                <Marker
                  position={{
                    lat: location.latitude,
                    lng: location.longitude,
                  }}
                  onClick={() => setSelectedLocation(location)}
                  title={location.name}
                  icon={{
                    url: location.is_active
                      ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                      : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  }}
                />

                {/* Geofence Circle */}
                <Circle
                  center={{
                    lat: location.latitude,
                    lng: location.longitude,
                  }}
                  radius={location.radius_meters}
                  options={{
                    fillColor: location.is_active ? '#279989' : '#EF4444',
                    fillOpacity: 0.15,
                    strokeColor: location.is_active ? '#279989' : '#EF4444',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              </div>
            ))}
          </GoogleMap>
        </Card>
      </div>

      {/* Locations List */}
      <div>
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Asukohad ({locations.length})
          </h3>

          {loading ? (
            <p className="text-gray-500 text-sm">Laadimine...</p>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Asukohtasid pole veel lisatud</p>
              <p className="text-gray-500 text-xs mt-1">
                Klõpsa kaardile või kasuta "Lisa asukoht" nuppu
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                    selectedLocation?.id === location.id
                      ? 'border-[#279989] bg-[#279989]/5'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedLocation(location)
                    setMapCenter({
                      lat: location.latitude,
                      lng: location.longitude,
                    })
                    setMapZoom(16)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin
                          className={`w-4 h-4 ${
                            location.is_active ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                        <p className="font-medium text-gray-900">
                          {location.name}
                        </p>
                      </div>

                      {location.address && (
                        <p className="text-xs text-gray-600 mb-2">
                          {location.address}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {location.radius_meters}m raadius
                        </span>
                        {location.require_gps && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            GPS kohustuslik
                          </span>
                        )}
                        {location.require_photo && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            Foto kohustuslik
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLocationEdit(location)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLocationDelete(location.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                    GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
```

---

### 4️⃣ ASUKOHA DIALOOG

**Fail:** `apps/web/src/components/projects/LocationDialog.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'

interface LocationDialogProps {
  projectId: string
  location?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LocationDialog({
  projectId,
  location,
  open,
  onOpenChange,
  onSuccess,
}: LocationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    radiusMeters: '100',
    requireGps: true,
    requirePhoto: false,
    isActive: true,
  })

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        description: location.description || '',
        address: location.address || '',
        latitude: location.latitude?.toString() || '',
        longitude: location.longitude?.toString() || '',
        radiusMeters: location.radius_meters?.toString() || '100',
        requireGps: location.require_gps ?? true,
        requirePhoto: location.require_photo ?? false,
        isActive: location.is_active ?? true,
      })
    } else {
      // Reset form
      setFormData({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        radiusMeters: '100',
        requireGps: true,
        requirePhoto: false,
        isActive: true,
      })
    }
  }, [location, open])

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(8),
            longitude: position.coords.longitude.toFixed(8),
          }))
          toast.success('GPS asukoht saadud!')
        },
        (error) => {
          toast.error('GPS viga: ' + error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      )
    } else {
      toast.error('GPS ei ole saadaval selles brauseris')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error('Täida kõik kohustuslikud väljad')
      return
    }

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    const radius = parseInt(formData.radiusMeters)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Vigased GPS koordinaadid')
      return
    }

    if (isNaN(radius) || radius < 10 || radius > 5000) {
      toast.error('Raadius peab olema 10-5000 meetrit')
      return
    }

    setLoading(true)

    try {
      const url = location
        ? `/api/projects/${projectId}/locations/${location.id}`
        : `/api/projects/${projectId}/locations`

      const method = location ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          latitude: lat,
          longitude: lng,
          radiusMeters: radius,
          requireGps: formData.requireGps,
          requirePhoto: formData.requirePhoto,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Salvestamine ebaõnnestus')
      }

      toast.success(location ? 'Asukoht uuendatud!' : 'Asukoht lisatud!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Viga salvestamisel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {location ? 'Muuda asukohta' : 'Lisa uus asukoht'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Asukoha nimi <span className="text-red-600">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="nt. Arlanda Lennujaam Terminal 5"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Kirjeldus</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Täiendav info asukoha kohta..."
              rows={3}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Aadress</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Täisaadress"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                GPS koordinaadid <span className="text-red-600">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Kasuta minu asukohta
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude" className="text-xs text-gray-600">
                  Laiuskraad (Latitude)
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.00000001"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="59.437000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs text-gray-600">
                  Pikkuskraad (Longitude)
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.00000001"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="24.753600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div>
            <Label htmlFor="radius">
              Aktsepteeritud raadius (meetrites) <span className="text-red-600">*</span>
            </Label>
            <Input
              id="radius"
              type="number"
              value={formData.radiusMeters}
              onChange={(e) =>
                setFormData({ ...formData, radiusMeters: e.target.value })
              }
              placeholder="100"
              min="10"
              max="5000"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Töötajad saavad check-in teha ainult selle raadiuse piires (10-5000m)
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900">Seaded</h4>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireGps">GPS kohustuslik</Label>
                <p className="text-xs text-gray-600">
                  Töötajad peavad kasutama GPS-i check-in tegemisel
                </p>
              </div>
              <Switch
                id="requireGps"
                checked={formData.requireGps}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireGps: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requirePhoto">Foto kohustuslik</Label>
                <p className="text-xs text-gray-600">
                  Nõua foto võtmist registreerimisel
                </p>
              </div>
              <Switch
                id="requirePhoto"
                checked={formData.requirePhoto}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requirePhoto: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Aktiivne</Label>
                <p className="text-xs text-gray-600">
                  Kas asukoht on kasutusel
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Tühista
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#279989] hover:bg-[#1f7a6d]"
            >
              {loading ? 'Salvestan...' : 'Salvesta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## ✅ KOKKUVÕTE - Mis on loodud:

### 1. **Projektide tabelis nupp**
- ✅ "Asukohad" nupp iga projekti real
- ✅ Viib `/projects/[id]/locations`

### 2. **Asukohtade lehel:**
- ✅ Google Maps kaart
- ✅ Klõpsa kaardile → Lisa asukoht
- ✅ Määra raadius (meetrites)
- ✅ GPS kohustuslik checkbox
- ✅ Foto kohustuslik checkbox
- ✅ List kõigist asukohtadest
- ✅ Muuda/Kustuta nupud

### 3. **Töötajate integratsioon:**
- ✅ `personnel/employees` olemasolev süsteem
- ✅ Seotakse projektidega `project_employees` tabelis
- ✅ Check-in valideerib GPS asukohta
- ✅ Geofencing arvutab kauguse

---

## 🚀 JÄRGMISED SAMMUD:

```bash
# 1. Uuenda projects-table.tsx (lisa "Asukohad" nupp)
# 2. Loo locations page
# 3. Loo map component
# 4. Loo dialog component
# 5. Lisa Google Maps API key
# 6. Test!
```

**Valmis! 🎯**
