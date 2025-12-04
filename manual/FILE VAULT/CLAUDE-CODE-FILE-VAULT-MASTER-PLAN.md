# 🚀 CLAUDE CODE - FILE VAULT MASTER PLAN
## Nextcloud-tasemelise Failihaldussüsteemi Lõpuleviimise Kava

**Projekt:** RIVEST EOS2 - File Vault System  
**Eesmärk:** Nextcloud/Dropbox/Google Drive + Airtable ületav lahendus  
**Koostatud:** 04.12.2025

---

## 📊 HETKEOLUKORD

### ✅ MIS ON TEHTUD (80% UI, 100% API)
- File Vault põhileht (Grid + List view)
- FileUploadDialog komponent  
- API routes kõikidele operatsioonidele
- Kaustade navigeerimine
- Breadcrumbs

### ❌ MIS PUUDUB (KRIITILINE!)
- **DATABASE: Tabelid puuduvad 100%** ⚠️
- Storage bucket puudu
- Thumbnail generation puudulik
- Suurte failide chunked upload puudu
- Failide jagamine (sharing)
- ZIP ekstraheerimine
- Piltide/PDF muutmine
- Excel/Word online vaatamine
- Admin dashboard

---

## 🎯 IMPLEMENTATSIOONI PLAAN

### ⏱️ AJAKAVA (3-4 nädalat)

```
NÄDAL 1 (40h):
├─ Päev 1-2: Database + Storage Setup (KRIITILINE!)
├─ Päev 3-5: Thumbnails + Chunked Upload

NÄDAL 2 (40h):
├─ Päev 1-2: Sharing System (linkid, paroolid)
├─ Päev 3-5: File Previews (pilt, PDF, video)

NÄDAL 3 (40h):
├─ Päev 1-2: Image/PDF Editing
├─ Päev 3: ZIP Extraction + Bulk Upload
├─ Päev 4-5: Admin Dashboard

NÄDAL 4 (32h):
├─ Päev 1-2: Advanced Search & Filters
├─ Päev 3-4: Testing + Optimization
```

---

## 🔴 FAAS 1: DATABASE SETUP (P0 - START HERE!)
### ⏱️ 4-6 tundi

Loo fail: `supabase/migrations/008_file_vault_complete.sql`

Sisu koosneb:
1. file_vaults tabel (failihoidlad)
2. file_folders tabel (kaustad)
3. files tabel (failid)
4. file_shares tabel (jagamislinkid)
5. file_versions tabel (versioonid)
6. file_activities tabel (logid)
7. RLS policies kõigile
8. Helper functions

**Käivita:**
```bash
cd /home/claude/eos2-main
supabase db push
```

---

## 🟡 FAAS 2: STORAGE SETUP (P0)
### ⏱️ 1-2 tundi

1. **Loo Supabase Storage bucket (Dashboard):**
   - Name: `file-vault`
   - Public: NO
   - Max size: 50GB

2. **Lisa RLS Policies:**
   - Users can upload to their vault
   - Users can read their files
   - Public can read shared files

---

## 🟢 FAAS 3: THUMBNAIL GENERATION (P1)
### ⏱️ 4-6 tundi

**Installi:**
```bash
npm install sharp pdf-parse
```

**Implementeeri:**
- `thumbnail-generator.ts` - Sharp kasutades
- Genereeri 3 suurust (100px, 400px, 800px)
- Lisa API route'le thumbnail generation
- Testi piltidega

---

## 🔵 FAAS 4: CHUNKED UPLOAD (P1)
### ⏱️ 6-8 tundi

**Suurte failide (100GB+) upload:**

1. ChunkedUploader class
2. Session management
3. Chunk merge API endpoint
4. Progress tracking
5. Resume capability

---

## 🟣 FAAS 5: SHARING SYSTEM (P1)
### ⏱️ 6-8 tundi

**Funktsioonid:**
- Share link genereerimine
- Password protection (bcrypt)
- Expiration dates
- Download limits
- Access tracking
- Public share page `/share/[shortCode]`

**Komponendid:**
- ShareDialog
- PasswordPrompt
- ShareView

---

## 🟠 FAAS 6: FILE PREVIEWS & EDITING (P2)
### ⏱️ 8-12 tundi

**Installi:**
```bash
npm install @toast-ui/react-image-editor @react-pdf-viewer/core jszip
```

**Implementeeri:**
- ImageEditor (toast-ui)
- PdfViewer (@react-pdf-viewer)
- OfficeViewer (Google Docs Viewer)
- VideoPlayer (HTML5 video)
- AudioPlayer
- CodeViewer (syntax highlighting)
- FilePreview (universal component)

