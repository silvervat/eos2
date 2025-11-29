'use client'

import Link from 'next/link'
import { FileText, Calendar, Users } from 'lucide-react'

// Mock forms data - will be replaced with real data from Supabase
const mockForms = [
  {
    id: 'form_1',
    name: 'Ehitusprojekti taotlus',
    description: 'Uue ehitusprojekti registreerimise vorm',
    category: 'Projektid',
    responseCount: 45,
    createdAt: '2024-01-15',
    isActive: true,
  },
  {
    id: 'form_2',
    name: 'Töötaja tagasiside',
    description: 'Kvartaalne töötajate rahulolu küsitlus',
    category: 'HR',
    responseCount: 128,
    createdAt: '2024-02-01',
    isActive: true,
  },
  {
    id: 'form_3',
    name: 'Kliendi päring',
    description: 'Uue kliendi hinnapäring ehitusteenustele',
    category: 'Müük',
    responseCount: 67,
    createdAt: '2024-02-15',
    isActive: true,
  },
  {
    id: 'form_4',
    name: 'Ohutuse raport',
    description: 'Tööohutuse intsidendi raporteerimise vorm',
    category: 'Ohutus',
    responseCount: 12,
    createdAt: '2024-03-01',
    isActive: true,
  },
]

export default function FormsListPage() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Avalikud vormid</h1>
        <p className="text-slate-600">Vali vorm mida soovid täita</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockForms.map((form) => (
          <Link
            key={form.id}
            href={`/forms/${form.id}`}
            className="block bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#27998915' }}
              >
                <FileText className="w-6 h-6" style={{ color: '#279989' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  {form.name}
                </h2>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {form.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(form.createdAt).toLocaleDateString('et-EE')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {form.responseCount} vastust
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#27998915', color: '#279989' }}
              >
                {form.category}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
