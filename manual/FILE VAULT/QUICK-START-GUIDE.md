# ⚡ FILE VAULT - QUICK START GUIDE

## ESIMESED 10 MINUTIT

### 1️⃣ STEP 1: RAKENDA MIGRATSIOON (KÕIK AUTOMAATSELT!)

```bash
# Kopeeri täielik SQL fail (includes storage bucket + policies!)
cd /home/claude/eos2-main
cp /mnt/user-data/outputs/008_file_vault_complete_with_storage.sql supabase/migrations/

# Rakenda migratsioon - see loob KÕIK automaatselt:
# ✅ Storage bucket
# ✅ Storage RLS policies (5 tk)
# ✅ Database tables (6 tk)
# ✅ Database RLS policies
# ✅ Indexes ja triggers
supabase db push

# Kontrolli tulemust
supabase db diff
```

**✅ Kontrolli Supabase Dashboard's:**

**Database > Tables** - peaks nägema:
- file_vaults ✓
- file_folders ✓
- files ✓
- file_shares ✓
- file_versions ✓
- file_activities ✓

**Storage > Buckets** - peaks nägema:
- file-vault ✓

**Storage > file-vault > Policies** - peaks nägema 5 policy't:
- Users can upload ✓
- Users can read ✓
- Users can update ✓
- Users can delete ✓
- Public can read shared files ✓

---

### 2️⃣ STEP 2: TESTI UPLOAD

```bash
cd /home/claude/eos2-main/apps/web
npm run dev
```

**Ava brauseris:**
```
http://localhost:3000/file-vault
```

**Proovi:**
1. Vajuta "Laadi fail" nuppu
2. Vali fail oma arvutist
3. Vajuta "Laadi üles"
4. **Peaks töötama!** ✅

---

## ❌ KUI MIDAGI EI TÖÖTA

### Viga: "Table 'file_vaults' not found"

**Lahendus:**
```bash
cd /home/claude/eos2-main
supabase db reset
cp /mnt/user-data/outputs/008_file_vault_complete_with_storage.sql supabase/migrations/
supabase db push
```

### Viga: "Bucket 'file-vault' not found"

**Lahendus:**
Migratsioon peaks selle automaatselt looma. Kui ei loonud:
```bash
# Käivita migratsioon uuesti
supabase db reset
supabase db push
```

### Viga: "Permission denied"

**Lahendus:**
- Lisa storage RLS policies (vt STEP 3)
- Kontrolli, et kasutaja on autenditud

### Upload jääb "uploading" peale kinni

**Lahendus:**
1. Ava browser DevTools (F12)
2. Vaata Network tab'i
3. Otsi punaseid errorreid
4. Kopeeri error ja otsi lahendust

---

## 🎯 JÄRGMISED SAMMUD

### Prioriteet 1: Thumbnails (2-3 tundi)

```bash
npm install sharp

# Loo fail: apps/web/src/lib/file-vault/storage/thumbnail-generator.ts
# Kopeeri kood master plan'ist
```

### Prioriteet 2: Sharing (4-6 tundi)

```bash
# Loo fail: apps/web/src/app/api/file-vault/shares/route.ts
# Loo fail: apps/web/src/app/share/[shortCode]/page.tsx
# Loo fail: apps/web/src/components/file-vault/ShareDialog.tsx
```

### Prioriteet 3: File Previews (6-8 tundi)

```bash
npm install @react-pdf-viewer/core @toast-ui/react-image-editor

# Loo komponendid:
# - ImageEditor.tsx
# - PdfViewer.tsx
# - FilePreview.tsx
```

---

## 📝 CHECKLIST

- [ ] SQL migratsioon rakendatud (`supabase db push`)
- [ ] Kontrollinud Supabase Dashboard > Database > Tables (6 tabelit)
- [ ] Kontrollinud Supabase Dashboard > Storage > Buckets (file-vault)
- [ ] Kontrollinud Storage > file-vault > Policies (5 policy't)
- [ ] Upload töötab
- [ ] Failid kuvatakse File Vault lehel
- [ ] Kaustade loomine töötab
- [ ] Kaustade navigeerimine töötab

**Kui kõik ülalpool on ✅, oled valmis järgmiste featuuride jaoks!**

---

## 💡 NÄPUNÄITED

### Debug Console

Ava alati DevTools ja vaata:
```
Console tab - JavaScript errorid
Network tab - API kutsed
Application tab - Storage/Database
```

### Test Väikese Failiga

Ära alusta kohe 100MB failiga!
- Esimene test: 100KB pilt
- Teine test: 1MB PDF
- Kolmas test: 10MB video
- Seejärel: suuremad failid

### Kontrolli Supabase Logs

```
Supabase Dashboard > Logs > Postgres Logs
```

Näed seal kõiki SQL query'sid ja errorreid.

---

## ⚡ KIIRED KÄSUD

```bash
# Reset database
supabase db reset

# Apply migrations
supabase db push

# Check diff
supabase db diff

# Start dev server
npm run dev

# Check logs
npm run dev | grep ERROR
```

---

## 🎓 ABIKS

**Kui jääd hätta:**

1. **Loe error message tähelepanelikult**
2. **Vaata browser console**
3. **Kontrolli Supabase logs**
4. **Proovi väiksema failiga**
5. **Reset database ja proovi uuesti**

**Common Issues:**
- Forget to create bucket → Create it manually
- Wrong bucket name → Must be exactly `file-vault`
- No RLS policies → Add policies from STEP 3
- Migration didn't run → Run `supabase db push` again

---

## ✅ EDUKAS!

Kui upload töötab, oled sa õigel teel!

**Edasi:** Vaata `CLAUDE-CODE-FILE-VAULT-MASTER-PLAN.md` täielikku kava.

🚀 **Edu!**
