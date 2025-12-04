'use client'

import Link from 'next/link'
import { UnitsManager } from '@/components/quotes'

export default function UnitsPage() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
        <span>/</span>
        <span>Ühikud</span>
      </div>

      {/* Units Manager Component */}
      <UnitsManager />
    </div>
  )
}
