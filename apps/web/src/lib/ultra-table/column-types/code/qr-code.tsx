'use client'

import { QrCode } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const QRCodeColumn: ColumnTypeDefinition = {
  type: 'qr_code',
  name: 'QR Code',
  description: 'QR code generator',
  category: 'code',
  icon: QrCode,
  defaultConfig: { qrCode: { size: 64, includeText: false } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    return (
      <div className="flex items-center gap-2">
        <QrCode className="h-6 w-6 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-[100px]">{value}</span>
      </div>
    )
  },
  format: (value) => value || '',
  supportedAggregations: ['count'],
}
