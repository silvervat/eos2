# EOS2 TODO - Pooleli asjad ja planeeritud

**Viimati uuendatud:** 2025-12-04
**Projekt:** EOS2 - Enterprise Operating System 2

---

## IMPLEMENTATSIOONI SEIS

Vaata detailset plaani: `manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md`

### PHASE 1: Baassüsteem ✅ DONE (04.12.2025)
- [x] #TODO-001 - Luua modules tabeli migratsioon (DONE)
- [x] #TODO-002 - Luua components tabeli migratsioon (DONE)
- [x] #TODO-003 - Luua actions tabeli migratsioon (DONE)
- [x] #TODO-004 - Luua user_module_access tabeli migratsioon (DONE)
- [x] #TODO-005 - Luua user_component_access tabeli migratsioon (DONE)

**Fail:** `supabase/migrations/008_modules_system.sql`

### PHASE 2: Õiguste süsteem ✅ DONE (04.12.2025)
- [x] #TODO-010 - Implementeerida rollide definitsioon (DONE)
- [x] #TODO-011 - Implementeerida toimingute definitsioon (DONE)
- [x] #TODO-012 - Implementeerida õiguste maatriks (DONE)
- [x] #TODO-013 - Implementeerida õiguste kontrolli hook (DONE)
- [x] #TODO-014 - Luua ProtectedComponent (DONE)
- [x] #TODO-015 - Luua AdminOnly komponent (DONE)

**Failid:**
- `apps/web/src/core/permissions/roles.ts`
- `apps/web/src/core/permissions/actions.ts`
- `apps/web/src/core/permissions/matrix.ts`
- `apps/web/src/core/permissions/check.ts`
- `apps/web/src/core/permissions/hooks.ts`
- `apps/web/src/core/permissions/components.tsx`

### PHASE 3: Admin paneel ✅ DONE (04.12.2025)
- [x] #TODO-020 - Luua admin layout (DONE)
- [x] #TODO-021 - Implementeerida admin dashboard (DONE)
- [x] #TODO-022 - Implementeerida moodulite haldus (DONE)
- [x] #TODO-023 - Implementeerida kasutajate õiguste maatriks (DONE)

**Failid:**
- `apps/web/src/app/(dashboard)/admin/layout.tsx`
- `apps/web/src/app/(dashboard)/admin/page.tsx`
- `apps/web/src/app/(dashboard)/admin/modules/page.tsx`
- `apps/web/src/app/(dashboard)/admin/permissions/page.tsx`

### PHASE 4: Registry süsteem ✅ DONE (04.12.2025)
- [x] #TODO-030 - Implementeerida defineModule helper (DONE)
- [x] #TODO-031 - Implementeerida registerModule funktsioon (DONE)
- [x] #TODO-032 - Luua ModuleDefinition tüübid (DONE)
- [x] #TODO-033 - Luua mooduli template (DONE)

**Failid:**
- `apps/web/src/core/registry/types.ts`
- `apps/web/src/core/registry/defineModule.ts`
- `apps/web/src/core/registry/registerModule.ts`
- `apps/web/src/modules/_template/definition.ts`

### PHASE 5: Design System ✅ DONE (04.12.2025)
- [x] #TODO-040 - Luua design tokens (DONE)
- [x] #TODO-041 - Konfigureerida Ant Design theme (DONE)
- [ ] #TODO-042 - Luua DataTable core komponent
- [ ] #TODO-043 - Luua FormBuilder core komponent
- [ ] #TODO-044 - Luua StatusBadge core komponent

**Failid:**
- `apps/web/src/design/tokens.ts`
- `apps/web/src/design/theme.ts`

### PHASE 6: Näidismoodul - Vehicles ✅ DONE (04.12.2025)
- [x] #TODO-050 - Luua vehicles/definition.ts (DONE)
- [x] #TODO-051 - Luua vehicles/MODULE.md (DONE)
- [x] #TODO-052 - Luua vehicles leheküljed (DONE)
- [x] #TODO-053 - Luua vehicles komponendid (DONE)

