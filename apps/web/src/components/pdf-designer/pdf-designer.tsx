'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Designer } from '@pdfme/ui'
import type { Template, Font } from '@pdfme/common'
import { pdfmePlugins, createBlankTemplate, DEMO_TEMPLATES } from '@/lib/pdf/pdfme-config'
import { CATEGORY_LABELS, PDFTemplateCategory, PageSize, PAGE_SIZES } from '@/lib/pdf/types'
import { Button } from '@rivest/ui'
import {
  Save,
  Download,
  Eye,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  FileText,
  Image,
  Table2,
  Type,
  QrCode,
  Minus,
  Square,
  Circle,
  Calendar,
  Clock,
  Barcode,
  LayoutTemplate,
  Settings,
  Trash2,
  Copy,
  Plus,
} from 'lucide-react'

interface PDFDesignerProps {
  initialTemplate?: Template
  templateId?: string
  templateName?: string
  category?: PDFTemplateCategory
  onSave?: (template: Template, name: string, category: PDFTemplateCategory) => void
  onPreview?: (template: Template) => void
  readOnly?: boolean
}

// Schema palette items
const SCHEMA_PALETTE = [
  { type: 'Text', label: 'Tekst', icon: Type, color: '#3b82f6' },
  { type: 'Image', label: 'Pilt', icon: Image, color: '#22c55e' },
  { type: 'Table', label: 'Tabel', icon: Table2, color: '#f59e0b' },
  { type: 'QRCode', label: 'QR kood', icon: QrCode, color: '#8b5cf6' },
  { type: 'Barcode128', label: 'Triipkood', icon: Barcode, color: '#6366f1' },
  { type: 'Line', label: 'Joon', icon: Minus, color: '#64748b' },
  { type: 'Rectangle', label: 'Ristkülik', icon: Square, color: '#64748b' },
  { type: 'Ellipse', label: 'Ellips', icon: Circle, color: '#64748b' },
  { type: 'Date', label: 'Kuupäev', icon: Calendar, color: '#ec4899' },
  { type: 'Time', label: 'Kellaaeg', icon: Clock, color: '#ec4899' },
]

