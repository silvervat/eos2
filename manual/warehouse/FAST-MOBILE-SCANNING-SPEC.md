# 📱 KIIRE MOBILE SCANNING + TRANSFER BASKET - IMPLEMENTATION GUIDE

**Eesmärk:** Võimaldada ehitusplatsi töötajatel kiiresti QR/barcode koodide abil materjale laost projektile üle viia

---

## 🎯 USER STORY

**Kasutaja:** Mati (ehitusplatsi meister)  
**Vajadus:** Viia 20 toodet laost Arlanda projektile

**Protsess:**
1. Avab telefonis EOS2 app
2. Valib "Transfer Materials" (Materjali ülekanne)
3. Valib sihtkoha: "Project: RM2506 - Arlanda"
4. **SKÄNNIB JÄRJEST:**
   - Skännib terase posti QR → lisandub korvi (kogus: 1)
   - Skännib kruvi pakki barcode → lisandub korvi (kogus: 1)
   - Skännib samal kruvil uuesti → kogus muutub 2
   - Skännib fassaadipaneeli → lisandub korvi (kogus: 1)
   - Skännib tööriista → ERROR: "Pole laos!" (ei lisa korvi)
   - ... skännib järjest 20 toodet
5. Vaatab korvi üle (20 toodet)
6. Muudab mõne kogust käsitsi (nt kruve on 50 tk)
7. Vajutab "Kinnita ülekanne"
8. ✅ Kõik 20 toodet liiguvad korraga projektile

**Aeg:** ~2-3 minutit (vs 20+ minutit käsitsi)

---

## 🔧 TECHNICAL REQUIREMENTS

### 1. KIIRUS (KRITILISELT OLULINE!)

**Nõuded:**
- Scan → Result: **< 500ms** (ideaalis < 300ms)
- Järjestikuste scannide vahel: **< 200ms**
- Continuous scanning mode (ei pea iga kord "Scan" vajutama)
- Haptic feedback scanni õnnestumisel (vibration)
- Audio feedback (beep)
- Visual feedback (flash green)

**Tehnilised lahedused:**
- Pre-load asset data (cache)
- Optimistic UI updates (lisa korvi kohe, valideeri taustal)
- WebWorker for barcode decoding
- IndexedDB cache stock levels

### 2. SCANNING MODES

**Mode 1: Continuous Scan (default)**
```
Camera on → Skännib automaatselt → Lisa korvi → Skännib jätkuvalt
```

**Mode 2: Manual Scan**
```
Camera on → Skännib → Peatub → Vajutad "Next" → Skännib uuesti
```

**Kasutaja saab režiimi valida Settings'ist.**

### 3. TRANSFER BASKET

**Basket State:**
```typescript
interface TransferBasketItem {
  assetId: string
  assetName: string
  qrCode: string
  currentWarehouse: string
  currentStock: number
  requestedQuantity: number
  availableQuantity: number
  thumbnailUrl?: string
  isValid: boolean // false kui laos pole
  warnings: string[] // ["Low stock", "Reserved for other project"]
}

interface TransferBasket {
  id: string
  fromWarehouse: string
  toProject: string
  items: TransferBasketItem[]
  createdAt: Date
  status: 'draft' | 'pending' | 'completed'
}
```

### 4. VALIDATION RULES

**Real-time validation:**
1. **Asset exists?** → Kui ei, näita error + suggestions
2. **In stock?** → Kui ei, blokeeri lisamine
3. **Sufficient quantity?** → Kui ei, näita warning + max võimalik
4. **Already in basket?** → Increment quantity
5. **Reserved?** → Näita warning, luba ikkagi (admin võib override)

---

## 💻 IMPLEMENTATION

### 1. DATABASE

