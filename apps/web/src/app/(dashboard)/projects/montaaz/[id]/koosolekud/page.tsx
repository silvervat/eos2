'use client'

/**
 * Montaaž Project - Koosolekud (Meetings)
 * Meeting protocols with different meeting types, attendees, and topic tracking
 */

import React, { useState, useMemo } from 'react'
import {
  MessageSquareMore,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  Building,
  Building2,
  User,
  X,
  Eye,
  Edit2,
  FileText,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  MapPin,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react'

type MeetingType = 'rivest_internal' | 'rivest_client' | 'rivest_atv'

interface MeetingTopic {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'deferred'
  responsible?: string
  deadline?: string
  fromPreviousMeeting: boolean
}

interface Attendee {
  id: string
  name: string
  company: string
  role: string
  present: boolean
}

interface Meeting {
  id: string
  type: MeetingType
  meetingNumber: number
  title: string
  date: string
  time: string
  location: string
  attendees: Attendee[]
  topics: MeetingTopic[]
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdBy: string
  protocol?: string
}

interface AtvCompany {
  id: string
  name: string
}

const mockAtvCompanies: AtvCompany[] = [
  { id: '1', name: 'Soojus OÜ' },
  { id: '2', name: 'Elekter Plus AS' },
  { id: '3', name: 'Ventilatsioon Pro OÜ' },
  { id: '4', name: 'Torustik OÜ' },
  { id: '5', name: 'Isolatsioon AS' },
]

const meetingTypeConfig: Record<MeetingType, { label: string; shortLabel: string; color: string; bg: string; icon: React.ElementType }> = {
  rivest_internal: { label: 'Rivest sisemine', shortLabel: 'Sisemine', color: 'text-blue-700', bg: 'bg-blue-100', icon: Building },
  rivest_client: { label: 'Rivest - Tellija', shortLabel: 'Tellija', color: 'text-green-700', bg: 'bg-green-100', icon: Building2 },
  rivest_atv: { label: 'Rivest - ATV', shortLabel: 'ATV', color: 'text-purple-700', bg: 'bg-purple-100', icon: Users },
}

const topicStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open: { label: 'Avatud', color: 'text-red-700', bg: 'bg-red-100', icon: Circle },
  in_progress: { label: 'Töös', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  resolved: { label: 'Lahendatud', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  deferred: { label: 'Edasi lükatud', color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle },
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    type: 'rivest_client',
    meetingNumber: 15,
    title: 'Objektikoosolek nr 15',
    date: '2024-03-15',
    time: '10:00',
    location: 'Ehitusobjekt, kontor',
    attendees: [
      { id: '1', name: 'Jaan Tamm', company: 'Rivest', role: 'Projektijuht', present: true },
      { id: '2', name: 'Mari Mets', company: 'Rivest', role: 'Objektijuht', present: true },
      { id: '3', name: 'Andrus Kask', company: 'Tellija OÜ', role: 'Objektijuht', present: true },
      { id: '4', name: 'Kati Lepp', company: 'Tellija OÜ', role: 'Projektijuht', present: false },
    ],
    topics: [
      { id: '1', title: 'Jahutussüsteemi tarne hilinemine', description: 'Tarne hilineb 2 nädalat', status: 'in_progress', responsible: 'Jaan Tamm', deadline: '2024-03-20', fromPreviousMeeting: true },
      { id: '2', title: 'Ventilatsiooni isolatsioon', description: 'Isolatsioonitööd 3. korrusel lõpetatud', status: 'resolved', fromPreviousMeeting: true },
      { id: '3', title: 'Elektritööde koordineerimine', description: 'Elektritööde ajakava kooskõlastamine', status: 'open', responsible: 'Mari Mets', deadline: '2024-03-18', fromPreviousMeeting: false },
    ],
    notes: 'Järgmine koosolek 22.03.2024 kell 10:00',
    status: 'completed',
    createdBy: 'Jaan Tamm',
    protocol: '/protocols/meeting-15.pdf',
  },
  {
    id: '2',
    type: 'rivest_atv',
    meetingNumber: 8,
    title: 'ATV koosolek - Ventilatsioon Pro',
    date: '2024-03-14',
    time: '14:00',
    location: 'Ehitusobjekt, 2. korrus',
    attendees: [
      { id: '1', name: 'Mari Mets', company: 'Rivest', role: 'Objektijuht', present: true },
      { id: '2', name: 'Peeter Kivi', company: 'Ventilatsioon Pro OÜ', role: 'Tööjuht', present: true },
      { id: '3', name: 'Toomas Saar', company: 'Ventilatsioon Pro OÜ', role: 'Meister', present: true },
    ],
    topics: [
      { id: '1', title: 'Kanalite paigaldus 4. korrus', description: 'Kanalite paigalduse ajakava', status: 'in_progress', responsible: 'Peeter Kivi', deadline: '2024-03-25', fromPreviousMeeting: true },
      { id: '2', title: 'Materjalide tarne', description: 'Flexide tarne nädal hilineb', status: 'open', responsible: 'Peeter Kivi', fromPreviousMeeting: false },
    ],
    status: 'completed',
    createdBy: 'Mari Mets',
    protocol: '/protocols/atv-meeting-8.pdf',
  },
  {
    id: '3',
    type: 'rivest_internal',
    meetingNumber: 22,
    title: 'Sisekoosolek nr 22',
    date: '2024-03-18',
    time: '09:00',
    location: 'Rivest kontor',
    attendees: [
      { id: '1', name: 'Jaan Tamm', company: 'Rivest', role: 'Projektijuht', present: true },
      { id: '2', name: 'Mari Mets', company: 'Rivest', role: 'Objektijuht', present: true },
      { id: '3', name: 'Tiit Lepp', company: 'Rivest', role: 'Meister', present: true },
      { id: '4', name: 'Kati Sepp', company: 'Rivest', role: 'Eelarvestaja', present: true },
    ],
    topics: [
      { id: '1', title: 'Nädala tööplaan', description: 'Järgmise nädala tegevuste planeerimine', status: 'open', fromPreviousMeeting: false },
      { id: '2', title: 'Ressursside vajadus', description: 'Lisatööjõu vajadus aprilliks', status: 'open', responsible: 'Jaan Tamm', fromPreviousMeeting: false },
    ],
    status: 'scheduled',
    createdBy: 'Jaan Tamm',
  },
  {
    id: '4',
    type: 'rivest_client',
    meetingNumber: 14,
    title: 'Objektikoosolek nr 14',
    date: '2024-03-08',
    time: '10:00',
    location: 'Ehitusobjekt, kontor',
    attendees: [
      { id: '1', name: 'Jaan Tamm', company: 'Rivest', role: 'Projektijuht', present: true },
      { id: '2', name: 'Andrus Kask', company: 'Tellija OÜ', role: 'Objektijuht', present: true },
      { id: '3', name: 'Kati Lepp', company: 'Tellija OÜ', role: 'Projektijuht', present: true },
    ],
    topics: [
      { id: '1', title: 'Jahutussüsteemi tarne hilinemine', description: 'Tarne võimalik hilinemine', status: 'in_progress', responsible: 'Jaan Tamm', fromPreviousMeeting: false },
      { id: '2', title: 'Ventilatsiooni isolatsioon', description: 'Isolatsioonitööde seis', status: 'in_progress', fromPreviousMeeting: true },
    ],
    status: 'completed',
    createdBy: 'Jaan Tamm',
    protocol: '/protocols/meeting-14.pdf',
  },
]

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [expandedMeetings, setExpandedMeetings] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    type: 'rivest_client' as MeetingType,
    title: '',
    date: '',
    time: '',
    location: '',
    atvCompanyId: '',
  })
  const [formAttendees, setFormAttendees] = useState<Attendee[]>([])
  const [formTopics, setFormTopics] = useState<MeetingTopic[]>([])

  // Stats
  const stats = useMemo(() => {
    const total = meetings.length
    const completed = meetings.filter(m => m.status === 'completed').length
    const scheduled = meetings.filter(m => m.status === 'scheduled').length
    const internal = meetings.filter(m => m.type === 'rivest_internal').length
    const client = meetings.filter(m => m.type === 'rivest_client').length
    const atv = meetings.filter(m => m.type === 'rivest_atv').length
    return { total, completed, scheduled, internal, client, atv }
  }, [meetings])

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch = search === '' ||
        meeting.title.toLowerCase().includes(search.toLowerCase()) ||
        meeting.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()))
      const matchesType = typeFilter === 'all' || meeting.type === typeFilter
      const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [meetings, search, typeFilter, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const toggleMeetingExpand = (meetingId: string) => {
    setExpandedMeetings(prev =>
      prev.includes(meetingId)
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId]
    )
  }

  const getOpenTopicsFromPreviousMeetings = (meetingType: MeetingType) => {
    return meetings
      .filter(m => m.type === meetingType && m.status === 'completed')
      .flatMap(m => m.topics)
      .filter(t => t.status === 'open' || t.status === 'in_progress')
  }

  const addAttendee = () => {
    setFormAttendees(prev => [...prev, {
      id: String(prev.length + 1),
      name: '',
      company: '',
      role: '',
      present: true,
    }])
  }

  const removeAttendee = (index: number) => {
    setFormAttendees(prev => prev.filter((_, i) => i !== index))
  }

  const updateAttendee = (index: number, field: keyof Attendee, value: string | boolean) => {
    setFormAttendees(prev => prev.map((att, i) =>
      i === index ? { ...att, [field]: value } : att
    ))
  }

  const addTopic = () => {
    setFormTopics(prev => [...prev, {
      id: String(prev.length + 1),
      title: '',
      description: '',
      status: 'open',
      fromPreviousMeeting: false,
    }])
  }

  const removeTopic = (index: number) => {
    setFormTopics(prev => prev.filter((_, i) => i !== index))
  }

  const updateTopic = (index: number, field: keyof MeetingTopic, value: string) => {
    setFormTopics(prev => prev.map((topic, i) =>
      i === index ? { ...topic, [field]: value } : topic
    ))
  }

  const resetForm = () => {
    setFormData({
      type: 'rivest_client',
      title: '',
      date: '',
      time: '',
      location: '',
      atvCompanyId: '',
    })
    setFormAttendees([])
    setFormTopics([])
  }

  // Get next meeting number for type
  const getNextMeetingNumber = (type: MeetingType) => {
    const typeMeetings = meetings.filter(m => m.type === type)
    return typeMeetings.length > 0 ? Math.max(...typeMeetings.map(m => m.meetingNumber)) + 1 : 1
  }

  const handleAddMeeting = () => {
    const meetingNumber = getNextMeetingNumber(formData.type)
    const typeConfig = meetingTypeConfig[formData.type]

    const newMeeting: Meeting = {
      id: String(meetings.length + 1),
      type: formData.type,
      meetingNumber,
      title: formData.title || `${typeConfig.label} koosolek nr ${meetingNumber}`,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      attendees: formAttendees,
      topics: formTopics,
      status: 'scheduled',
      createdBy: 'Praegune kasutaja',
    }

    setMeetings(prev => [newMeeting, ...prev])
    setShowAddModal(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Koosolekud</h2>
          <p className="text-gray-500 text-sm">Koosolekute protokollid ja teemade jälgimine</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Uus koosolek
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kokku</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <MessageSquareMore className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tellija koosolekud</p>
              <p className="text-2xl font-bold text-green-600">{stats.client}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ATV koosolekud</p>
              <p className="text-2xl font-bold text-purple-600">{stats.atv}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Planeeritud</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi koosolekuid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik tüübid</option>
            <option value="rivest_internal">Rivest sisemine</option>
            <option value="rivest_client">Rivest - Tellija</option>
            <option value="rivest_atv">Rivest - ATV</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik staatused</option>
            <option value="scheduled">Planeeritud</option>
            <option value="completed">Toimunud</option>
            <option value="cancelled">Tühistatud</option>
          </select>
        </div>
      </div>

      {/* Meetings list */}
      <div className="space-y-4">
        {filteredMeetings.map(meeting => {
          const typeConfig = meetingTypeConfig[meeting.type]
          const TypeIcon = typeConfig.icon
          const isExpanded = expandedMeetings.includes(meeting.id)
          const openTopics = meeting.topics.filter(t => t.status === 'open' || t.status === 'in_progress').length

          return (
            <div key={meeting.id} className="bg-white rounded-lg border overflow-hidden">
              {/* Meeting header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleMeetingExpand(meeting.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${typeConfig.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${typeConfig.bg} ${typeConfig.color}`}>
                          {typeConfig.shortLabel}
                        </span>
                        {meeting.status === 'scheduled' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            Planeeritud
                          </span>
                        )}
                        {meeting.status === 'completed' && meeting.protocol && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Protokoll
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meeting.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.attendees.filter(a => a.present).length}/{meeting.attendees.length} kohal
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {openTopics > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {openTopics} avatud teemat
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t">
                  {/* Attendees */}
                  <div className="p-4 bg-gray-50 border-b">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Osalejad</h4>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.map(attendee => (
                        <span
                          key={attendee.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                            attendee.present
                              ? 'bg-white border border-gray-200'
                              : 'bg-gray-200 text-gray-500 line-through'
                          }`}
                        >
                          {attendee.present && <Check className="w-3 h-3 text-green-500" />}
                          <span className="font-medium">{attendee.name}</span>
                          <span className="text-gray-500">({attendee.company})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Teemad</h4>
                    <div className="space-y-2">
                      {meeting.topics.map(topic => {
                        const topicStatus = topicStatusConfig[topic.status]
                        const TopicIcon = topicStatus.icon

                        return (
                          <div
                            key={topic.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className={`w-6 h-6 ${topicStatus.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <TopicIcon className={`w-3.5 h-3.5 ${topicStatus.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">{topic.title}</span>
                                {topic.fromPreviousMeeting && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                    Eelmisest koosolekust
                                  </span>
                                )}
                              </div>
                              {topic.description && (
                                <p className="text-sm text-gray-600 mt-0.5">{topic.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                {topic.responsible && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {topic.responsible}
                                  </span>
                                )}
                                {topic.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Tähtaeg: {formatDate(topic.deadline)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs ${topicStatus.bg} ${topicStatus.color}`}>
                              {topicStatus.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  {meeting.notes && (
                    <div className="px-4 pb-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <span className="font-medium">Märkused:</span> {meeting.notes}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 pb-4 flex justify-between items-center">
                    <div className="flex gap-2">
                      {meeting.protocol && (
                        <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Laadi protokoll
                        </button>
                      )}
                      <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Prindi
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMeeting(meeting)
                        }}
                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Vaata detaile
                      </button>
                      <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Muuda
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <MessageSquareMore className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Koosolekuid ei leitud</p>
          </div>
        )}
      </div>

      {/* Add meeting modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Uus koosolek</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Meeting type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koosoleku tüüp *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(meetingTypeConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: key as MeetingType, atvCompanyId: '' }))}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          formData.type === key
                            ? `border-[#279989] ${config.bg}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${formData.type === key ? config.color : 'text-gray-400'}`} />
                        <div className="font-medium text-gray-900 text-sm">{config.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ATV company selector */}
              {formData.type === 'rivest_atv' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alltöövõtja *
                  </label>
                  <select
                    value={formData.atvCompanyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, atvCompanyId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Vali alltöövõtja...</option>
                    {mockAtvCompanies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pealkiri
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={`Nt. ${meetingTypeConfig[formData.type].label} koosolek nr ${getNextMeetingNumber(formData.type)}`}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Date and time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kuupäev *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kellaaeg *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asukoht *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Nt. Ehitusobjekt, kontor"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Open topics from previous meetings */}
              {getOpenTopicsFromPreviousMeetings(formData.type).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Eelmistest koosolekutest avatud teemad
                  </h4>
                  <div className="space-y-1">
                    {getOpenTopicsFromPreviousMeetings(formData.type).slice(0, 5).map(topic => (
                      <div key={topic.id} className="text-sm text-yellow-700 flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        {topic.title}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Need teemad lisatakse automaatselt päevakorda
                  </p>
                </div>
              )}

              {/* Attendees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Osalejad
                  </label>
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="text-sm text-[#279989] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Lisa osaleja
                  </button>
                </div>
                <div className="space-y-2">
                  {formAttendees.map((attendee, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attendee.name}
                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                        placeholder="Nimi"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={attendee.company}
                        onChange={(e) => updateAttendee(index, 'company', e.target.value)}
                        placeholder="Ettevõte"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={attendee.role}
                        onChange={(e) => updateAttendee(index, 'role', e.target.value)}
                        placeholder="Roll"
                        className="w-32 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeAttendee(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formAttendees.length === 0 && (
                    <p className="text-sm text-gray-500 py-2">Osalejaid pole lisatud</p>
                  )}
                </div>
              </div>

              {/* Topics */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Päevakorra teemad
                  </label>
                  <button
                    type="button"
                    onClick={addTopic}
                    className="text-sm text-[#279989] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Lisa teema
                  </button>
                </div>
                <div className="space-y-2">
                  {formTopics.map((topic, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => updateTopic(index, 'title', e.target.value)}
                          placeholder="Teema pealkiri"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <textarea
                          value={topic.description}
                          onChange={(e) => updateTopic(index, 'description', e.target.value)}
                          placeholder="Kirjeldus (valikuline)"
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeTopic(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formTopics.length === 0 && (
                    <p className="text-sm text-gray-500 py-2">Teemasid pole lisatud</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={handleAddMeeting}
                disabled={!formData.date || !formData.time || !formData.location || (formData.type === 'rivest_atv' && !formData.atvCompanyId)}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Loo koosolek
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