export function PDFDesigner({
  initialTemplate,
  templateId,
  templateName = 'Uus mall',
  category = 'other',
  onSave,
  onPreview,
  readOnly = false,
}: PDFDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const designerRef = useRef<Designer | null>(null)

  const [name, setName] = useState(templateName)
  const [selectedCategory, setSelectedCategory] = useState<PDFTemplateCategory>(category)
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [zoom, setZoom] = useState(100)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedSchemaType, setSelectedSchemaType] = useState<string | null>(null)

  // Initialize designer
  useEffect(() => {
    if (!containerRef.current) return

    const template = initialTemplate || createBlankTemplate(pageSize, orientation)

    const designer = new Designer({
      domContainer: containerRef.current,
      template,
      options: {
        theme: {
          token: {
            colorPrimary: '#279989',
          },
        },
        lang: 'en', // pdfme only supports en/ja/zh/ko - we'll add custom labels
        labels: {
          // Custom labels would go here if pdfme supported Estonian
        },
      },
      plugins: pdfmePlugins,
    })

    designer.onChangeTemplate(() => {
      setHasChanges(true)
    })

    designerRef.current = designer

    return () => {
      if (designerRef.current) {
        designerRef.current.destroy()
      }
    }
  }, [])

  // Update template when page size/orientation changes
  useEffect(() => {
    if (!designerRef.current || !initialTemplate) return

    const currentTemplate = designerRef.current.getTemplate()
    const size = PAGE_SIZES[pageSize]
    const width = orientation === 'portrait' ? size.width : size.height
    const height = orientation === 'portrait' ? size.height : size.width

    // basePdf can be a string (base64) or an object with dimensions
    const basePdf = typeof currentTemplate.basePdf === 'object'
      ? { ...currentTemplate.basePdf, width, height }
      : { width, height, padding: [10, 10, 10, 10] as [number, number, number, number] }

    const updatedTemplate: Template = {
      ...currentTemplate,
      basePdf,
    }

    designerRef.current.updateTemplate(updatedTemplate)
  }, [pageSize, orientation])

  // Handle save
  const handleSave = useCallback(() => {
    if (!designerRef.current || !onSave) return

    const template = designerRef.current.getTemplate()
    onSave(template, name, selectedCategory)
    setHasChanges(false)
  }, [name, selectedCategory, onSave])

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!designerRef.current || !onPreview) return

    const template = designerRef.current.getTemplate()
    onPreview(template)
  }, [onPreview])

  // Handle zoom (CSS transform based - pdfme doesn't have built-in zoom)
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200)
    setZoom(newZoom)
    // Apply zoom via CSS transform on the container
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('.pdfme-designer-canvas')
      if (canvas) {
        (canvas as HTMLElement).style.transform = `scale(${newZoom / 100})`
        ;(canvas as HTMLElement).style.transformOrigin = 'top left'
      }
    }
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50)
    setZoom(newZoom)
    // Apply zoom via CSS transform on the container
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('.pdfme-designer-canvas')
      if (canvas) {
        (canvas as HTMLElement).style.transform = `scale(${newZoom / 100})`
        ;(canvas as HTMLElement).style.transformOrigin = 'top left'
      }
    }
  }

  // Add schema to template
  const handleAddSchema = (schemaType: string) => {
    if (!designerRef.current) return

    const template = designerRef.current.getTemplate()
    const schemas = [...template.schemas]

    // Default schema properties based on type
    const defaultSchemas: Record<string, object> = {
      Text: {
        type: 'text',
        name: `text_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 100,
        height: 20,
        content: 'Tekst',
        fontSize: 12,
        fontColor: '#1e293b',
      },
      Image: {
        type: 'image',
        name: `image_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 50,
        height: 50,
      },
      Table: {
        type: 'table',
        name: `table_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 170,
        height: 60,
        showHead: true,
        head: [['Veerg 1', 'Veerg 2', 'Veerg 3']],
        headStyles: {
          fontSize: 10,
          fontColor: '#ffffff',
          backgroundColor: '#279989',
        },
        bodyStyles: {
          fontSize: 10,
          fontColor: '#1e293b',
        },
      },
      QRCode: {
        type: 'qrcode',
        name: `qrcode_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 30,
        height: 30,
      },
      Barcode128: {
        type: 'code128',
        name: `barcode_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 60,
        height: 20,
      },
      Line: {
        type: 'line',
        name: `line_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 100,
        height: 1,
        color: '#e2e8f0',
      },
      Rectangle: {
        type: 'rectangle',
        name: `rectangle_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 60,
        height: 40,
        color: '#f1f5f9',
        borderColor: '#e2e8f0',
        borderWidth: 1,
      },
      Ellipse: {
        type: 'ellipse',
        name: `ellipse_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 40,
        height: 40,
        color: '#f1f5f9',
        borderColor: '#e2e8f0',
        borderWidth: 1,
      },
      Date: {
        type: 'date',
        name: `date_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 60,
        height: 15,
        format: 'DD.MM.YYYY',
        fontSize: 10,
      },
      Time: {
        type: 'time',
        name: `time_${Date.now()}`,
        position: { x: 20, y: 20 },
        width: 40,
        height: 15,
        format: 'HH:mm',
        fontSize: 10,
      },
    }

    const newSchema = defaultSchemas[schemaType]
    if (newSchema && schemas[0]) {
      schemas[0] = [...schemas[0], newSchema as any]
      designerRef.current.updateTemplate({
        ...template,
        schemas,
      })
      setHasChanges(true)
    }
  }

  // Load demo template
  const handleLoadDemo = (demoType: keyof typeof DEMO_TEMPLATES) => {
    if (!designerRef.current) return

    const templateFn = DEMO_TEMPLATES[demoType]
    if (templateFn) {
      const template = typeof templateFn === 'function' ? templateFn() : templateFn
      designerRef.current.updateTemplate(template)
      setHasChanges(true)

      // Update category based on demo type
      if (demoType === 'invoice') {
        setSelectedCategory('invoice')
        setName('Arve mall')
      } else if (demoType === 'additional_work') {
        setSelectedCategory('additional_work')
        setName('Lisatöö mall')
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Template info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-medium text-slate-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-[#279989] rounded px-2 py-1"
                placeholder="Malli nimi"
                disabled={readOnly}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PDFTemplateCategory)}
              className="text-sm text-slate-600 border border-slate-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#279989]"
              disabled={readOnly}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Center - Page settings */}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              className="text-sm border border-slate-200 rounded-md px-2 py-1"
              disabled={readOnly}
            >
              {Object.keys(PAGE_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <div className="flex border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-3 py-1 text-sm ${
                  orientation === 'portrait'
                    ? 'bg-[#279989] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                disabled={readOnly}
              >
                Püstine
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-3 py-1 text-sm ${
                  orientation === 'landscape'
                    ? 'bg-[#279989] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                disabled={readOnly}
              >
                Rõhtne
              </button>
            </div>

            <div className="flex items-center gap-1 border border-slate-200 rounded-md">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-100 rounded-l-md"
                title="Vähenda"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 px-2 min-w-[50px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-100 rounded-r-md"
                title="Suurenda"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Demo templates dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-1">
                <LayoutTemplate className="w-4 h-4" />
                Demo mallid
              </Button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-50">
                <button
                  onClick={() => handleLoadDemo('blank')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-t-lg"
                >
                  Tühi mall
                </button>
                <button
                  onClick={() => handleLoadDemo('invoice')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  Arve mall
                </button>
                <button
                  onClick={() => handleLoadDemo('additional_work')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-b-lg"
                >
                  Lisatöö mall
                </button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="gap-1"
            >
              <Eye className="w-4 h-4" />
              Eelvaade
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={readOnly}
              className="gap-1 bg-[#279989] hover:bg-[#1e7a6d]"
            >
              <Save className="w-4 h-4" />
              Salvesta
              {hasChanges && <span className="w-2 h-2 bg-white rounded-full" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Schema palette */}
        {!readOnly && (
          <div className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Elemendid
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Klõpsa elemendil, et lisada see mallile
            </p>

            <div className="grid grid-cols-2 gap-2">
              {SCHEMA_PALETTE.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddSchema(item.type)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    selectedSchemaType === item.type
                      ? 'border-[#279989] bg-[#279989]/5'
                      : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: item.color }}
                  />
                  <span className="text-xs text-slate-600">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Kiirklahvid
              </h4>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Kustuta</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                    Delete
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Kopeeri</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                    Ctrl+C
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Kleebi</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                    Ctrl+V
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Võta tagasi</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                    Ctrl+Z
                  </kbd>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Näpunäited
              </h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex gap-2">
                  <span className="text-[#279989]">•</span>
                  Lohista elemente paigutamiseks
                </li>
                <li className="flex gap-2">
                  <span className="text-[#279989]">•</span>
                  Tõmba nurki suuruse muutmiseks
                </li>
                <li className="flex gap-2">
                  <span className="text-[#279989]">•</span>
                  Topeltklõps teksti muutmiseks
                </li>
                <li className="flex gap-2">
                  <span className="text-[#279989]">•</span>
                  Kasuta nurkade juhikuid joondamiseks
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Designer canvas */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>
    </div>
  )
}

export default PDFDesigner