```sql
-- Transfer basket table (saved drafts)
CREATE TABLE warehouse_transfer_baskets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Source & destination
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_project_id UUID REFERENCES projects(id),
  
  -- Basket state
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, completed, cancelled
  items JSONB NOT NULL DEFAULT '[]', -- Array of TransferBasketItem
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Search optimization
  total_items INTEGER DEFAULT 0,
  total_value DECIMAL(10,2)
);

CREATE INDEX idx_transfer_baskets_status ON warehouse_transfer_baskets(status);
CREATE INDEX idx_transfer_baskets_user ON warehouse_transfer_baskets(created_by);
CREATE INDEX idx_transfer_baskets_project ON warehouse_transfer_baskets(to_project_id);

-- RLS
ALTER TABLE warehouse_transfer_baskets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baskets"
  ON warehouse_transfer_baskets FOR SELECT
  USING (created_by = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "Users can create baskets"
  ON warehouse_transfer_baskets FOR INSERT
  WITH CHECK (created_by = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "Users can update own baskets"
  ON warehouse_transfer_baskets FOR UPDATE
  USING (created_by = auth.uid() AND status = 'draft');
```

### 2. MOBILE SCANNER COMPONENT

**File:** `apps/web/src/components/warehouse/mobile/FastScanner.tsx`

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useTransferBasket } from '@/hooks/use-transfer-basket'

interface FastScannerProps {
  targetProject: string
  onComplete: (basketId: string) => void
}

export function FastScanner({ targetProject, onComplete }: FastScannerProps) {
  const [isScanning, setIsScanning] = useState(true)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { basket, addItem, isLoading } = useTransferBasket()

  // Initialize scanner
  useEffect(() => {
    const config = {
      fps: 30, // High FPS for fast scanning
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true // Use native barcode detector
      }
    }

    scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false)
    
    scannerRef.current.render(
      async (decodedText) => {
        // Prevent double scans
        if (decodedText === lastScan && Date.now() - lastScanTime < 1000) {
          return
        }
        
        setLastScan(decodedText)
        setLastScanTime(Date.now())
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
        
        // Audio feedback
        playBeep()
        
        // Visual feedback
        flashScreen('green')
        
        // Add to basket (optimistic UI)
        await addItem(decodedText)
      },
      (error) => {
        // Suppress errors (continuous scanning)
        console.debug('Scan error:', error)
      }
    )

    return () => {
      scannerRef.current?.clear()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black">
      {/* Scanner viewport */}
      <div id="qr-reader" className="w-full h-full" />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top bar */}
        <div className="bg-black/50 text-white p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <button onClick={() => setIsScanning(false)} className="text-lg">
              ← Tagasi
            </button>
            <div className="text-sm">
              Korvis: {basket.items.length} toodet
            </div>
          </div>
        </div>
        
        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50" />
        </div>
        
        {/* Bottom basket preview */}
        <BasketPreview basket={basket} />
      </div>
      
      {/* Last scanned item feedback */}
      {lastScan && (
        <LastScannedFeedback item={basket.items[basket.items.length - 1]} />
      )}
    </div>
  )
}

