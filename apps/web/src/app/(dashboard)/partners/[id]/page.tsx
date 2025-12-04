'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Users,
  FileText,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Loader2,
  User,
  MoreVertical,
} from 'lucide-react'
import { Button, Card, Input } from '@rivest/ui'

interface Partner {
  id: string
  name: string
  registryCode?: string
  vatNumber?: string
  type: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  bankAccount?: string
  paymentTermDays?: number
  creditLimit?: number
  notes?: string
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  position?: string
  department?: string
  isPrimary: boolean
  isBillingContact: boolean
}

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  status: string
  total: number
  issueDate: string
}

interface Project {
  id: string
  code: string
  name: string
  status: string
}

interface Stats {
  totalInvoices: number
  sentInvoices: number
  receivedInvoices: number
  paidInvoices: number
  totalRevenue: number
  totalExpenses: number
  projectsCount: number
}

const typeLabels: Record<string, string> = {
  client: 'Klient',
  supplier: 'Tarnija',
  subcontractor: 'Alltöövõtja',
  partner: 'Partner',
  manufacturer: 'Tootja',
}

const statusLabels: Record<string, string> = {
  draft: 'Mustand',
  sent: 'Saadetud',
  paid: 'Makstud',
  overdue: 'Tähtaeg ületatud',
  active: 'Aktiivne',
  completed: 'Lõpetatud',
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function PartnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'invoices' | 'projects'>('overview')
  const [showAddContact, setShowAddContact] = useState(false)

  // Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    isPrimary: false,
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)

  const fetchPartner = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/partners/${partnerId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch partner')
      }

      setPartner(data.partner)
      setContacts(data.contacts || [])
      setInvoices(data.invoices || [])
      setProjects(data.projects || [])
      setStats(data.stats || null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId])

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)

    try {
      const response = await fetch(`/api/partners/${partnerId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contact')
      }

      setShowAddContact(false)
      setContactForm({ firstName: '', lastName: '', email: '', phone: '', mobile: '', position: '', isPrimary: false })
      fetchPartner()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSubmittingContact(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Partner not found'}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Tagasi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{partner.name}</h1>
              <span className="px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                {typeLabels[partner.type] || partner.type}
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              {partner.registryCode && `Reg: ${partner.registryCode}`}
              {partner.vatNumber && ` | KMKR: ${partner.vatNumber}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tulud</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Kulud</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalExpenses)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Arved</p>
                <p className="text-lg font-bold text-slate-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Projektid</p>
                <p className="text-lg font-bold text-slate-900">{stats.projectsCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['overview', 'contacts', 'invoices', 'projects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'overview' && 'Ülevaade'}
            {tab === 'contacts' && `Kontaktid (${contacts.length})`}
            {tab === 'invoices' && `Arved (${invoices.length})`}
            {tab === 'projects' && `Projektid (${projects.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Kontaktandmed</h3>
            <div className="space-y-3">
              {partner.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${partner.email}`} className="text-[#279989] hover:underline">
                    {partner.email}
                  </a>
                </div>
              )}
              {partner.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${partner.phone}`} className="text-[#279989] hover:underline">
                    {partner.phone}
                  </a>
                </div>
              )}
              {(partner.address || partner.city) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">
                    {[partner.address, partner.city, partner.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {partner.bankAccount && (
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{partner.bankAccount}</span>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Maksetingimused</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Maksetähtaeg</span>
                <span className="text-slate-900">{partner.paymentTermDays || 14} päeva</span>
              </div>
              {partner.creditLimit && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Krediidilimiit</span>
                  <span className="text-slate-900">{formatCurrency(partner.creditLimit)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">Kontaktisikud</h3>
            <Button onClick={() => setShowAddContact(true)} size="sm" className="gap-1" style={{ backgroundColor: '#279989' }}>
              <Plus className="w-4 h-4" />
              Lisa kontakt
            </Button>
          </div>
          <Card>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Kontakte pole lisatud
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.isPrimary && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Peamine</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{contact.position}</p>
                    </div>
                    <div className="text-sm text-slate-500 text-right">
                      {contact.email && <p>{contact.email}</p>}
                      {contact.phone && <p>{contact.phone}</p>}
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <Card>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Arveid pole</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50"
                >
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-500">{invoice.issueDate}</p>
                  </div>
                  <span className="text-sm text-slate-500">{invoice.type === 'sales' ? 'Müük' : 'Ost'}</span>
                  <span className="font-medium text-slate-900">{formatCurrency(Number(invoice.total))}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Projekte pole</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50"
                >
                  <FolderOpen className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">{project.code}</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                    {statusLabels[project.status] || project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <form onSubmit={handleAddContact}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lisa kontakt</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Eesnimi *</label>
                      <Input
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Perenimi *</label>
                      <Input
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                      <Input
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobiil</label>
                      <Input
                        value={contactForm.mobile}
                        onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ametikoht</label>
                    <Input
                      value={contactForm.position}
                      onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={contactForm.isPrimary}
                      onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="isPrimary" className="text-sm text-slate-700">Peamine kontakt</label>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowAddContact(false)} className="flex-1">
                  Tühista
                </Button>
                <Button
                  type="submit"
                  disabled={!contactForm.firstName || !contactForm.lastName || isSubmittingContact}
                  className="flex-1 bg-[#279989] text-white"
                >
                  {isSubmittingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lisa kontakt'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
