'use client'

import { useState } from 'react'
import {
  Camera,
  Aperture,
  Timer,
  Maximize2,
  MapPin,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  SunDim,
} from 'lucide-react'

interface ExifData {
  cameraMake?: string
  cameraModel?: string
  lens?: string
  iso?: number
  aperture?: string
  shutterSpeed?: string
  focalLength?: string
  takenAt?: string
  gpsLatitude?: number
  gpsLongitude?: number
  gpsLocation?: string
  width?: number
  height?: number
  orientation?: number
  colorSpace?: string
  flash?: boolean
  exposureMode?: string
  whiteBalance?: string
  software?: string
}

interface ImageMetadataPanelProps {
  file: {
    id: string
    name: string
    mimeType: string
    width?: number
    height?: number
    metadata?: {
      exif?: ExifData
      [key: string]: unknown
    }
    // Direct EXIF fields from database
    cameraMake?: string
    cameraModel?: string
    lens?: string
    iso?: number
    aperture?: string
    shutterSpeed?: string
    focalLength?: string
    takenAt?: string
    gpsLatitude?: number
    gpsLongitude?: number
    gpsLocation?: string
  }
  className?: string
}

/**
 * Panel showing EXIF metadata for images
 */
export function ImageMetadataPanel({ file, className = '' }: ImageMetadataPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Get EXIF data from file - check both direct fields and nested metadata
  const exif: ExifData = {
    cameraMake: file.cameraMake || file.metadata?.exif?.cameraMake,
    cameraModel: file.cameraModel || file.metadata?.exif?.cameraModel,
    lens: file.lens || file.metadata?.exif?.lens,
    iso: file.iso || file.metadata?.exif?.iso,
    aperture: file.aperture || file.metadata?.exif?.aperture,
    shutterSpeed: file.shutterSpeed || file.metadata?.exif?.shutterSpeed,
    focalLength: file.focalLength || file.metadata?.exif?.focalLength,
    takenAt: file.takenAt || file.metadata?.exif?.takenAt,
    gpsLatitude: file.gpsLatitude || file.metadata?.exif?.gpsLatitude,
    gpsLongitude: file.gpsLongitude || file.metadata?.exif?.gpsLongitude,
    gpsLocation: file.gpsLocation || file.metadata?.exif?.gpsLocation,
    width: file.width || file.metadata?.exif?.width,
    height: file.height || file.metadata?.exif?.height,
    flash: file.metadata?.exif?.flash,
    exposureMode: file.metadata?.exif?.exposureMode,
    whiteBalance: file.metadata?.exif?.whiteBalance,
    software: file.metadata?.exif?.software,
  }

  // Check if there's any EXIF data
  const hasExifData = Object.values(exif).some(v => v !== undefined && v !== null)

  // Only show for images
  if (!file.mimeType?.startsWith('image/')) {
    return null
  }

  // Camera info
  const cameraInfo = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ')

  // Format GPS coordinates
  const formatGps = (lat?: number, lng?: number) => {
    if (!lat || !lng) return null
    const latDir = lat >= 0 ? 'N' : 'S'
    const lngDir = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`
  }

  const gpsCoords = formatGps(exif.gpsLatitude, exif.gpsLongitude)
  const gpsDisplay = exif.gpsLocation || gpsCoords

  // Google Maps link
  const mapsUrl = exif.gpsLatitude && exif.gpsLongitude
    ? `https://www.google.com/maps?q=${exif.gpsLatitude},${exif.gpsLongitude}`
    : null

  return (
    <div className={`bg-slate-50 rounded-lg border border-slate-200 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-900">Pildi andmed</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {!hasExifData ? (
            <p className="text-sm text-slate-500 italic">
              EXIF andmed pole saadaval
            </p>
          ) : (
            <>
              {/* Dimensions */}
              {(exif.width || exif.height) && (
                <MetadataRow
                  icon={<Maximize2 className="w-4 h-4" />}
                  label="Mõõtmed"
                  value={`${exif.width} x ${exif.height} px`}
                />
              )}

              {/* Camera */}
              {cameraInfo && (
                <MetadataRow
                  icon={<Camera className="w-4 h-4" />}
                  label="Kaamera"
                  value={cameraInfo}
                />
              )}

              {/* Lens */}
              {exif.lens && (
                <MetadataRow
                  icon={<Info className="w-4 h-4" />}
                  label="Objektiiv"
                  value={exif.lens}
                />
              )}

              {/* Exposure settings */}
              {(exif.aperture || exif.shutterSpeed || exif.iso) && (
                <div className="flex flex-wrap gap-2">
                  {exif.aperture && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 text-xs text-slate-600">
                      <Aperture className="w-3 h-3" />
                      {exif.aperture}
                    </span>
                  )}
                  {exif.shutterSpeed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 text-xs text-slate-600">
                      <Timer className="w-3 h-3" />
                      {exif.shutterSpeed}
                    </span>
                  )}
                  {exif.iso && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 text-xs text-slate-600">
                      <SunDim className="w-3 h-3" />
                      ISO {exif.iso}
                    </span>
                  )}
                </div>
              )}

              {/* Focal length */}
              {exif.focalLength && (
                <MetadataRow
                  icon={<Maximize2 className="w-4 h-4" />}
                  label="Fookuskaugus"
                  value={exif.focalLength}
                />
              )}

              {/* Flash */}
              {exif.flash !== undefined && (
                <MetadataRow
                  icon={<Zap className="w-4 h-4" />}
                  label="Välk"
                  value={exif.flash ? 'Kasutatud' : 'Ei kasutatud'}
                />
              )}

              {/* Date taken */}
              {exif.takenAt && (
                <MetadataRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Pildistatud"
                  value={new Date(exif.takenAt).toLocaleDateString('et-EE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              )}

              {/* GPS Location */}
              {gpsDisplay && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">Asukoht</p>
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#279989] hover:underline"
                      >
                        {gpsDisplay}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-900">{gpsDisplay}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Software */}
              {exif.software && (
                <MetadataRow
                  icon={<Info className="w-4 h-4" />}
                  label="Tarkvara"
                  value={exif.software}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MetadataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 truncate">{value}</p>
      </div>
    </div>
  )
}

export default ImageMetadataPanel