function playBeep() {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

function flashScreen(color: 'green' | 'red') {
  const flash = document.createElement('div')
  flash.className = `fixed inset-0 ${color === 'green' ? 'bg-green-500' : 'bg-red-500'} opacity-30 pointer-events-none`
  document.body.appendChild(flash)
  
  setTimeout(() => {
    flash.style.opacity = '0'
    setTimeout(() => flash.remove(), 200)
  }, 100)
}
```

### 3. BASKET PREVIEW (Bottom sheet)

```typescript
function BasketPreview({ basket }: { basket: TransferBasket }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all pointer-events-auto
        ${isExpanded ? 'h-[70vh]' : 'h-32'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Handle */}
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2" />
      
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            Ülekande korv ({basket.items.length})
          </div>
          <div className="text-sm text-gray-500">
            Kokku: {basket.items.reduce((sum, i) => sum + i.requestedQuantity, 0)} tk
          </div>
        </div>
      </div>
      
      {/* Items list */}
      {isExpanded && (
        <div className="overflow-y-auto h-[calc(70vh-120px)] p-4 space-y-2">
          {basket.items.map((item, index) => (
            <BasketItem 
              key={index} 
              item={item}
              onUpdateQuantity={(qty) => updateQuantity(item.assetId, qty)}
              onRemove={() => removeItem(item.assetId)}
            />
          ))}
        </div>
      )}
      
      {/* Action button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button 
          onClick={handleCompleteTransfer}
          disabled={basket.items.length === 0 || basket.items.some(i => !i.isValid)}
          className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold disabled:bg-gray-300"
        >
          Kinnita ülekanne ({basket.items.length} toodet)
        </button>
      </div>
    </div>
  )
}
```

### 4. BASKET ITEM (with quantity control)

```typescript
function BasketItem({ item, onUpdateQuantity, onRemove }: BasketItemProps) {
  return (
    <div className={`border rounded-lg p-3 ${!item.isValid ? 'bg-red-50 border-red-300' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {item.thumbnailUrl && (
          <img src={item.thumbnailUrl} className="w-16 h-16 object-cover rounded" />
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.assetName}</div>
          <div className="text-sm text-gray-500">{item.qrCode}</div>
          
          {/* Stock info */}
          <div className="text-xs mt-1">
            {item.isValid ? (
              <span className="text-green-600">
                Laos: {item.availableQuantity} tk
              </span>
            ) : (
              <span className="text-red-600">
                ❌ Pole laos saadaval!
              </span>
            )}
          </div>
          
          {/* Warnings */}
          {item.warnings.map((warning, i) => (
            <div key={i} className="text-xs text-orange-600 mt-1">
              ⚠️ {warning}
            </div>
          ))}
        </div>
        
        {/* Quantity controls */}
        {item.isValid && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUpdateQuantity(item.requestedQuantity - 1)}
              disabled={item.requestedQuantity <= 1}
              className="w-8 h-8 rounded-full bg-gray-200 disabled:opacity-50"
            >
              -
            </button>
            <input
              type="number"
              value={item.requestedQuantity}
              onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
              className="w-16 text-center border rounded py-1"
              min="1"
              max={item.availableQuantity}
            />
            <button 
              onClick={() => onUpdateQuantity(item.requestedQuantity + 1)}
              disabled={item.requestedQuantity >= item.availableQuantity}
              className="w-8 h-8 rounded-full bg-gray-200 disabled:opacity-50"
            >
              +
            </button>
          </div>
        )}
        
        {/* Remove button */}
        <button onClick={onRemove} className="text-red-500 p-2">
          🗑️
        </button>
      </div>
    </div>
  )
}
```

### 5. SCAN ERROR HANDLING + SUGGESTIONS

```typescript
async function handleScanError(decodedText: string) {
  // 1. Try exact match
  const exactMatch = await findAssetByQR(decodedText)
  if (exactMatch) {
    return exactMatch
  }
  
  // 2. Try fuzzy match (might be damaged QR)
  const fuzzyMatches = await findAssetsFuzzy(decodedText)
  if (fuzzyMatches.length > 0) {
    // Show suggestions dialog
    showSuggestionsDialog({
      scannedCode: decodedText,
      suggestions: fuzzyMatches,
      onSelect: (asset) => addItem(asset.id),
      onCancel: () => {
        // Skip this scan
        playErrorBeep()
        flashScreen('red')
      }
    })
    return
  }
  
  // 3. Check if it's unclaimed QR code
  const unclaimedCode = await findUnclaimedQR(decodedText)
  if (unclaimedCode) {
    showClaimDialog({
      code: decodedText,
      onClaim: async (assetData) => {
        await claimQRCode(decodedText, assetData)
        addItem(assetData.id)
      }
    })
    return
  }
  
  // 4. Nothing found
  showErrorDialog({
    scannedCode: decodedText,
    message: 'QR kood ei leitud süsteemist',
    actions: [
      { label: 'Sisesta käsitsi', onClick: () => showManualEntry() },
      { label: 'Jätka skannimist', onClick: () => {} }
    ]
  })
  
  playErrorBeep()
  flashScreen('red')
}
```

### 6. COMPLETE TRANSFER

```typescript
async function handleCompleteTransfer(basket: TransferBasket) {
  // Validate entire basket one more time
  const validation = await validateBasket(basket)
  
  if (!validation.isValid) {
    showValidationErrors(validation.errors)
    return
  }
  
  // Show confirmation dialog
  const confirmed = await showConfirmDialog({
    title: 'Kinnita ülekanne',
    message: `Kas oled kindel, et tahad üle viia ${basket.items.length} toodet?`,
    details: basket.items.map(i => `${i.assetName} (${i.requestedQuantity} tk)`),
    confirmText: 'Jah, vii üle',
    cancelText: 'Tühista'
  })
  
  if (!confirmed) return
  
  // Create transfer
  try {
    const transfer = await createTransfer({
      fromWarehouse: basket.fromWarehouse,
      toProject: basket.toProject,
      items: basket.items.map(i => ({
        assetId: i.assetId,
        quantity: i.requestedQuantity
      })),
      transferredBy: currentUser.id,
      notes: basket.notes
    })
    
    // Show success
    toast.success(`✅ ${basket.items.length} toodet edukalt üle viidud!`)
    
    // Clear basket
    clearBasket()
    
    // Navigate to transfer details
    router.push(`/warehouse/transfers/${transfer.id}`)
    
  } catch (error) {
    toast.error('Viga üle viimisel: ' + error.message)
  }
}
```

---

## 📱 USER FLOW

### 1. Start Transfer
```
Warehouse page → [Transfer Materials] button → Select destination
```

### 2. Scanning Flow
```
Camera opens (auto-focus)
↓
QR code detected
↓
< 300ms validation
↓
✅ Valid → Beep + Vibrate + Flash green + Add to basket
❌ Invalid → Error beep + Flash red + Show suggestions
↓
Continue scanning (no button press needed!)
```

### 3. Review & Modify
```
Pull up basket sheet
↓
See all items
↓
Adjust quantities
↓
Remove unwanted items
↓
See warnings (low stock, reserved, etc.)
```

### 4. Complete
```
[Kinnita ülekanne] button
↓
Validation check
↓
Confirmation dialog
↓
Create transfer
↓
✅ Success screen
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### 1. Pre-caching
```typescript
// Pre-load all assets in current warehouse
useEffect(() => {
  if (currentWarehouse) {
    prefetchWarehouseAssets(currentWarehouse)
  }
}, [currentWarehouse])

// IndexedDB cache
const db = await openDB('warehouse-cache', 1, {
  upgrade(db) {
    db.createObjectStore('assets', { keyPath: 'qr_code' })
    db.createObjectStore('stock', { keyPath: 'asset_id' })
  }
})
```

