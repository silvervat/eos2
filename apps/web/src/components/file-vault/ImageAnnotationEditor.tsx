'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MousePointer2,
  Square,
  Circle,
  ArrowRight,
  Type,
  Highlighter,
  Pencil,
  Eraser,
  Undo,
  Redo,
  Save,
  X,
  Palette,
  Minus,
  Plus,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Loader2,
} from 'lucide-react'
import { Button } from '@rivest/ui'

type AnnotationType = 'select' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'highlight' | 'freehand' | 'blur' | 'line'

interface Annotation {
  id: string
  type: AnnotationType
  startX: number
  startY: number
  endX?: number
  endY?: number
  width?: number
  height?: number
  color: string
  strokeWidth: number
  fillColor?: string
  opacity: number
  textContent?: string
  fontSize?: number
  pathData?: string
  zIndex: number
}

interface ImageAnnotationEditorProps {
  imageUrl: string
  fileName: string
  fileId: string
  vaultId: string
  isOpen: boolean
  onClose: () => void
  onSave?: (annotations: Annotation[]) => void
}

const COLORS = [
  '#FF0000', '#FF6B00', '#FFD600', '#00FF00', '#00D9FF', '#0066FF', '#9900FF', '#FF00FF',
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
]

const TOOLS: { type: AnnotationType; icon: React.ReactNode; label: string }[] = [
  { type: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Vali' },
  { type: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Nool' },
  { type: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Ristkülik' },
  { type: 'ellipse', icon: <Circle className="w-4 h-4" />, label: 'Ellips' },
  { type: 'line', icon: <Minus className="w-4 h-4" />, label: 'Joon' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Tekst' },
  { type: 'highlight', icon: <Highlighter className="w-4 h-4" />, label: 'Marker' },
  { type: 'freehand', icon: <Pencil className="w-4 h-4" />, label: 'Vabakäsi' },
  { type: 'blur', icon: <Eraser className="w-4 h-4" />, label: 'Hägusta' },
]

export function ImageAnnotationEditor({
  imageUrl,
  fileName,
  fileId,
  vaultId,
  isOpen,
  onClose,
  onSave,
}: ImageAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<AnnotationType>('arrow')
  const [activeColor, setActiveColor] = useState('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [history, setHistory] = useState<Annotation[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [freehandPath, setFreehandPath] = useState<string>('')
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load image
  useEffect(() => {
    if (!imageUrl || !isOpen) return

    setIsLoading(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      setIsLoading(false)
    }
    img.onerror = () => {
      console.error('Failed to load image')
      setIsLoading(false)
    }
    img.src = imageUrl
  }, [imageUrl, isOpen])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    // Set canvas size
    canvas.width = image.width
    canvas.height = image.height

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)

    // Draw all annotations
    const allAnnotations = [...annotations, ...(currentAnnotation ? [currentAnnotation] : [])]
    allAnnotations.forEach((ann) => drawAnnotation(ctx, ann))
  }, [image, annotations, currentAnnotation])

  useEffect(() => {
    draw()
  }, [draw])

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.save()
    ctx.strokeStyle = ann.color
    ctx.fillStyle = ann.fillColor || ann.color
    ctx.lineWidth = ann.strokeWidth
    ctx.globalAlpha = ann.opacity
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (ann.type) {
      case 'arrow':
        drawArrow(ctx, ann.startX, ann.startY, ann.endX!, ann.endY!)
        break
      case 'rectangle':
        ctx.strokeRect(ann.startX, ann.startY, ann.endX! - ann.startX, ann.endY! - ann.startY)
        break
      case 'ellipse':
        ctx.beginPath()
        const radiusX = Math.abs(ann.endX! - ann.startX) / 2
        const radiusY = Math.abs(ann.endY! - ann.startY) / 2
        const centerX = ann.startX + (ann.endX! - ann.startX) / 2
        const centerY = ann.startY + (ann.endY! - ann.startY) / 2
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      case 'line':
        ctx.beginPath()
        ctx.moveTo(ann.startX, ann.startY)
        ctx.lineTo(ann.endX!, ann.endY!)
        ctx.stroke()
        break
      case 'highlight':
        ctx.globalAlpha = 0.3
        ctx.fillStyle = ann.color
        ctx.fillRect(ann.startX, ann.startY, ann.endX! - ann.startX, ann.endY! - ann.startY)
        break
      case 'text':
        ctx.font = `${ann.fontSize || 20}px Arial`
        ctx.fillStyle = ann.color
        ctx.globalAlpha = 1
        ctx.fillText(ann.textContent || '', ann.startX, ann.startY)
        break
      case 'freehand':
        if (ann.pathData) {
          const path = new Path2D(ann.pathData)
          ctx.stroke(path)
        }
        break
      case 'blur':
        // Simplified blur effect
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'
        ctx.fillRect(ann.startX, ann.startY, ann.endX! - ann.startX, ann.endY! - ann.startY)
        break
    }

    ctx.restore()
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headLength = 15
    const angle = Math.atan2(y2 - y1, x2 - x1)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select') return

    const { x, y } = getCanvasCoords(e)
    setIsDrawing(true)

    if (activeTool === 'text') {
      setTextPosition({ x, y })
      return
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: activeTool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color: activeColor,
      strokeWidth,
      opacity: activeTool === 'highlight' ? 0.3 : 1,
      zIndex: annotations.length,
    }

    if (activeTool === 'freehand') {
      setFreehandPath(`M ${x} ${y}`)
      newAnnotation.pathData = `M ${x} ${y}`
    }

    setCurrentAnnotation(newAnnotation)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation) return

    const { x, y } = getCanvasCoords(e)

    if (activeTool === 'freehand') {
      const newPath = `${freehandPath} L ${x} ${y}`
      setFreehandPath(newPath)
      setCurrentAnnotation({ ...currentAnnotation, pathData: newPath })
    } else {
      setCurrentAnnotation({ ...currentAnnotation, endX: x, endY: y })
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return

    setIsDrawing(false)
    if (activeTool !== 'text') {
      addAnnotation(currentAnnotation)
    }
    setCurrentAnnotation(null)
    setFreehandPath('')
  }

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation]
    setAnnotations(newAnnotations)

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) return

    const textAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: 'text',
      startX: textPosition.x,
      startY: textPosition.y,
      color: activeColor,
      strokeWidth,
      opacity: 1,
      textContent: textInput,
      fontSize: 20,
      zIndex: annotations.length,
    }

    addAnnotation(textAnnotation)
    setTextPosition(null)
    setTextInput('')
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(history[historyIndex + 1])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Export canvas as image
      const canvas = canvasRef.current
      if (!canvas) return

      const dataUrl = canvas.toDataURL('image/png')

      // Save annotations to database
      onSave?.(annotations)

      // Download the annotated image
      const link = document.createElement('a')
      link.download = `annotated-${fileName}`
      link.href = dataUrl
      link.click()

      onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `annotated-${fileName}`
    link.href = dataUrl
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between bg-slate-800 text-white">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-medium">Pildi redigeerimine - {fileName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex === 0} className="text-white hover:bg-white/10">
            <Undo className="w-4 h-4 mr-1" />
            Võta tagasi
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRedo} disabled={historyIndex === history.length - 1} className="text-white hover:bg-white/10">
            <Redo className="w-4 h-4 mr-1" />
            Tee uuesti
          </Button>
          <div className="w-px h-6 bg-white/20 mx-2" />
          <Button variant="ghost" size="sm" onClick={handleExport} className="text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-1" />
            Ekspordi
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-[#279989]">
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Salvesta
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-16 bg-slate-800 flex flex-col items-center py-4 gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
                activeTool === tool.type ? 'bg-[#279989] text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              title={tool.label}
            >
              {tool.icon}
              <span className="text-[10px] mt-0.5">{tool.label}</span>
            </button>
          ))}

          <div className="w-10 h-px bg-slate-600 my-2" />

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-lg border-2 border-slate-600 hover:border-slate-400"
              style={{ backgroundColor: activeColor }}
            />
            {showColorPicker && (
              <div className="absolute left-14 top-0 bg-slate-800 p-2 rounded-lg shadow-xl z-10 grid grid-cols-7 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color)
                      setShowColorPicker(false)
                    }}
                    className={`w-6 h-6 rounded border ${activeColor === color ? 'border-white' : 'border-slate-600'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stroke width */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <button
              onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400">{strokeWidth}px</span>
            <button
              onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-900 p-4 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-12 h-12 animate-spin text-slate-500" />
          ) : (
            <div
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full cursor-crosshair shadow-2xl"
                style={{ maxHeight: '80vh' }}
              />
            </div>
          )}
        </div>

        {/* Right sidebar for properties */}
        <div className="w-64 bg-slate-800 p-4">
          <h4 className="text-white font-medium mb-4">Tööriista seaded</h4>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Aktiivne tööriist</label>
              <p className="text-white font-medium">{TOOLS.find((t) => t.type === activeTool)?.label}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Värv</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border border-slate-600" style={{ backgroundColor: activeColor }} />
                <span className="text-white text-sm">{activeColor}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Joone paksus</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-sm w-8">{strokeWidth}px</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Suurendus</label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="text-white">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm flex-1 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="text-white">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Märkused ({annotations.length})</label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {annotations.map((ann, i) => (
                  <div key={ann.id} className="text-xs text-slate-300 p-2 bg-slate-700 rounded flex justify-between items-center">
                    <span>{TOOLS.find((t) => t.type === ann.type)?.label} #{i + 1}</span>
                    <button
                      onClick={() => {
                        const newAnnotations = annotations.filter((a) => a.id !== ann.id)
                        setAnnotations(newAnnotations)
                      }}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text input modal */}
      {textPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h4 className="font-semibold mb-4">Lisa tekst</h4>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Sisesta tekst..."
              className="w-full p-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTextPosition(null)
                  setTextInput('')
                }}
                className="flex-1"
              >
                Tühista
              </Button>
              <Button onClick={handleAddText} className="flex-1 bg-[#279989]">
                Lisa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
