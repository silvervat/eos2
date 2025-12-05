'use client'

import { useState, useEffect } from 'react'
import {
  Star,
  Building,
  Search,
  Filter,
  Plus,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  MoreHorizontal,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'
import Link from 'next/link'

interface Rating {
  id: string
  partner: {
    id: string
    name: string
    type: string
  }
  score: number
  quality: number
  reliability: number
  communication: number
  price: number
  comment: string
  project?: {
    id: string
    name: string
  }
  ratedBy: {
    id: string
    name: string
  }
  createdAt: string
}

export default function PartnerRatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterScore, setFilterScore] = useState<number | null>(null)

  useEffect(() => {
    fetchRatings()
  }, [])

  const fetchRatings = async () => {
    try {
      setIsLoading(true)
      // Mock data for now
      setRatings([
        {
          id: '1',
          partner: { id: 'p1', name: 'AS Ehitus', type: 'subcontractor' },
          score: 4.5,
          quality: 5,
          reliability: 4,
          communication: 5,
          price: 4,
          comment: 'Väga hea koostöö, kvaliteetne töö ja täpne ajakava.',
          project: { id: 'pr1', name: 'Tallinna kontor' },
          ratedBy: { id: 'u1', name: 'Mart Tamm' },
          createdAt: '2024-12-01',
        },
        {
          id: '2',
          partner: { id: 'p2', name: 'OÜ Materjalid', type: 'supplier' },
          score: 3.8,
          quality: 4,
          reliability: 3,
          communication: 4,
          price: 4,
          comment: 'Hea hind, aga kohati viivitused tarnetega.',
          project: { id: 'pr2', name: 'Pärnu ladu' },
          ratedBy: { id: 'u2', name: 'Anna Kask' },
          createdAt: '2024-11-28',
        },
        {
          id: '3',
          partner: { id: 'p3', name: 'Elekter AS', type: 'subcontractor' },
          score: 5.0,
          quality: 5,
          reliability: 5,
          communication: 5,
          price: 5,
          comment: 'Suurepärane partner! Soovitan kõigile.',
          ratedBy: { id: 'u1', name: 'Mart Tamm' },
          createdAt: '2024-11-25',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100'
    if (score >= 3.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const renderStars = (score: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
        />
      )
    }
    return stars
  }

  const typeLabels: Record<string, string> = {
    client: 'Klient',
    supplier: 'Tarnija',
    subcontractor: 'Alltöövõtja',
    partner: 'Partner',
    manufacturer: 'Tootja',
  }

  const filteredRatings = ratings.filter(r => {
    const matchesSearch = !searchQuery ||
      r.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesScore = filterScore === null || Math.floor(r.score) === filterScore
    return matchesSearch && matchesScore
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5" style={{ color: '#279989' }} />
            Hindamised
          </h1>
          <p className="text-sm text-slate-500">
            {filteredRatings.length} hindamist
          </p>
        </div>
        <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#279989' }}>
          <Plus className="w-4 h-4" />
          Lisa hindamine
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi ettevõtte või kommentaari järgi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
            />
          </div>
          <div className="flex items-center gap-1">
            {[5, 4, 3, 2, 1].map(score => (
              <button
                key={score}
                onClick={() => setFilterScore(filterScore === score ? null : score)}
                className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                  filterScore === score ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Star className={`w-3 h-3 ${filterScore === score ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ratings List */}
      <div className="space-y-3">
        {filteredRatings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Star className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Hindamisi ei leitud</p>
          </div>
        ) : (
          filteredRatings.map((rating) => (
            <Card key={rating.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/partners/${rating.partner.id}`}
                      className="font-medium text-slate-900 hover:text-[#279989] flex items-center gap-1"
                    >
                      <Building className="w-4 h-4" />
                      {rating.partner.name}
                    </Link>
                    <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                      {typeLabels[rating.partner.type]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-0.5">
                      {renderStars(rating.score)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-sm font-medium ${getScoreColor(rating.score)}`}>
                      {rating.score.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{rating.comment}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {rating.ratedBy.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rating.createdAt).toLocaleDateString('et-EE')}
                    </div>
                    {rating.project && (
                      <Link
                        href={`/projects/${rating.project.id}`}
                        className="flex items-center gap-1 hover:text-[#279989]"
                      >
                        Projekt: {rating.project.name}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Kvaliteet</span>
                    <span className="font-medium">{rating.quality}/5</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Usaldusväärsus</span>
                    <span className="font-medium">{rating.reliability}/5</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Suhtlus</span>
                    <span className="font-medium">{rating.communication}/5</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Hind</span>
                    <span className="font-medium">{rating.price}/5</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
