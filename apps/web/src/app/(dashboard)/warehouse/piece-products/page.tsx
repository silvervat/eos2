'use client'

import { useState, useEffect } from 'react'
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Barcode,
  MapPin,
} from 'lucide-react'
import { Button } from '@rivest/ui'

interface PieceProduct {
  id: string
  code: string
  name: string
  category: string
  quantity: number
  unit: string
  location: string
  barcode?: string
  minStock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export default function PieceProductsPage() {
  const [products, setProducts] = useState<PieceProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    // Mock data
    setProducts([
      { id: '1', code: 'PP-001', name: 'Kruvid 4x40mm', category: 'Kinnitused', quantity: 5000, unit: 'tk', location: 'Riiuli A1', barcode: '5901234567890', minStock: 1000, status: 'in_stock' },
      { id: '2', code: 'PP-002', name: 'Poldid M8x50', category: 'Kinnitused', quantity: 250, unit: 'tk', location: 'Riiuli A2', minStock: 500, status: 'low_stock' },
      { id: '3', code: 'PP-003', name: 'Mutrid M8', category: 'Kinnitused', quantity: 0, unit: 'tk', location: 'Riiuli A2', minStock: 200, status: 'out_of_stock' },
      { id: '4', code: 'PP-004', name: 'Kaabel 3x2.5mm', category: 'Elekter', quantity: 500, unit: 'm', location: 'Riiuli B1', minStock: 100, status: 'in_stock' },
      { id: '5', code: 'PP-005', name: 'Toru 50mm', category: 'Sanitaar', quantity: 120, unit: 'm', location: 'Riiuli C1', minStock: 50, status: 'in_stock' },
    ])
    setIsLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-700'
      case 'low_stock': return 'bg-yellow-100 text-yellow-700'
      case 'out_of_stock': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Laos'
      case 'low_stock': return 'Madal'
      case 'out_of_stock': return 'Otsas'
      default: return status
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5" style={{ color: '#279989' }} />
            Tükitooted
          </h1>
          <p className="text-sm text-slate-500">{filteredProducts.length} toodet</p>
        </div>
        <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#279989' }}>
          <Plus className="w-4 h-4" />
          Lisa toode
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi koodi või nime järgi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Kõik kategooriad</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left">Kood</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left">Nimetus</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left hidden md:table-cell">Kategooria</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-right">Kogus</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left hidden lg:table-cell">Asukoht</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-center">Staatus</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="h-10 hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{product.code}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-xs font-medium text-slate-900">{product.name}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-600 hidden md:table-cell">{product.category}</td>
                  <td className="px-3 py-1.5 text-xs text-right">
                    <span className="font-medium">{product.quantity}</span>
                    <span className="text-slate-500 ml-1">{product.unit}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-600 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <button className="p-1 rounded hover:bg-slate-100">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