### 2. WebWorker for barcode decoding
```typescript
// worker.ts
importScripts('https://unpkg.com/@zxing/library@latest')

const codeReader = new ZXing.BrowserMultiFormatReader()

self.addEventListener('message', async (e) => {
  const { imageData } = e.data
  try {
    const result = await codeReader.decodeFromImageData(imageData)
    self.postMessage({ success: true, text: result.text })
  } catch (error) {
    self.postMessage({ success: false, error: error.message })
  }
})
```

### 3. Optimistic UI
```typescript
// Add to basket immediately, validate in background
function addItem(qrCode: string) {
  // 1. Add to basket instantly (optimistic)
  const tempItem = {
    assetId: 'temp-' + Date.now(),
    qrCode,
    isValid: true, // Assume valid
    requestedQuantity: 1,
    assetName: 'Loading...'
  }
  
  setBasket(prev => ({ ...prev, items: [...prev.items, tempItem] }))
  
  // 2. Validate in background
  validateAndEnrichItem(qrCode).then(item => {
    setBasket(prev => ({
      ...prev,
      items: prev.items.map(i => 
        i.assetId === tempItem.assetId ? item : i
      )
    }))
  })
}
```

---

## 🎨 UI/UX DETAILS

### Colors
- ✅ Success: Green flash + green border
- ❌ Error: Red flash + red border
- ⚠️ Warning: Orange text
- ⏳ Loading: Gray overlay

### Sounds
- Success: High beep (800Hz, 100ms)
- Error: Low buzz (200Hz, 200ms)
- Warning: Medium beep (500Hz, 150ms)

### Haptics
- Success: 50ms vibration
- Error: 200ms vibration (longer)
- Warning: 2x 50ms vibrations

### Animations
- Scan success: Flash green (100ms)
- Add to basket: Slide up animation (200ms)
- Remove from basket: Slide right + fade (300ms)

