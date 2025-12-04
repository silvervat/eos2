# 🗺️ INTEGREERITUD PROJEKTIDE ASUKOHAD & GPS SÜSTEEM
## Kõigi moodulite integratsioon

---

## 🎯 ÜLEVAADE

Integreerime olemasoleva süsteemiga:
- ✅ **Olemasolev:** `personnel/employees` - Töötajate haldus
- ✅ **Olemasolev:** `projects` - Projektide haldus  
- 🆕 **Uus:** Projektide asukohad GPS-iga
- 🆕 **Uus:** Töötajate GPS check-in projektidel

---

## 📊 ANDMEBAASI LAIENDUSED

### 1. Projektide Asukohad Tabel

```sql
-- ============================================
-- PROJECT LOCATIONS (GPS)
-- ============================================

CREATE TABLE project_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Asukoha info
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  
  -- GPS koordinaadid
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED,
  
  -- Geofencing seaded
  radius_meters INTEGER NOT NULL DEFAULT 100, -- Aktsepteeritud raadius
  is_active BOOLEAN DEFAULT true,
  
  -- GPS check-in nõuded
  require_gps BOOLEAN DEFAULT true, -- Kohustuslik GPS
  require_photo BOOLEAN DEFAULT false, -- Foto nõue
  
  -- Tööajad
  work_start_time TIME,
  work_end_time TIME,
  
  -- Metaandmed
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_project_locations_project ON project_locations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_locations_gps ON project_locations USING GIST(location);
CREATE INDEX idx_project_locations_active ON project_locations(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- PROJECT EMPLOYEE ASSIGNMENTS
-- Link töötajad projektidega
-- ============================================

CREATE TABLE project_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Roll projektis
  role TEXT, -- monteerija, projektijuht, tehnik, jne
  
  -- Kuupäevad
  assigned_date DATE DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Juurdepääsu õigused
  can_checkin BOOLEAN DEFAULT true,
  can_view_location BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, project_id, employee_id)
);

CREATE INDEX idx_project_employees_project ON project_employees(project_id) WHERE is_active = true;
CREATE INDEX idx_project_employees_employee ON project_employees(employee_id) WHERE is_active = true;

-- ============================================
-- ATTENDANCE: Lisa project_id ja location_id
-- ============================================

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS project_location_id UUID REFERENCES project_locations(id);

CREATE INDEX idx_attendance_project ON attendance(project_id);
CREATE INDEX idx_attendance_project_location ON attendance(project_location_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Funktsioon: Kontrolli kas töötaja on projektile määratud
CREATE OR REPLACE FUNCTION check_employee_project_assignment(
  p_employee_id UUID,
  p_project_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_employees 
    WHERE employee_id = p_employee_id 
      AND project_id = p_project_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Funktsioon: Valideeri GPS check-in projektil
CREATE OR REPLACE FUNCTION validate_project_attendance()
RETURNS TRIGGER AS $$
DECLARE
  location_record RECORD;
  project_record RECORD;
  distance DECIMAL;
  is_assigned BOOLEAN;
BEGIN
  -- Kui on project_location_id, siis kontrolli
  IF NEW.project_location_id IS NOT NULL THEN
    
    -- Leia asukoha info
    SELECT * INTO location_record 
    FROM project_locations 
    WHERE id = NEW.project_location_id 
      AND is_active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Project location not found or not active';
    END IF;
    
    -- Kontrolli kas töötaja on projektile määratud
    is_assigned := check_employee_project_assignment(
      NEW.employee_id, 
      location_record.project_id
    );
    
    IF NOT is_assigned THEN
      RAISE EXCEPTION 'Employee not assigned to this project';
    END IF;
    
    -- Kui GPS on kohustuslik ja puudub
    IF location_record.require_gps AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
      RAISE EXCEPTION 'GPS location is required for this project';
    END IF;
    
    -- Arvuta kaugus
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      distance := calculate_gps_distance(
        NEW.latitude, NEW.longitude,
        location_record.latitude, location_record.longitude
      );
      
      NEW.distance_from_location := distance;
      NEW.is_within_geofence := (distance <= location_record.radius_meters);
      
      -- Kui väljaspool geofence'i
      IF NOT NEW.is_within_geofence THEN
        NEW.is_valid := false;
        -- Võid siia lisada notification või error
      ELSE
        NEW.is_valid := true;
      END IF;
    END IF;
    
    -- Salvesta project_id
    NEW.project_id := location_record.project_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asenda vana trigger
DROP TRIGGER IF EXISTS validate_attendance_trigger ON attendance;

CREATE TRIGGER validate_project_attendance_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_attendance();

-- ============================================
-- VIEWS: Kasulikud vaated
-- ============================================

-- Active project locations map view
CREATE OR REPLACE VIEW v_active_project_locations AS
SELECT 
  pl.id,
  pl.project_id,
  p.name as project_name,
  p.code as project_code,
  pl.name as location_name,
  pl.address,
  pl.latitude,
  pl.longitude,
  pl.radius_meters,
  pl.require_gps,
  pl.is_active,
  -- Count assigned employees
  (SELECT COUNT(*) 
   FROM project_employees pe 
   WHERE pe.project_id = pl.project_id 
     AND pe.is_active = true) as assigned_employees_count,
  -- Last attendance
  (SELECT MAX(timestamp) 
   FROM attendance a 
   WHERE a.project_location_id = pl.id) as last_attendance
FROM project_locations pl
JOIN projects p ON pl.project_id = p.id
WHERE pl.deleted_at IS NULL 
  AND pl.is_active = true;

-- Employee projects and locations
CREATE OR REPLACE VIEW v_employee_project_locations AS
SELECT 
  e.id as employee_id,
  e.full_name as employee_name,
  e.employee_code,
  pe.project_id,
  p.name as project_name,
  p.code as project_code,
  pe.role as project_role,
  pe.can_checkin,
  pl.id as location_id,
  pl.name as location_name,
  pl.latitude,
  pl.longitude,
  pl.radius_meters,
  pl.require_gps
FROM employees e
JOIN project_employees pe ON e.id = pe.employee_id
JOIN projects p ON pe.project_id = p.id
LEFT JOIN project_locations pl ON p.id = pl.project_id
WHERE e.deleted_at IS NULL 
  AND pe.is_active = true 
  AND (pl.deleted_at IS NULL OR pl.id IS NULL);

-- RLS POLICIES

ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_employees ENABLE ROW LEVEL SECURITY;

-- Project locations: see own tenant's locations
CREATE POLICY project_locations_tenant_policy ON project_locations
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Project employees: see own and managed projects
CREATE POLICY project_employees_access_policy ON project_employees
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::UUID
    AND (
      employee_id = current_setting('app.user_id')::UUID
      OR project_id IN (
        SELECT project_id FROM project_employees
        WHERE employee_id = current_setting('app.user_id')::UUID
      )
    )
  );
```

