# 🏗️ Laohaldussüsteem - Manual

Tere tulemast EOS2 laohaldussüsteemi dokumentatsiooni!

## 📚 Dokumendid

### 🎯 Alusta siit
1. **[LÕPLIK-KOKKUVÕTE.md](LÕPLIK-KOKKUVÕTE.md)** - Kogu projekti ülevaade
2. **[KIIRE-ALUSTAMISE-JUHEND.md](KIIRE-ALUSTAMISE-JUHEND.md)** - Samm-sammult alustamine

### 📋 Plaanid
- **[WAREHOUSE-ENHANCED-PLAN.md](WAREHOUSE-ENHANCED-PLAN.md)** - Täielik plaan (PÕHILINE)
  - Asukohtade süsteem
  - Fotode metadata
  - Inventuur
  - Tükikaupade kaalud
  - Varade seosed
  - Hoolduste kulud
  - Excel import/export
  - Mass editing
  - Ülekande korv
  - +10 mugavust

- **[LAOHALDUS-IMPLEMENTATSIOON-PLAAN.md](LAOHALDUS-IMPLEMENTATSIOON-PLAAN.md)** - Algne plaan
  - Andmebaasi mudel
  - API struktuur
  - UI komponendid
  - Tehnilised detailid

### 🤖 Claude Code
- **[CLAUDE-CODE-GUIDE.md](CLAUDE-CODE-GUIDE.md)** - Kuidas Claude Code'iga arendada
  - Promptide näited
  - Faasipõhine workflow
  - Kasutusjuhtumid
  - Debug tips

### 🗄️ Andmebaas
- **[migrations/004_warehouse_management.sql](migrations/004_warehouse_management.sql)** - Põhitabelid
  - 12 põhitabelit
  - Indeksid
  - Triggers
  - Functions

- **[migrations/005_warehouse_enhanced.sql](migrations/005_warehouse_enhanced.sql)** - Täiendused
  - Asukohtade hierarhia
  - Varade seosed
  - Inventuur
  - Kulud
  - Audit log
  - Views

### 💻 Koodinäited
- **[examples/api-routes-examples.ts](examples/api-routes-examples.ts)** - API route'id
  - CRUD operatsioonid
  - Filtreerimine
  - Päringud
  - Error handling

- **[examples/AssetsTable-component.tsx](examples/AssetsTable-component.tsx)** - React komponent
  - React Query
  - Filters & search
  - Bulk actions
  - Pagination

## 🚀 Kiirstart

### 1. Tutvu dokumentidega
```bash
# Loe kõigepealt
cat LÕPLIK-KOKKUVÕTE.md
cat KIIRE-ALUSTAMISE-JUHEND.md
```

### 2. Rakenda migratsioonid
```bash
# Supabase CLI
cd ../..
supabase db push

# Või käsitsi Supabase Dashboard's
```

### 3. Alusta Claude Code'iga
```bash
# Ava projekt
code .

# Küsi Claude Code'ilt:
# "Tutvu manual/warehouse/ failidega ja alusta Faas 1 implementeerimist"
```

## 📁 Kausta struktuur

```
manual/warehouse/
├── README.md                                    # ← Sa oled siin
├── LÕPLIK-KOKKUVÕTE.md                         # Kõik kokku
├── KIIRE-ALUSTAMISE-JUHEND.md                  # Quick start
├── CLAUDE-CODE-GUIDE.md                         # Claude Code
├── WAREHOUSE-ENHANCED-PLAN.md                   # Põhiline plaan ⭐
├── LAOHALDUS-IMPLEMENTATSIOON-PLAAN.md         # Algne plaan
├── migrations/
│   ├── 004_warehouse_management.sql            # Põhitabelid
│   └── 005_warehouse_enhanced.sql              # Täiendused
└── examples/
    ├── api-routes-examples.ts                  # API
    └── AssetsTable-component.tsx               # UI
```

## 🎯 Funktsioonid

### ✅ Põhifunktsionaalsus
- Varade haldus (varad, tükikaubad, tööriistad)
- Ladude haldus (mitme lao tugi)
- Kategooriad (lõputu hierarhia)
- Ülekanded (workflow, kinnitused)
- QR/Barcode (genereerimine, skaneerimine)
- Fotogalerii (metadata, watermarks)

### 🆕 Täiustused
- **Asukohtade hierarhia** - RUUM1 / Riiul A / Rida 3
- **Fotode metadata** - Automaatne info lisamine
- **Inventuur** - Skaneerimine + fotod
- **Tükikaupade kaalud** - Kaalumine + arvutus
- **Varade seosed** - Komplektid (trell + akud)
- **Hoolduste kulud** - Detailsed kuluaruanded
- **Excel import/export** - Massiline andmete liigutamine
- **Mass editing** - Bulk muudatused
- **Ülekande korv** - Mitme vara ülekanne korraga

### 💡 Mugavused
- Real-time notifications
- Keyboard shortcuts
- Mobile optimized
- Offline support (PWA)
- Analytics & insights
- Audit logging
- Auto-reminders
- Smart suggestions

## 📊 Implementatsiooni Faasid

```
Faas 1 (1-2 nädalat)  ← ALUSTA SIIT
├── Andmebaas
├── API route'id
├── AssetsTable
└── Asset detail

Faas 2 (1 nädal)
├── Tükikaubad
├── Stock movements
└── Alerts

Faas 3 (1 nädal)
├── Fotogalerii
├── QR scanner
└── Printing

Faas 4-10
└── Vaata WAREHOUSE-ENHANCED-PLAN.md
```

## 🔧 Tehnoloogiad

- **Frontend:** Next.js 14 App Router, React, TypeScript
- **UI:** shadcn/ui, Tailwind CSS
- **State:** React Query, Zustand
- **Backend:** Supabase (PostgreSQL)
- **ORM:** Prisma (optional)
- **QR:** html5-qrcode
- **Excel:** ExcelJS, xlsx
- **Photos:** Sharp (compression)

## 📞 Abi

### Dokumentatsioon
1. Loe KIIRE-ALUSTAMISE-JUHEND.md
2. Vaata CLAUDE-CODE-GUIDE.md
3. Kontrolli näiteid examples/ kaustas

### Claude Code
```
"Tutvu manual/warehouse/ failidega"
"Rakenda migratsioonid"
"Loo API route warehouses"
"Loo AssetsTable komponent"
"Debug: [kirjelda viga]"
```

### Levinud probleemid
- **RLS error** → Kontrolli policies (005_warehouse_enhanced.sql)
- **Tüübi viga** → Lisa tüüp packages/types/
- **Query ei uuenda** → Lisa invalidateQueries

## ✅ Checklist

```
ETTEVALMISTUS
- [ ] Failid kopeeritud
- [ ] Dokud loetud
- [ ] Supabase seadistatud

ARENDUS
- [ ] Migratsioonid
- [ ] API route'id
- [ ] Komponendid
- [ ] Lehed
- [ ] Testimine

DEPLOY
- [ ] Build
- [ ] Tests
- [ ] Production
```

## 🎉 Edasi!

Kõik on valmis - alusta KIIRE-ALUSTAMISE-JUHEND.md'st või küsi Claude Code'ilt:

```
"Tere! Soovin alustada laohaldussüsteemi arendamist. 
Tutvu manual/warehouse/ failidega ja aita mul alustada."
```

**Edu arendamisel! 🚀**

---

*Viimati uuendatud: 2024-11-30*
