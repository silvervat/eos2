'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { FormPreview } from '@/components/admin/form-builder/form-preview'
import { FormField, FormSettings, FormTheme } from '@/components/admin/form-builder/types'

// Mock form templates - will be replaced with real data from Supabase
const mockFormTemplates: Record<string, {
  name: string
  description: string
  fields: FormField[]
  settings: FormSettings
  theme: FormTheme
}> = {
  form_1: {
    name: 'Ehitusprojekti taotlus',
    description: 'Uue ehitusprojekti registreerimise vorm',
    fields: [
      {
        id: 'heading_1',
        type: 'heading',
        label: 'Projekti andmed',
        required: false,
        settings: { level: 2 },
      },
      {
        id: 'project_name',
        type: 'text',
        label: 'Projekti nimi',
        placeholder: 'Sisesta projekti nimi',
        required: true,
        width: 'full',
      },
      {
        id: 'project_type',
        type: 'select',
        label: 'Projekti tüüp',
        required: true,
        width: 'half',
        settings: {
          options: [
            { label: 'Eramaja ehitus', value: 'residential' },
            { label: 'Ärihoone ehitus', value: 'commercial' },
            { label: 'Renoveerimine', value: 'renovation' },
            { label: 'Muu', value: 'other' },
          ],
        },
      },
      {
        id: 'start_date',
        type: 'date',
        label: 'Soovitud alguskuupäev',
        required: true,
        width: 'half',
      },
      {
        id: 'divider_1',
        type: 'divider',
        label: '',
        required: false,
      },
      {
        id: 'heading_2',
        type: 'heading',
        label: 'Kontaktandmed',
        required: false,
        settings: { level: 2 },
      },
      {
        id: 'contact_name',
        type: 'text',
        label: 'Kontaktisiku nimi',
        placeholder: 'Eesnimi Perenimi',
        required: true,
        width: 'full',
      },
      {
        id: 'email',
        type: 'email',
        label: 'E-posti aadress',
        placeholder: 'nimi@ettevote.ee',
        required: true,
        width: 'half',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Telefoninumber',
        placeholder: '+372 5xx xxxx',
        required: true,
        width: 'half',
      },
      {
        id: 'company',
        type: 'text',
        label: 'Ettevõtte nimi',
        placeholder: 'OÜ/AS nimi',
        required: false,
        width: 'full',
      },
      {
        id: 'divider_2',
        type: 'divider',
        label: '',
        required: false,
      },
      {
        id: 'heading_3',
        type: 'heading',
        label: 'Projekti kirjeldus',
        required: false,
        settings: { level: 2 },
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Projekti lühikirjeldus',
        placeholder: 'Kirjelda projekti põhilisi nõudeid ja eripärasid...',
        required: true,
        settings: { rows: 5 },
      },
      {
        id: 'budget',
        type: 'select',
        label: 'Eelarve vahemik',
        required: false,
        settings: {
          options: [
            { label: 'Kuni 50 000 €', value: 'under_50k' },
            { label: '50 000 - 100 000 €', value: '50k_100k' },
            { label: '100 000 - 250 000 €', value: '100k_250k' },
            { label: '250 000 - 500 000 €', value: '250k_500k' },
            { label: 'Üle 500 000 €', value: 'over_500k' },
          ],
        },
      },
      {
        id: 'files',
        type: 'file_upload',
        label: 'Lisafailid',
        description: 'Eskiisid, plaanid, fotod vms',
        required: false,
      },
    ],
    settings: {
      submitButtonText: 'Saada taotlus',
      showProgressBar: false,
      savePartialData: true,
      allowMultipleSubmissions: true,
      requireAuth: false,
      captcha: true,
      emailNotifications: true,
      autoSave: true,
      language: 'et',
    },
    theme: {
      primaryColor: '#279989',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: 14,
      borderRadius: 8,
      fieldSpacing: 20,
      labelPosition: 'top',
    },
  },
  form_2: {
    name: 'Töötaja tagasiside',
    description: 'Kvartaalne töötajate rahulolu küsitlus',
    fields: [
      {
        id: 'heading_1',
        type: 'heading',
        label: 'Töötaja tagasiside küsitlus',
        required: false,
        settings: { level: 1 },
      },
      {
        id: 'paragraph_1',
        type: 'paragraph',
        label: 'Palun vastake ausalt - kõik vastused on anonüümsed.',
        required: false,
      },
      {
        id: 'department',
        type: 'select',
        label: 'Osakond',
        required: true,
        settings: {
          options: [
            { label: 'Ehitus', value: 'construction' },
            { label: 'Projektijuhtimine', value: 'pm' },
            { label: 'Müük', value: 'sales' },
            { label: 'Administratsioon', value: 'admin' },
            { label: 'Muu', value: 'other' },
          ],
        },
      },
      {
        id: 'satisfaction',
        type: 'rating',
        label: 'Üldine rahulolu tööga',
        required: true,
        settings: { maxRating: 5 },
      },
      {
        id: 'management',
        type: 'rating',
        label: 'Rahulolu juhtkonnaga',
        required: true,
        settings: { maxRating: 5 },
      },
      {
        id: 'worklife',
        type: 'slider',
        label: 'Töö ja eraelu tasakaal (0 = halb, 100 = suurepärane)',
        required: true,
        settings: { min: 0, max: 100, step: 5 },
      },
      {
        id: 'improvements',
        type: 'checkbox',
        label: 'Mis vajab parandamist?',
        required: false,
        settings: {
          options: [
            { label: 'Kommunikatsioon', value: 'communication' },
            { label: 'Töövahendid', value: 'tools' },
            { label: 'Koolitus', value: 'training' },
            { label: 'Palk ja soodustused', value: 'compensation' },
            { label: 'Töökeskkond', value: 'environment' },
          ],
        },
      },
      {
        id: 'comments',
        type: 'textarea',
        label: 'Vabad kommentaarid',
        placeholder: 'Siia võid kirjutada kõik muu mida soovid jagada...',
        required: false,
        settings: { rows: 4 },
      },
    ],
    settings: {
      submitButtonText: 'Saada vastused',
      showProgressBar: false,
      savePartialData: false,
      allowMultipleSubmissions: false,
      requireAuth: false,
      captcha: false,
      emailNotifications: true,
      autoSave: false,
      language: 'et',
    },
    theme: {
      primaryColor: '#279989',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: 14,
      borderRadius: 8,
      fieldSpacing: 24,
      labelPosition: 'top',
    },
  },
  form_3: {
    name: 'Kliendi päring',
    description: 'Uue kliendi hinnapäring ehitusteenustele',
    fields: [
      {
        id: 'heading_1',
        type: 'heading',
        label: 'Hinnapäring',
        required: false,
        settings: { level: 1 },
      },
      {
        id: 'name',
        type: 'text',
        label: 'Nimi',
        required: true,
        width: 'half',
      },
      {
        id: 'email',
        type: 'email',
        label: 'E-post',
        required: true,
        width: 'half',
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Telefon',
        required: true,
        width: 'half',
      },
      {
        id: 'service',
        type: 'radio',
        label: 'Teenuse tüüp',
        required: true,
        settings: {
          options: [
            { label: 'Uusehitus', value: 'new' },
            { label: 'Renoveerimine', value: 'renovation' },
            { label: 'Remont', value: 'repair' },
            { label: 'Konsultatsioon', value: 'consultation' },
          ],
        },
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Kirjeldus',
        placeholder: 'Kirjelda oma projekti...',
        required: true,
        settings: { rows: 5 },
      },
    ],
    settings: {
      submitButtonText: 'Saada päring',
      showProgressBar: false,
      savePartialData: false,
      allowMultipleSubmissions: true,
      requireAuth: false,
      captcha: true,
      emailNotifications: true,
      autoSave: false,
      language: 'et',
    },
    theme: {
      primaryColor: '#279989',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: 14,
      borderRadius: 8,
      fieldSpacing: 20,
      labelPosition: 'top',
    },
  },
  form_4: {
    name: 'Ohutuse raport',
    description: 'Tööohutuse intsidendi raporteerimise vorm',
    fields: [
      {
        id: 'heading_1',
        type: 'heading',
        label: 'Ohutuse raport',
        required: false,
        settings: { level: 1 },
      },
      {
        id: 'incident_date',
        type: 'datetime',
        label: 'Intsidendi kuupäev ja kellaaeg',
        required: true,
      },
      {
        id: 'location',
        type: 'text',
        label: 'Asukoht',
        placeholder: 'Objekti nimi / aadress',
        required: true,
      },
      {
        id: 'severity',
        type: 'radio',
        label: 'Tõsidus',
        required: true,
        settings: {
          options: [
            { label: 'Madal - peaaegu juhtum', value: 'low' },
            { label: 'Keskmine - väike vigastus', value: 'medium' },
            { label: 'Kõrge - tõsine vigastus', value: 'high' },
            { label: 'Kriitiline - elu ohus', value: 'critical' },
          ],
        },
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Intsidendi kirjeldus',
        placeholder: 'Kirjelda mis juhtus...',
        required: true,
        settings: { rows: 5 },
      },
      {
        id: 'witnesses',
        type: 'text',
        label: 'Tunnistajad',
        placeholder: 'Tunnistajate nimed',
        required: false,
      },
      {
        id: 'photos',
        type: 'file_upload',
        label: 'Fotod',
        description: 'Lisa intsidendi fotod',
        required: false,
      },
    ],
    settings: {
      submitButtonText: 'Saada raport',
      showProgressBar: false,
      savePartialData: true,
      allowMultipleSubmissions: true,
      requireAuth: false,
      captcha: false,
      emailNotifications: true,
      autoSave: true,
      language: 'et',
    },
    theme: {
      primaryColor: '#dc2626',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: 14,
      borderRadius: 8,
      fieldSpacing: 20,
      labelPosition: 'top',
    },
  },
}

export default function FormFillPage() {
  const params = useParams()
  const formId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState<typeof mockFormTemplates[string] | null>(null)

  useEffect(() => {
    // Simulate loading from database
    const timer = setTimeout(() => {
      const formData = mockFormTemplates[formId]
      setForm(formData || null)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [formId])

  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log('Form submitted:', data)
    // Here you would send the data to Supabase
    // await supabase.from('form_submissions').insert({ form_id: formId, data })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        <p className="mt-4 text-slate-600">Laadin vormi...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Vormi ei leitud</h1>
        <p className="text-slate-600 mb-6">
          Kahjuks ei leidnud me otsitavat vormi. See võib olla kustutatud või suletud.
        </p>
        <Link
          href="/forms"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#279989', color: '#fff' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Tagasi vormide juurde
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Link
        href="/forms"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tagasi
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div
          className="px-6 py-8 text-center"
          style={{ backgroundColor: `${form.theme.primaryColor}10` }}
        >
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-slate-600">{form.description}</p>
          )}
        </div>

        <div className="p-6">
          <FormPreview
            fields={form.fields}
            settings={form.settings}
            theme={form.theme}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
