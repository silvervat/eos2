'use client'

import Link from 'next/link'
import { ServiceCatalog } from '@/components/quotes'

export default function ArticlesPage() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
        <span>/</span>
        <span>Artiklid</span>
      </div>

      {/* Service Catalog Component */}
      <ServiceCatalog
        onSelect={(article) => {
          // In standalone view, just show a notification
          console.log('Selected article:', article)
        }}
      />
    </div>
  )
}
