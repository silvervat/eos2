# VEHICLES MOODUL

**Staatus:** 🚧 Development
**Versioon:** 1.0.0
**Autor:** Silver
**Loodud:** 2025-12-04

---

## KIRJELDUS

Sõidukipargi haldussüsteem. Võimaldab:
- Sõidukite registreerimist ja haldust
- Hoolduste planeerimist ja jälgimist
- Sõidukite määramist projektidele ja kasutajatele
- Kasutuse ajaloo jälgimist
- Kindlustuse ja ülevaatuse tähtaegade jälgimist

---

## FAILID

```
modules/vehicles/
├── definition.ts          # ⭐ Mooduli definitsioon
├── MODULE.md              # 📖 See fail
├── pages/
│   ├── index.tsx          # Nimekiri
│   ├── [id].tsx           # Detail (TODO)
│   └── new.tsx            # Uus sõiduk (TODO)
└── components/
    ├── VehicleForm.tsx    # Vorm (TODO)
    └── VehicleCard.tsx    # Kaart (TODO)
```

---

## ANDMEBAAS

### Tabel: vehicles

| Väli | Tüüp | Kirjeldus |
|------|------|-----------|
| id | uuid | Primaarvõti |
| tenant_id | uuid | FK → tenants |
| registration_number | text | Reg nr (unikaalne) |
| make | text | Mark |
| model | text | Mudel |
| year | integer | Aasta |
| vin | text | VIN kood |
| status | enum | available, in_use, maintenance, retired |
| current_project_id | uuid | FK → projects |
| assigned_user_id | uuid | FK → auth.users |
| odometer | integer | Läbisõit km |
| fuel_type | enum | petrol, diesel, electric, hybrid, lpg |
| purchase_date | date | Ostukuupäev |
| purchase_price | decimal | Ostuhind |
| insurance_valid_until | date | Kindlustus kehtib |
| inspection_valid_until | date | Ülevaatus kehtib |
| notes | text | Märkused |
| created_at | timestamptz | Loodud |
| updated_at | timestamptz | Muudetud |

### RLS Poliitikad
- ✅ Tenant isolation
- ✅ Role-based access

---

## ÕIGUSED

| Toiming | Kirjeldus | Vaikimisi rollid |
|---------|-----------|------------------|
| read | Vaata sõidukeid | Kõik |
| create | Lisa sõiduk | manager+ |
| update | Muuda sõidukit | manager+ |
| delete | Kustuta sõiduk | admin+ |
| assign | Määra sõiduk | manager+ |
| maintenance | Halda hooldust | user+ |
| export | Ekspordi andmed | manager+ |

---

## KOMPONENDID

### VehicleList (Active)
Sõidukite nimekiri filtritega ja staatuse näidikutega.

### VehicleDetail (Active)
Detailvaade: põhiinfo + hooldused + ajalugu.

### VehicleForm (Active)
Lisamise/muutmise vorm kõigi väljadega.

### VehicleCard (Active)
Kompaktne kaart sõiduki infoga.

### VehicleMaintenance (Beta)
Hoolduste halduse tab.
**TODO:** #TODO-V001 - Automaatsed meeldetuletused

### VehicleTimeline (TODO)
Kasutuse timeline widget.
**TODO:** #TODO-V002 - Gantt vaade

---

## SEOSED

- **projects** - current_project_id (many-to-one)
- **auth.users** - assigned_user_id (many-to-one)

---

## VAATED

| Vaade | Filter | Kirjeldus |
|-------|--------|-----------|
| all | - | Kõik sõidukid |
| available | status=available | Vabad sõidukid |
| in-use | status=in_use | Kasutuses olevad |
| maintenance | status=maintenance | Hoolduses olevad |

---

## STAATUSED

| Staatus | Värv | Kirjeldus |
|---------|------|-----------|
| available | 🟢 | Vaba - saab määrata |
| in_use | 🔵 | Kasutuses projektil |
| maintenance | 🟡 | Hoolduses |
| retired | ⚫ | Kasutusest kõrvaldatud |

---

## TODO

- [ ] #TODO-V001 - Hoolduste automaatsed meeldetuletused
- [ ] #TODO-V002 - Kasutuse timeline/Gantt vaade
- [ ] #TODO-V003 - Kütusekulude jälgimine
- [ ] #TODO-V004 - QR koodi genereerimine

---

## BUGID

Teadaolevaid bugisid pole.

---

## VERSIOONIAJALUGU

### 1.0.0 (2025-12-04)
- Algne definitsioon
- Põhistruktuur loodud

---

**Viimati uuendatud:** 2025-12-04
