# EOS2 TODO - Pooleli asjad ja planeeritud

**Viimati uuendatud:** 2025-12-04
**Projekt:** EOS2 - Enterprise Operating System 2

---

## PRIORITEETSED (Jargi implementatsiooni plaani)

Vaata detailset plaani: `manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md`

### PHASE 1: Baassuusteem (2-3h)
- [ ] #TODO-001 - Luua modules tabeli migratsioon
- [ ] #TODO-002 - Luua components tabeli migratsioon
- [ ] #TODO-003 - Luua actions tabeli migratsioon
- [ ] #TODO-004 - Luua user_module_access tabeli migratsioon
- [ ] #TODO-005 - Luua user_component_access tabeli migratsioon

### PHASE 2: Oiguste suusteem (3-4h)
- [ ] #TODO-010 - Implementeerida rollide definitsioon (core/permissions/roles.ts)
- [ ] #TODO-011 - Implementeerida toimingute definitsioon (core/permissions/actions.ts)
- [ ] #TODO-012 - Implementeerida oiguste maatriks (core/permissions/matrix.ts)
- [ ] #TODO-013 - Implementeerida oiguste kontrolli hook (usePermission)
- [ ] #TODO-014 - Luua ProtectedComponent
- [ ] #TODO-015 - Luua ProtectedRoute

### PHASE 3: Admin paneel (4-5h)
- [ ] #TODO-020 - Luua admin layout
- [ ] #TODO-021 - Implementeerida admin dashboard
- [ ] #TODO-022 - Implementeerida moodulite haldus
- [ ] #TODO-023 - Implementeerida kasutajate oiguste maatriks
- [ ] #TODO-024 - Implementeerida suusteemi tervis

### PHASE 4: Registry suusteem (3-4h)
- [ ] #TODO-030 - Implementeerida defineModule helper
- [ ] #TODO-031 - Implementeerida registerModule funktsioon
- [ ] #TODO-032 - Implementeerida automaatne registreerimine app startup'il
- [ ] #TODO-033 - Luua mooduli template (_template/)

### PHASE 5: Design System (2-3h)
- [ ] #TODO-040 - Luua design tokens (design/tokens.ts)
- [ ] #TODO-041 - Konfigureerida Ant Design theme (design/theme.ts)
- [ ] #TODO-042 - Luua DataTable core komponent
- [ ] #TODO-043 - Luua FormBuilder core komponent
- [ ] #TODO-044 - Luua StatusBadge core komponent

### PHASE 6: Esimene moodul - Vehicles (1-2h)
- [ ] #TODO-050 - Luua vehicles/definition.ts
- [ ] #TODO-051 - Luua vehicles/MODULE.md
- [ ] #TODO-052 - Luua vehicles lehekulgid (index, [id], new)
- [ ] #TODO-053 - Luua vehicles migratsioon

### PHASE 7: Testimine (2-3h)
- [ ] #TODO-060 - Kirjutada unit testid permissions moodulile
- [ ] #TODO-061 - Kirjutada unit testid registry moodulile
- [ ] #TODO-062 - Kirjutada integration testid
- [ ] #TODO-063 - Kirjutada E2E testid

### PHASE 8: Dokumentatsioon (1-2h)
- [ ] #TODO-070 - Uuendada SYSTEM.md iga faasi jarel
- [ ] #TODO-071 - Luua CHANGELOG.md
- [ ] #TODO-072 - Uuendada README.md

---

## WAREHOUSE MOODULI TODO

### Taaiendused
- [ ] #TODO-W001 - Hoolduste automaatne meeldetuletus
- [ ] #TODO-W002 - Gantt vaade kasutusele
- [ ] #TODO-W003 - Bulk import CSV-st
- [ ] #TODO-W004 - Aruanded ja statistika

### Bugid
- Hetkel ei ole teadaolevaid bugisid

---

## FILE VAULT TODO

- [ ] #TODO-F001 - Failide jagamise suusteem
- [ ] #TODO-F002 - Versioonihaldus
- [ ] #TODO-F003 - Eelvaated

---

## TULEVASED MOODULID

### Projects (Korge prioriteet)
- [ ] #TODO-P001 - Projektide pohimoodul
- [ ] #TODO-P002 - Gantt planner integratsioon

### Clients (Korge prioriteet)
- [ ] #TODO-C001 - Klientide pohimoodul
- [ ] #TODO-C002 - Kontaktide haldus

### Invoices (Korge prioriteet)
- [ ] #TODO-I001 - Arvete pohimoodul
- [ ] #TODO-I002 - PDF genereerimine
- [ ] #TODO-I003 - E-arve integratsioon

---

## TEHNILINE VOLK

- [ ] #TODO-T001 - CI/CD pipeline seadistamine
- [ ] #TODO-T002 - Staging keskkond
- [ ] #TODO-T003 - Production deployment

---

## MARKMEID

### Kuidas lisada uut TODO-d

```markdown
- [ ] #TODO-XXX - Kirjeldus
```

### Kuidas markida tehtuks

```markdown
- [x] #TODO-XXX - Kirjeldus (DONE 04.12.2025)
```

### Prioriteetide selgitus

- **PHASE 1-8** - Pohilised implementatsiooni sammud
- **WAREHOUSE** - Olemasoleva mooduli taaiendused
- **TULEVASED** - Uued moodulid

---

**NB!** See fail tuleb uuendada iga muudatuse jarel!

**Viimati uuendatud:** 2025-12-04
