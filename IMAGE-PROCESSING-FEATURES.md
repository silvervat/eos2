# 📸 IMAGE PROCESSING - TÄIELIKUD FEATURES

**EXIF metadata, thumbnails, compression, annotated export**

Loodud: 29. November 2025

---

## 📋 SISUKORD

1. [EXIF Metadata Extraction](#1-exif-metadata-extraction)
2. [Thumbnail Generation](#2-thumbnail-generation)
3. [Automatic Compression](#3-automatic-compression)
4. [File Activity History](#4-file-activity-history)
5. [Admin Gallery View](#5-admin-gallery-view)
6. [Export with Comments](#6-export-with-comments)
7. [Implementation](#7-implementation)

---

## 1. EXIF METADATA EXTRACTION

### 1.1 Requirements

```
Pildi metadata:
✅ Kaamera info (brand, model, lens)
✅ Võtte seaded (ISO, aperture, shutter speed)
✅ Kuupäev ja kellaaeg
✅ GPS koordinaadid (kust pilt tehtud)
✅ Faili info (allalaadimise koht, etc)
```

### 1.2 Database Schema

```prisma
// Add to packages/db/prisma/schema.prisma

model File {
  // ... existing fields
  
  // Image-specific metadata
  exif_data      Json?      // Complete EXIF data
  camera_make    String?    // "Canon"
  camera_model   String?    // "EOS 5D Mark IV"
  lens           String?    // "EF 24-70mm f/2.8L"
  iso            Int?       // 800
  aperture       String?    // "f/2.8"
  shutter_speed  String?    // "1/250"
  focal_length   String?    // "50mm"
  taken_at       DateTime?  // When photo was taken
  
  // GPS location
  gps_latitude   Float?     // 59.4370
  gps_longitude  Float?     // 24.7536
  gps_location   String?    // "Tallinn, Estonia"
  
  // Download source
  download_url   String?    // Where file was downloaded from
  download_date  DateTime?  // When it was downloaded
  
  // Relations
  activity       FileActivity[]
}

model FileActivity {
  id         String   @id @default(cuid())
  file_id    String
  user_id    String
  action     FileActivityAction
  details    Json?
  ip_address String?
  user_agent String?
  
  file       File @relation(fields: [file_id], references: [id], onDelete: Cascade)
  user       User @relation(fields: [user_id], references: [id])
  
  created_at DateTime @default(now())
  
  @@index([file_id])
  @@index([user_id])
  @@index([created_at])
}

enum FileActivityAction {
  uploaded
  viewed
  downloaded
  edited
  commented
  shared
  deleted
  restored
  moved
  renamed
  tagged
}
```

### 1.3 EXIF Extraction

```typescript
// apps/api/src/lib/file-vault/metadata/exif-extractor.ts

import exifr from 'exifr'

export class ExifExtractor {
  /**
   * Extract EXIF metadata from image
   */
  static async extractMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      // Extract all EXIF data
      const exif = await exifr.parse(filePath, {
        // What to extract
        ifd0: true,       // Basic info
        exif: true,       // Camera settings
        gps: true,        // GPS location
        iptc: true,       // Copyright, keywords
        icc: true,        // Color profile
      })
      
      if (!exif) {
        return { exif_data: null }
      }
      
      // Parse GPS coordinates
      let gpsLocation = null
      if (exif.latitude && exif.longitude) {
        gpsLocation = await this.reverseGeocode(
          exif.latitude,
          exif.longitude
        )
      }
      
      return {
        // Store complete EXIF as JSON
        exif_data: exif,
        
        // Extract key fields
        camera_make: exif.Make,
        camera_model: exif.Model,
        lens: exif.LensModel || exif.LensInfo,
        iso: exif.ISO,
        aperture: exif.FNumber ? `f/${exif.FNumber}` : null,
        shutter_speed: this.formatShutterSpeed(exif.ExposureTime),
        focal_length: exif.FocalLength ? `${exif.FocalLength}mm` : null,
        taken_at: exif.DateTimeOriginal || exif.DateTime,
        
        // GPS
        gps_latitude: exif.latitude,
        gps_longitude: exif.longitude,
        gps_location: gpsLocation,
      }
    } catch (error) {
      console.error('EXIF extraction failed:', error)
      return { exif_data: null }
    }
  }
  
  /**
   * Format shutter speed (e.g., 0.004 -> "1/250")
   */
  private static formatShutterSpeed(exposureTime: number): string | null {
    if (!exposureTime) return null
    
    if (exposureTime >= 1) {
      return `${exposureTime}s`
    } else {
      return `1/${Math.round(1 / exposureTime)}`
    }
  }
  
  /**
   * Reverse geocode GPS coordinates to location name
   */
  private static async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<string> {
    try {
      // Use OpenStreetMap Nominatim (free!)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      )
      
      const data = await response.json()
      
      // Return "City, Country" format
      return `${data.address.city || data.address.town}, ${data.address.country}`
    } catch (error) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }
}

interface ImageMetadata {
  exif_data: any
  camera_make?: string
  camera_model?: string
  lens?: string
  iso?: number
  aperture?: string
  shutter_speed?: string
  focal_length?: string
  taken_at?: Date
  gps_latitude?: number
  gps_longitude?: number
  gps_location?: string
}
```

### 1.4 Usage on Upload

```typescript
// During file upload
const metadata = await ExifExtractor.extractMetadata(tempFilePath)

await db.file.create({
  data: {
    ...fileData,
    ...metadata, // Add EXIF metadata
  }
})
```

---

## 2. THUMBNAIL GENERATION

### 2.1 Requirements

```
Thumbnails:
✅ Small: 150x150 (table view)
✅ Medium: 300x300 (grid view)
✅ Large: 800x800 (preview)
✅ WebP format (smaller size)
✅ Generated on upload
✅ Stored in Supabase storage
```

### 2.2 Implementation

```typescript
// apps/api/src/lib/file-vault/images/thumbnail-generator.ts

import sharp from 'sharp'

export class ThumbnailGenerator {
  private static sizes = {
    small: 150,
    medium: 300,
    large: 800,
  }
  
  /**
   * Generate all thumbnails for image
   */
  static async generateThumbnails(
    originalPath: string,
    fileId: string
  ): Promise<ThumbnailUrls> {
    const thumbnails: ThumbnailUrls = {}
    
    for (const [size, dimension] of Object.entries(this.sizes)) {
      const thumbnailBuffer = await sharp(originalPath)
        .resize(dimension, dimension, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer()
      
      // Upload to Supabase storage
      const path = `thumbnails/${fileId}/${size}.webp`
      const { data } = await supabase.storage
        .from('file-vault')
        .upload(path, thumbnailBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 year
        })
      
      thumbnails[`thumbnail_${size}`] = data.publicUrl
    }
    
    return thumbnails
  }
  
  /**
   * Generate thumbnail on-the-fly (if needed)
   */
  static async generateOnDemand(
    originalUrl: string,
    size: 'small' | 'medium' | 'large'
  ): Promise<Buffer> {
    const response = await fetch(originalUrl)
    const buffer = await response.arrayBuffer()
    
    return await sharp(Buffer.from(buffer))
      .resize(this.sizes[size], this.sizes[size], {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer()
  }
}

interface ThumbnailUrls {
  thumbnail_small?: string
  thumbnail_medium?: string
  thumbnail_large?: string
}
```

---

## 3. AUTOMATIC COMPRESSION

### 3.1 Requirements

```
Auto-compression:
✅ Detect large images (>10MB)
✅ Compress automatically
✅ Keep original if requested
✅ WebP format (better compression)
✅ Configurable quality
```

### 3.2 Implementation

```typescript
// apps/api/src/lib/file-vault/images/image-compressor.ts

import sharp from 'sharp'

export class ImageCompressor {
  private static MAX_SIZE = 10 * 1024 * 1024 // 10MB
  private static TARGET_SIZE = 2 * 1024 * 1024 // 2MB
  
  /**
   * Check if image needs compression
   */
  static needsCompression(sizeBytes: number, mimeType: string): boolean {
    const isImage = mimeType.startsWith('image/')
    const isLarge = sizeBytes > this.MAX_SIZE
    
    return isImage && isLarge
  }
  
  /**
   * Compress image
   */
  static async compress(
    inputPath: string,
    outputPath: string,
    options: {
      keepOriginal?: boolean
      targetSize?: number
      format?: 'webp' | 'jpeg'
    } = {}
  ): Promise<CompressionResult> {
    const targetSize = options.targetSize || this.TARGET_SIZE
    const format = options.format || 'webp'
    
    // Get original size
    const originalStats = await fs.promises.stat(inputPath)
    const originalSize = originalStats.size
    
    // Start with quality 80
    let quality = 80
    let compressedSize = originalSize
    let attempts = 0
    
    while (compressedSize > targetSize && quality > 20 && attempts < 10) {
      const pipeline = sharp(inputPath)
      
      if (format === 'webp') {
        await pipeline.webp({ quality }).toFile(outputPath)
      } else {
        await pipeline.jpeg({ quality }).toFile(outputPath)
      }
      
      const stats = await fs.promises.stat(outputPath)
      compressedSize = stats.size
      
      // Reduce quality by 10 each iteration
      quality -= 10
      attempts++
    }
    
    // Get final stats
    const metadata = await sharp(outputPath).metadata()
    
    return {
      originalSize,
      compressedSize,
      compressionRatio: ((1 - compressedSize / originalSize) * 100).toFixed(1),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      quality: quality + 10, // Last successful quality
    }
  }
  
  /**
   * Compress during upload
   */
  static async compressOnUpload(
    filePath: string,
    file: UploadedFile
  ): Promise<UploadResult> {
    if (!this.needsCompression(file.size, file.mimetype)) {
      return {
        path: filePath,
        size: file.size,
        compressed: false,
      }
    }
    
    const compressedPath = filePath.replace(/\.(jpg|png)$/i, '.webp')
    
    const result = await this.compress(filePath, compressedPath, {
      keepOriginal: true, // Keep original in separate folder
    })
    
    // Store original in /originals/ folder
    if (result.compressionRatio > 50) {
      await fs.promises.rename(
        filePath,
        filePath.replace('/files/', '/originals/')
      )
    }
    
    return {
      path: compressedPath,
      size: result.compressedSize,
      compressed: true,
      compressionRatio: result.compressionRatio,
      originalPath: filePath,
    }
  }
}

interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: string
  width: number
  height: number
  format: string
  quality: number
}
```

---

## 4. FILE ACTIVITY HISTORY

### 4.1 Track All Actions

```typescript
// apps/api/src/lib/file-vault/activity/activity-tracker.ts

export class ActivityTracker {
  /**
   * Log file activity
   */
  static async log(
    fileId: string,
    userId: string,
    action: FileActivityAction,
    details?: any,
    req?: Request
  ) {
    await db.fileActivity.create({
      data: {
        file_id: fileId,
        user_id: userId,
        action,
        details,
        ip_address: req?.ip,
        user_agent: req?.headers['user-agent'],
      }
    })
  }
  
  /**
   * Get file activity history
   */
  static async getHistory(fileId: string) {
    return await db.fileActivity.findMany({
      where: { file_id: fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }
  
  /**
   * Get last action info
   */
  static async getLastAction(fileId: string) {
    const activity = await db.fileActivity.findFirst({
      where: { file_id: fileId },
      include: { user: true },
      orderBy: { created_at: 'desc' },
    })
    
    if (!activity) return null
    
    return {
      action: activity.action,
      user: activity.user,
      timestamp: activity.created_at,
      timeAgo: formatDistanceToNow(activity.created_at),
    }
  }
}
```

### 4.2 Usage

```typescript
// On every file action
await ActivityTracker.log(fileId, userId, 'viewed', null, req)
await ActivityTracker.log(fileId, userId, 'downloaded', null, req)
await ActivityTracker.log(fileId, userId, 'edited', { field: 'tags' }, req)
```

### 4.3 Display in UI

```typescript
// Show in file details
export function FileActivityTimeline({ file }: { file: File }) {
  const { data: history } = useFileActivity(file.id)
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium">Activity History</h4>
      
      <div className="space-y-2">
        {history?.map(activity => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <Avatar user={activity.user} size="sm" />
            <div>
              <div>
                <span className="font-medium">{activity.user.name}</span>
                {' '}
                <span className="text-gray-600">{activity.action}</span>
                {' '}
                <span className="text-gray-500">
                  {formatDistanceToNow(activity.created_at)} ago
                </span>
              </div>
              {activity.details && (
                <div className="text-xs text-gray-500 mt-1">
                  {JSON.stringify(activity.details)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. ADMIN GALLERY VIEW

### 5.1 Requirements

```
Admin pildid:
✅ Eraldi vaade kõigist piltidest
✅ Grid view (masonry layout)
✅ Filter by user
✅ Filter by date
✅ Bulk operations
```

### 5.2 Implementation

```typescript
// apps/web/src/app/admin/file-vault/gallery/page.tsx

export default function AdminGalleryPage() {
  const [filter, setFilter] = useState({
    userId: null,
    dateFrom: null,
    dateTo: null,
    camera: null,
  })
  
  const { data: images } = useQuery({
    queryKey: ['admin-gallery', filter],
    queryFn: () => fetch('/api/file-vault/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter)
    }).then(r => r.json())
  })
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold mb-4">Image Gallery</h1>
        
        <div className="flex gap-4">
          <Select 
            value={filter.userId} 
            onValueChange={(v) => setFilter({...filter, userId: v})}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {/* List users */}
            </SelectContent>
          </Select>
          
          <DateRangePicker
            value={[filter.dateFrom, filter.dateTo]}
            onChange={(dates) => setFilter({...filter, dateFrom: dates[0], dateTo: dates[1]})}
          />
          
          <Select
            value={filter.camera}
            onValueChange={(v) => setFilter({...filter, camera: v})}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All cameras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cameras</SelectItem>
              {/* List camera models from EXIF */}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images?.map(image => (
            <ImageCard key={image.id} image={image} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ImageCard({ image }: { image: File }) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow">
      <img
        src={image.thumbnail_medium}
        alt={image.name}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white text-sm">
        <div className="font-medium truncate">{image.name}</div>
        <div className="text-xs opacity-80">
          {image.camera_model && (
            <div>{image.camera_model}</div>
          )}
          <div>{formatDate(image.taken_at || image.created_at)}</div>
          {image.gps_location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {image.gps_location}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 6. EXPORT WITH COMMENTS

### 6.1 Requirements

```
Export options:
✅ Original image
✅ Annotated image (with drawings)
✅ PDF with comments below
✅ Choose format
```

### 6.2 Implementation

```typescript
// apps/web/src/components/file-vault/export/ExportWithCommentsDialog.tsx

export function ExportWithCommentsDialog({ file }: { file: File }) {
  const [format, setFormat] = useState<'image' | 'pdf'>('image')
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)
  
  const handleExport = async () => {
    if (format === 'image') {
      await exportAsImage(file, includeAnnotations, includeComments)
    } else {
      await exportAsPDF(file, includeAnnotations, includeComments)
    }
  }
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export "{file.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Format</label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <RadioGroupItem value="image">
                <Image className="mr-2 h-4 w-4" />
                Image (PNG/JPEG)
                <p className="text-sm text-gray-500 ml-6">
                  Export as image file with annotations burned in
                </p>
              </RadioGroupItem>
              
              <RadioGroupItem value="pdf">
                <FileText className="mr-2 h-4 w-4" />
                PDF Document
                <p className="text-sm text-gray-500 ml-6">
                  Export as PDF with image and comments listed below
                </p>
              </RadioGroupItem>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include annotations</label>
              <Switch
                checked={includeAnnotations}
                onCheckedChange={setIncludeAnnotations}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include comments</label>
              <Switch
                checked={includeComments}
                onCheckedChange={setIncludeComments}
              />
            </div>
          </div>
          
          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 6.3 PDF Export

```typescript
// apps/api/src/lib/file-vault/export/pdf-exporter.ts

import PDFDocument from 'pdfkit'

export class PDFExporter {
  /**
   * Export image with comments as PDF
   */
  static async exportWithComments(
    file: File,
    comments: FileComment[],
    options: {
      includeAnnotations: boolean
      includeComments: boolean
    }
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    })
    
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    
    // Add image (with or without annotations)
    const imagePath = options.includeAnnotations
      ? file.annotated_path || file.storage_path
      : file.storage_path
    
    const imageBuffer = await this.downloadFile(imagePath)
    
    // Add image to PDF (fit to page width)
    doc.image(imageBuffer, {
      fit: [500, 700],
      align: 'center',
    })
    
    // Add comments below image
    if (options.includeComments && comments.length > 0) {
      doc.moveDown(2)
      doc.fontSize(16).text('Comments:', { underline: true })
      doc.moveDown()
      
      comments.forEach((comment, index) => {
        doc.fontSize(12)
        
        // Comment number
        if (comment.number) {
          doc.fillColor('#3B82F6')
            .circle(doc.x, doc.y + 5, 10)
            .fill()
            .fillColor('#FFFFFF')
            .text(comment.number.toString(), doc.x - 10, doc.y, {
              width: 20,
              align: 'center',
            })
            .fillColor('#000000')
          doc.moveDown(0.5)
        }
        
        // Comment author and date
        doc.fontSize(10)
          .fillColor('#6B7280')
          .text(`${comment.user.name} • ${formatDate(comment.created_at)}`)
        
        // Comment content
        doc.fontSize(12)
          .fillColor('#000000')
          .text(comment.content, { indent: 20 })
        
        doc.moveDown()
      })
    }
    
    doc.end()
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers))
      })
    })
  }
}
```

---

## 7. IMPLEMENTATION SUMMARY

### 7.1 Database Changes

```bash
# Add to schema.prisma:
1. File model: EXIF fields
2. FileActivity model
3. Run migration:

cd packages/db
npx prisma migrate dev --name add_image_features
npx prisma generate
```

### 7.2 Dependencies

```bash
# Install packages:
npm install sharp exifr pdfkit
```

### 7.3 Implementation Timeline

```
WEEK 1: Core Image Features
├─ Day 1: EXIF extraction
├─ Day 2: Thumbnail generation
├─ Day 3: Auto-compression
└─ Day 4: Testing

WEEK 2: Advanced Features
├─ Day 5-6: Activity tracking
├─ Day 7: Admin gallery
└─ Day 8: PDF export with comments

TOTAL: 8 days (1.5 weeks)
```

---

## ✅ CHECKLIST

```
EXIF Metadata:
[ ] exifr package installed
[ ] ExifExtractor class created
[ ] Database fields added
[ ] Extract on upload
[ ] Display in file details
[ ] GPS reverse geocoding

Thumbnails:
[ ] sharp package installed
[ ] ThumbnailGenerator class
[ ] Generate small/medium/large
[ ] Upload to Supabase storage
[ ] Display in table/grid view

Compression:
[ ] Auto-detect large files
[ ] Compress on upload
[ ] Keep original (optional)
[ ] WebP format
[ ] Quality adjustment

Activity History:
[ ] FileActivity model
[ ] ActivityTracker class
[ ] Log all actions
[ ] Display timeline
[ ] Show last action

Admin Gallery:
[ ] Gallery page created
[ ] Masonry grid layout
[ ] Filters (user, date, camera)
[ ] EXIF info on hover
[ ] Bulk operations

Export:
[ ] Export dialog
[ ] Image export (with annotations)
[ ] PDF export (with comments)
[ ] Format selection
```

---

**VALMIS IMPLEMENTEERIMA! 🚀**