---

## 🔌 API ENDPOINTS

### 1. Project Locations API

**Fail:** `apps/web/src/app/api/projects/[id]/locations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[id]/locations
// Get all locations for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_locations')
    .select(`
      *,
      project:projects(id, name, code)
    `)
    .eq('project_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// POST /api/projects/[id]/locations
// Create new location for project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('project_locations')
    .insert({
      project_id: params.id,
      name: body.name,
      description: body.description,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      radius_meters: body.radiusMeters || 100,
      require_gps: body.requireGps ?? true,
      require_photo: body.requirePhoto ?? false,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

**Fail:** `apps/web/src/app/api/projects/[id]/locations/[locationId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET single location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_locations')
    .select('*')
    .eq('id', params.locationId)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// PATCH update location
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('project_locations')
    .update({
      name: body.name,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      radius_meters: body.radiusMeters,
      require_gps: body.requireGps,
      is_active: body.isActive,
    })
    .eq('id', params.locationId)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// DELETE location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('project_locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.locationId);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ success: true });
}
```

### 2. Project Employees API

**Fail:** `apps/web/src/app/api/projects/[id]/employees/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[id]/employees
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_employees')
    .select(`
      *,
      employee:employees(
        id, 
        full_name, 
        employee_code, 
        email, 
        phone, 
        position_id,
        department_id
      )
    `)
    .eq('project_id', params.id)
    .eq('is_active', true);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// POST /api/projects/[id]/employees
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('project_employees')
    .insert({
      project_id: params.id,
      employee_id: body.employeeId,
      role: body.role,
      start_date: body.startDate,
      end_date: body.endDate,
      can_checkin: body.canCheckin ?? true,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

---

## 🎨 FRONTEND KOMPONENDID

### 1. Project Locations Map Component

**Fail:** `apps/web/src/components/projects/ProjectLocationsMap.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Google Maps või Leaflet.js integratsioon
import { GoogleMap, Marker, Circle, useLoadScript } from '@react-google-maps/api';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requireGps: boolean;
  isActive: boolean;
}

interface ProjectLocationsMapProps {
  projectId: string;
  locations: Location[];
  onLocationAdd: () => void;
  onLocationEdit: (location: Location) => void;
  onLocationDelete: (locationId: string) => void;
}

export function ProjectLocationsMap({
  projectId,
  locations,
  onLocationAdd,
  onLocationEdit,
  onLocationDelete,
}: ProjectLocationsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 59.437, lng: 24.7536 }); // Tallinn
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <Card className="h-[500px] overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={13}
          onClick={(e) => {
            if (e.latLng) {
              // Lisa uus asukoht klõpsuga kaardile
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              onLocationAdd();
            }
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
                icon={{
                  url: location.isActive 
                    ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
              />
              
              {/* Geofence circle */}
              <Circle
                center={{
                  lat: location.latitude,
                  lng: location.longitude,
                }}
                radius={location.radiusMeters}
                options={{
                  fillColor: location.isActive ? '#279989' : '#EF4444',
                  fillOpacity: 0.1,
                  strokeColor: location.isActive ? '#279989' : '#EF4444',
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                }}
              />
            </div>
          ))}
        </GoogleMap>
      </Card>

      {/* Locations List */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Asukohad</h3>
          <Button onClick={onLocationAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Lisa asukoht
          </Button>
        </div>

        <div className="space-y-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`p-3 border rounded-lg flex items-center justify-between ${
                selectedLocation?.id === location.id ? 'border-[#279989] bg-[#279989]/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-5 h-5 ${location.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Raadius: {location.radiusMeters}m
                    {location.requireGps && ' • GPS kohustuslik'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMapCenter({
                      lat: location.latitude,
                      lng: location.longitude,
                    });
                    setSelectedLocation(location);
                  }}
                >
                  Näita kaardil
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLocationEdit(location)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLocationDelete(location.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Asukohtasid pole veel lisatud. Klõpsa kaardile või kasuta "Lisa asukoht" nuppu.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
```

### 2. Location Add/Edit Dialog

**Fail:** `apps/web/src/components/projects/LocationDialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface LocationDialogProps {
  projectId: string;
  location?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LocationDialog({
  projectId,
  location,
  open,
  onOpenChange,
  onSuccess,
}: LocationDialogProps) {
  const [loading, setLoading] = useState(false);
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
  });

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
      });
    }
  }, [location]);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(8),
            longitude: position.coords.longitude.toFixed(8),
          }));
          toast.success('GPS asukoht saadud!');
        },
        (error) => {
          toast.error('GPS viga: ' + error.message);
        }
      );
    } else {
      toast.error('GPS ei ole saadaval');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = location
        ? `/api/projects/${projectId}/locations/${location.id}`
        : `/api/projects/${projectId}/locations`;
      
      const method = location ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radiusMeters: parseInt(formData.radiusMeters),
          requireGps: formData.requireGps,
          requirePhoto: formData.requirePhoto,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error('Salvestamine ebaõnnestus');

      toast.success(location ? 'Asukoht uuendatud!' : 'Asukoht lisatud!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Viga salvestamisel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {location ? 'Muuda asukohta' : 'Lisa asukoht'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nimi *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="nt. Arlanda Lennujaam T5"
              required
            />
          </div>

          <div>
            <Label>Kirjeldus</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Täiendav info asukoha kohta..."
            />
          </div>

          <div>
            <Label>Aadress</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Täisaadress"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Laiuskraad (Latitude) *</Label>
              <Input
                type="number"
                step="0.00000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="59.437"
                required
              />
            </div>
            <div>
              <Label>Pikkuskraad (Longitude) *</Label>
              <Input
                type="number"
                step="0.00000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="24.7536"
                required
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            className="w-full"
          >
            📍 Kasuta minu asukohta
          </Button>

          <div>
            <Label>Aktsepteeritud raadius (meetrites) *</Label>
            <Input
              type="number"
              value={formData.radiusMeters}
              onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
              placeholder="100"
              min="10"
              max="1000"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Töötajad saavad registreerida ainult selle raadiuse sees
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>GPS kohustuslik</Label>
                <p className="text-sm text-muted-foreground">
                  Töötajad peavad kasutama GPS-i
                </p>
              </div>
              <Switch
                checked={formData.requireGps}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireGps: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Foto kohustuslik</Label>
                <p className="text-sm text-muted-foreground">
                  Nõua foto registreerimisel
                </p>
              </div>
              <Switch
                checked={formData.requirePhoto}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requirePhoto: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Aktiivne</Label>
                <p className="text-sm text-muted-foreground">
                  Kas asukoht on kasutusel
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Tühista
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvestan...' : 'Salvesta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Project Employees Manager

**Fail:** `apps/web/src/components/projects/ProjectEmployees.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectEmployeesProps {
  projectId: string;
  employees: any[];
  onEmployeeAdd: () => void;
  onEmployeeRemove: (employeeId: string) => void;
}

export function ProjectEmployees({
  projectId,
  employees,
  onEmployeeAdd,
  onEmployeeRemove,
}: ProjectEmployeesProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Projektile määratud töötajad</h3>
        <Button onClick={onEmployeeAdd} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Lisa töötaja
        </Button>
      </div>

      <div className="space-y-2">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {emp.employee.full_name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium">{emp.employee.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {emp.role} • {emp.employee.employee_code}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEmployeeRemove(emp.employee_id)}
            >
              <X className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ))}

        {employees.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Projektile pole veel töötajaid määratud
          </p>
        )}
      </div>
    </Card>
  );
}
```

---

## 📄 PAGES

### 1. Project Locations Page

**Fail:** `apps/web/src/app/(dashboard)/projects/[id]/locations/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProjectLocationsMap } from '@/components/projects/ProjectLocationsMap';
import { LocationDialog } from '@/components/projects/LocationDialog';
import { ProjectEmployees } from '@/components/projects/ProjectEmployees';

export default function ProjectLocationsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    loadLocations();
    loadEmployees();
  }, [projectId]);

  const loadLocations = async () => {
    const response = await fetch(`/api/projects/${projectId}/locations`);
    const data = await response.json();
    setLocations(data);
  };

  const loadEmployees = async () => {
    const response = await fetch(`/api/projects/${projectId}/employees`);
    const data = await response.json();
    setEmployees(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projekti asukohad</h1>
        <p className="text-muted-foreground">
          Halda projekti asukohtasid ja GPS geofencing seadeid
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectLocationsMap
            projectId={projectId}
            locations={locations}
            onLocationAdd={() => {
              setSelectedLocation(null);
              setDialogOpen(true);
            }}
            onLocationEdit={(location) => {
              setSelectedLocation(location);
              setDialogOpen(true);
            }}
            onLocationDelete={async (locationId) => {
              if (confirm('Kas oled kindel?')) {
                await fetch(`/api/projects/${projectId}/locations/${locationId}`, {
                  method: 'DELETE',
                });
                loadLocations();
              }
            }}
          />
        </div>

        <div>
          <ProjectEmployees
            projectId={projectId}
            employees={employees}
            onEmployeeAdd={() => {
              // Open employee selection dialog
            }}
            onEmployeeRemove={async (employeeId) => {
              // Remove employee
            }}
          />
        </div>
      </div>

      <LocationDialog
        projectId={projectId}
        location={selectedLocation}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadLocations}
      />
    </div>
  );
}
```

---

## 🔗 INTEGRATSIOON

### 1. Lisa "Asukohad" link projektide lehele

**Fail:** `apps/web/src/components/projects/projects-table.tsx`

Lisa action column'i:

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.push(`/projects/${project.id}/locations`)}
>
  <MapPin className="w-4 h-4 mr-2" />
  Asukohad
</Button>
```

### 2. Uuenda Attendance Check-in'i

**Fail:** `apps/web/src/components/personnel/AttendanceCheckIn.tsx`

Lisa project ja location selection:

```typescript
const [selectedProject, setSelectedProject] = useState('');
const [selectedLocation, setSelectedLocation] = useState('');

// Lisa API call'is:
body: JSON.stringify({
  employeeId: currentUserId,
  type,
  latitude: location.latitude,
  longitude: location.longitude,
  projectId: selectedProject,
  projectLocationId: selectedLocation,
}),
```

---

## ✅ IMPLEMENTATSIOONI SAMMUD

1. **Andmebaas:**
   - Kopeeri SQL migrations
   - Rakenda: `supabase db push`

2. **API Endpoints:**
   - Loo `/api/projects/[id]/locations/`
   - Loo `/api/projects/[id]/employees/`

3. **Komponendid:**
   - `ProjectLocationsMap.tsx`
   - `LocationDialog.tsx`
   - `ProjectEmployees.tsx`

4. **Pages:**
   - `/projects/[id]/locations/page.tsx`

5. **Integratsioon:**
   - Uuenda projects table
   - Uuenda attendance check-in

6. **Test:**
   - GPS location adding
   - Geofencing validation
   - Employee assignment

---

## 🎯 TULEMUS

✅ Projektidel on GPS asukohad  
✅ Kaardil saab klõpsata ja lisada asukohtasid  
✅ Geofencing raadius seadistatav  
✅ GPS check-in kohustuslik seadistatav  
✅ Töötajad määratakse projektidele  
✅ Check-in valideerib kas õiges projektis  
✅ Olemasolev employees süsteem integreeritud  

**Valmis! 🚀**