**Failid:**
- `apps/web/src/modules/vehicles/definition.ts`
- `apps/web/src/modules/vehicles/MODULE.md`
- `apps/web/src/modules/vehicles/pages/index.tsx`
- `apps/web/src/modules/vehicles/pages/[id].tsx`
- `apps/web/src/modules/vehicles/pages/new.tsx`
- `apps/web/src/modules/vehicles/pages/edit.tsx`
- `apps/web/src/modules/vehicles/components/VehicleForm.tsx`
- `apps/web/src/modules/vehicles/components/VehicleCard.tsx`

### PHASE 7: Testimine ✅ DONE (04.12.2025)
- [x] #TODO-060 - Kirjutada unit testid permissions moodulile (DONE)
- [x] #TODO-061 - Kirjutada unit testid registry moodulile (DONE)
- [x] #TODO-062 - Kirjutada unit testid design moodulile (DONE)
- [ ] #TODO-063 - Kirjutada E2E testid

**Testifailid:**
- `apps/web/src/core/permissions/check.test.ts`
- `apps/web/src/core/permissions/matrix.test.ts`
- `apps/web/src/core/registry/defineModule.test.ts`
- `apps/web/src/core/registry/registerModule.test.ts`
- `apps/web/src/design/tokens.test.ts`

### PHASE 8: Dokumentatsioon ✅ DONE (04.12.2025)
- [x] #TODO-070 - Uuendada SYSTEM.md (DONE)
- [x] #TODO-071 - Uuendada TODO.md (DONE)
- [x] #TODO-072 - Uuendada CLAUDE_MEMORY.md (DONE)

---

## JÄRGMISED SAMMUD

### Core komponendid (järgmine prioriteet)
- [ ] #TODO-100 - Luua DataTable core komponent
- [ ] #TODO-101 - Luua FormBuilder core komponent
- [ ] #TODO-102 - Luua StatusBadge core komponent
- [ ] #TODO-103 - Luua PageHeader core komponent

### Supabase integratsioon
- [ ] #TODO-110 - Vehicles tabeli migratsioon
- [ ] #TODO-111 - Supabase klientide seadistamine
- [ ] #TODO-112 - RLS poliitikad vehicles jaoks

---

## WAREHOUSE MOODULI TODO

### Täiendused
- [ ] #TODO-W001 - Hoolduste automaatne meeldetuletus
- [ ] #TODO-W002 - Gantt vaade kasutusele
- [ ] #TODO-W003 - Bulk import CSV-st
- [ ] #TODO-W004 - Aruanded ja statistika

### Bugid
- Hetkel ei ole teadaolevaid bugisid

---

## FILE VAULT TODO

- [ ] #TODO-F001 - Failide jagamise süsteem
- [ ] #TODO-F002 - Versioonihaldus
- [ ] #TODO-F003 - Eelvaated

---

## TULEVASED MOODULID

### Projects (Kõrge prioriteet)
- [ ] #TODO-P001 - Projektide põhimoodul
- [ ] #TODO-P002 - Gantt planner integratsioon

### Clients (Kõrge prioriteet)
- [ ] #TODO-C001 - Klientide põhimoodul
- [ ] #TODO-C002 - Kontaktide haldus

### Invoices (Kõrge prioriteet)
- [ ] #TODO-I001 - Arvete põhimoodul
- [ ] #TODO-I002 - PDF genereerimine
- [ ] #TODO-I003 - E-arve integratsioon

---

## TEHNILINE VÕLG

- [ ] #TODO-T001 - CI/CD pipeline seadistamine
- [ ] #TODO-T002 - Staging keskkond
- [ ] #TODO-T003 - Production deployment

---

## MÄRKMEID

### Kuidas lisada uut TODO-d

```markdown
- [ ] #TODO-XXX - Kirjeldus
```

### Kuidas märkida tehtuks

```markdown
- [x] #TODO-XXX - Kirjeldus (DONE 04.12.2025)
```

### Prioriteetide selgitus

- **PHASE 1-8** - Põhilised implementatsiooni sammud ✅ DONE
- **WAREHOUSE** - Olemasoleva mooduli täiendused
- **TULEVASED** - Uued moodulid

---

**NB!** See fail tuleb uuendada iga muudatuse järel!

**Viimati uuendatud:** 2025-12-04
