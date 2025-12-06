'use client'

import React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Hammer,
  Layers,
  BookOpen,
  ShoppingCart,
  Truck,
  PlusCircle,
  FileText,
  Wrench,
  BarChart3,
  ListChecks,
  Box,
  PenTool,
  Calendar,
  Share2,
  CalendarDays,
  CheckSquare,
  FileCheck,
  Building,
  Users,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

export default function MontaazProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.id as string

  const baseUrl = `/projects/montaaz/${projectId}`

  const navItems: NavItem[] = [
    { href: baseUrl, label: 'Ülevaade', icon: Hammer },
    { href: `${baseUrl}/uleesanded`, label: 'Ülesanded', icon: CheckSquare },
    { href: `${baseUrl}/detailplaan`, label: 'Detailplaan', icon: CalendarDays },
    { href: `${baseUrl}/susteemid`, label: 'Süsteemid', icon: Layers },
    { href: `${baseUrl}/etp`, label: 'ETP', icon: BookOpen },
    { href: `${baseUrl}/aktid`, label: 'Aktid', icon: FileCheck },
    { href: `${baseUrl}/tellimused`, label: 'Tellimused', icon: ShoppingCart },
    { href: `${baseUrl}/tarned`, label: 'Tarned', icon: Truck },
    { href: `${baseUrl}/lisatood`, label: 'Lisatööd', icon: PlusCircle },
    { href: `${baseUrl}/lepingud/tellija`, label: 'Tellija lepingud', icon: Building },
    { href: `${baseUrl}/lepingud/atv`, label: 'ATV lepingud', icon: Users },
    { href: `${baseUrl}/teenused`, label: 'Teenused', icon: Wrench },
    { href: `${baseUrl}/teostatud-mahud`, label: 'Teostatud mahud', icon: BarChart3 },
    { href: `${baseUrl}/spetsifikatsioonid`, label: 'Spetsifikatsioonid', icon: ListChecks },
    { href: `${baseUrl}/trimble-connect`, label: 'Trimble Connect', icon: Box },
    { href: `${baseUrl}/joonised`, label: 'Joonised', icon: PenTool },
    { href: `${baseUrl}/graafikud`, label: 'Graafikud', icon: Calendar },
    { href: `${baseUrl}/tellijale-jagatud`, label: 'Tellijale jagatud', icon: Share2 },
  ]

  const isActive = (href: string) => {
    if (href === baseUrl) {
      return pathname === baseUrl
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects/montaaz"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Hammer className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Montaaži projekt</h1>
            <p className="text-gray-500 text-sm">Projekti detailid ja haldus</p>
          </div>
        </div>
      </div>

      {/* Navigation tabs - horizontal scrollable */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex border-b min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-[#279989] text-[#279989] bg-[#279989]/5'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