---

## 🟤 FAAS 7: ZIP & BULK OPERATIONS (P2)
### ⏱️ 4-6 tundi

**Funktsioonid:**
- ZIP failide automaatne lahtipakkimine
- Kausta loomine ekstraktitud failidele
- Bulk upload (mitme faili korraga)
- Drag & drop support

---

## 🔴 FAAS 8: ADMIN DASHBOARD (P2)
### ⏱️ 6-8 tundi

**Dashboard komponendid:**
- Storage statistics
- Recent activity feed
- Active share links
- User quotas
- Large files report

**API Endpoints:**
- `/api/admin/file-vault/stats`
- `/api/admin/file-vault/activities`
- `/api/admin/file-vault/shares`

---

## 📈 FAAS 9: ADVANCED SEARCH (P3)
### ⏱️ 4-6 tundi

**Otsingufunktsioonid:**
- Full-text search (PostgreSQL)
- Filter by type/size/date
- Filter by folder
- Tag search
- Saved filters

---

## 🎯 LÕPLIK CHECKLIST

### Must-Have (P0-P1):
- [ ] ⚠️ Database schema (ALUSTA SIIT!)
- [ ] ⚠️ Storage bucket
- [ ] ✅ File upload (põhiline)
- [ ] Thumbnail generation
- [ ] Chunked upload (100GB+)
- [ ] File sharing
- [ ] Password protection
- [ ] Image preview & editing
- [ ] PDF viewer
- [ ] ZIP extraction
- [ ] Admin dashboard

### Nice-to-Have (P2-P3):
- [ ] Excel/Word preview
- [ ] Video/Audio players
- [ ] Full-text search
- [ ] Real-time collaboration
- [ ] Comments system
- [ ] Mobile app

---

## 🚀 KIIRE START - 5 SAMMU

### 1. Loo SQL Migratsioon
```bash
cd /home/claude/eos2-main
touch supabase/migrations/008_file_vault_complete.sql
# Kopeeri SQL kood
```

### 2. Rakenda Migratsioon
```bash
supabase db push
# Kontrolli Supabase Dashboard > Database > Tables
```

### 3. Loo Storage Bucket
```
Supabase Dashboard > Storage > New Bucket
Name: file-vault
Public: NO
```

### 4. Lisa RLS Policies
```sql
-- Storage policies (Dashboard > Storage > file-vault > Policies)
```

### 5. Testi
```bash
npm run dev
# Ava http://localhost:3000/file-vault
# Proovi üles laadida fail
```

---

## 💡 NÄPUNÄITED

### Debug:
```typescript
console.log('[FILE-VAULT] Upload started:', { fileName, size })
```

### Error Messages (eesti keeles):
```typescript
const ERRORS = {
  UPLOAD_FAILED: 'Üleslaadimine ebaõnnestus',
  FILE_TOO_LARGE: 'Fail on liiga suur',
  QUOTA_EXCEEDED: 'Kvoot on täis'
}
```

### Testi Iga Faasi:
1. Kirjuta kood
2. Testi kohe
3. Fix bugid
4. Mine edasi

---

## 🌟 SUCCESS CRITERIA

✅ Edukas, kui:
1. Kasutaja saab üles laadida mis tahes faili (100GB+)
2. Failid kuvatakse thumbnail'idega
3. Kaustade navigeerimine töötab
4. Failide jagamine toimib (link + parool)
5. Pildid/PDF'id avanevad preview'sse
6. Pilte saab muuta
7. ZIP failid pakitakse lahti
8. Admin näeb statistikat
9. Kõik töötab kiiresti (<3s)

---

## 🎓 RESSURSID

**Dokumentatsioon:**
- Supabase Storage: https://supabase.com/docs/guides/storage
- Sharp: https://sharp.pixelplumbing.com/
- JSZip: https://stuk.github.io/jszip/

**Nextcloud analüüs:**
- https://github.com/nextcloud/server

---

## ✨ LÕPPSÕNA

Sa ehitad midagi **paremat kui Nextcloud + Dropbox + Google Drive**!

**Võtmeerinevus:** Table-based metadata - failid on tabeli read kohandatud väljadega!

**ALUSTA DATABASE'ST!** See on kõige kriitilisem samm.

🚀 **Edu tööle!**

---

**Versioon:** 1.0  
**Kuupäev:** 04.12.2025  
**Autor:** Claude AI  
**Projekt:** RIVEST EOS2 File Vault