---

## 🧪 TESTING CHECKLIST

### Performance
- [ ] Scan → Result < 500ms (test with 10 consecutive scans)
- [ ] Pre-caching works (test offline)
- [ ] No memory leaks (scan 100+ items)
- [ ] Smooth animations (60fps)

### Functionality
- [ ] QR codes scan correctly
- [ ] Barcodes (Code128, Code39) scan correctly
- [ ] Duplicate scan increments quantity
- [ ] Out-of-stock items blocked
- [ ] Low stock warning shown
- [ ] Manual quantity adjustment works
- [ ] Remove item works
- [ ] Complete transfer creates correct transfer record

### Edge Cases
- [ ] Damaged QR code → Shows suggestions
- [ ] Unknown QR code → Shows error + manual entry
- [ ] Unclaimed QR → Shows claim dialog
- [ ] Network error → Shows offline message + queues transfer
- [ ] Very bright light → Scanner still works
- [ ] Very low light → Scanner still works

### Mobile
- [ ] Works on iPhone (iOS 15+)
- [ ] Works on Android (Chrome)
- [ ] Camera permission handled correctly
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] App doesn't crash on camera errors

---

## 📦 IMPLEMENTATION PLAN

### Day 1: Database + API
- Create `warehouse_transfer_baskets` table
- API route: POST `/api/warehouse/transfer-basket`
- API route: POST `/api/warehouse/transfer-basket/[id]/items`
- API route: POST `/api/warehouse/transfer-basket/[id]/complete`

### Day 2: Basic Scanner
- Install html5-qrcode library
- Create `FastScanner.tsx` component
- Implement continuous scanning
- Test basic QR/barcode scanning

### Day 3: Basket Logic
- Create `use-transfer-basket.ts` hook
- Implement add/remove/update items
- Stock validation logic
- Duplicate detection (increment quantity)

### Day 4: UI Polish
- Basket preview bottom sheet
- Haptic + audio + visual feedback
- Suggestions dialog
- Error handling UI

### Day 5: Performance + Testing
- Pre-caching implementation
- WebWorker for decoding
- Optimistic UI
- Load testing
- Mobile testing

---

## 🚀 USAGE EXAMPLE

```typescript
// Page: /warehouse/transfer
'use client'

import { FastScanner } from '@/components/warehouse/mobile/FastScanner'
import { useState } from 'react'

export default function TransferPage() {
  const [targetProject, setTargetProject] = useState<string>()
  const [isScanning, setIsScanning] = useState(false)
  
  if (isScanning && targetProject) {
    return (
      <FastScanner
        targetProject={targetProject}
        onComplete={(basketId) => {
          router.push(`/warehouse/transfers/${basketId}`)
        }}
      />
    )
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Materjali ülekanne</h1>
      
      {/* Select destination */}
      <label className="block mb-2">Sihtkoht:</label>
      <select 
        value={targetProject} 
        onChange={(e) => setTargetProject(e.target.value)}
        className="w-full border rounded p-2 mb-4"
      >
        <option value="">Vali projekt...</option>
        <option value="rm2506">RM2506 - Arlanda Airport</option>
        <option value="mg-eks">MG-EKS - Tallinna hoone</option>
      </select>
      
      <button
        onClick={() => setIsScanning(true)}
        disabled={!targetProject}
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold disabled:bg-gray-300"
      >
        Alusta skannimist 📱
      </button>
    </div>
  )
}
```

---

## ✅ SUCCESS METRICS

**Peale implementatsiooni:**
- ⚡ Scan speed: < 300ms (vs 5+ seconds manual)
- 🎯 Accuracy: > 99% (proper error handling)
- 📱 Mobile-first: Works on all devices
- ⏱️ Time saved: 90% (2 min vs 20 min for 20 items)
- 😊 User satisfaction: "Nii lihtne ja kiire!"

---

**Loodud:** 30. November 2025  
**Claude Sonnet 4.5**  
**Status:** ✅ Ready for implementation

---

*Edu implementatsiooniga! See muudab warehouse management'i 10x kiiremaks! 🚀*
