'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Filter, SlidersHorizontal, GitCompareArrows, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Candidate, CandidateStatus } from '@/types'
import { CandidateCard } from '@/components/candidates/CandidateCard'
import { CandidateCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useCompareStore, useFilterStore } from '@/store'
import { getScoreTier } from '@/lib/utils'

const STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'scored', label: 'Scored' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'eliminated', label: 'Eliminated' },
]

export default function ResultsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { filters, setFilter, resetFilters } = useFilterStore()
  const { selection, clearSelection } = useCompareStore()

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.candidates.listByJob(params.id)
      setCandidates(data)
    } catch {
      setError('Failed to load candidates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCandidates() }, [params.id])

  const handleStatusChange = (id: string, status: Candidate['status']) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
  }

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...candidates]

    // Score range
    list = list.filter((c) => c.finalScore >= filters.scoreMin && c.finalScore <= filters.scoreMax)

    // Status filter
    if (filters.statuses.length > 0) {
      list = list.filter((c) => filters.statuses.includes(c.status))
    }

    // Score tier
    if (filters.scoreTier !== 'all') {
      list = list.filter((c) => getScoreTier(c.finalScore) === filters.scoreTier)
    }

    // Sort
    list.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score_asc': return a.finalScore - b.finalScore
        case 'date': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'experience_desc': return b.yearsExperience - a.yearsExperience
        default: return b.finalScore - a.finalScore
      }
    })

    // Eliminated always last
    return [
      ...list.filter((c) => c.status !== 'eliminated'),
      ...list.filter((c) => c.status === 'eliminated'),
    ]
  }, [candidates, filters])

  const jobTitle = 'Job Results'

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Score Range
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{filters.scoreMin}</span>
          <span className="text-xs" style={{ color: '#64748B' }}>—</span>
          <span className="text-xs" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{filters.scoreMax}</span>
        </div>
        <input type="range" min={0} max={100} value={filters.scoreMin}
          onChange={(e) => setFilter('scoreMin', Number(e.target.value))}
          className="w-full" style={{ accentColor: '#6366F1' }} />
        <input type="range" min={0} max={100} value={filters.scoreMax}
          onChange={(e) => setFilter('scoreMax', Number(e.target.value))}
          className="w-full" style={{ accentColor: '#6366F1' }} />
      </div>

      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Status
        </p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={filters.statuses.includes(value)}
                onChange={(e) => {
                  setFilter('statuses', e.target.checked
                    ? [...filters.statuses, value]
                    : filters.statuses.filter((s) => s !== value)
                  )
                }}
                style={{ accentColor: '#6366F1' }}
              />
              <span className="text-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Score Tier
        </p>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'strong', label: 'Strong Match 70+' },
            { value: 'possible', label: 'Possible Match 45–69' },
            { value: 'weak', label: 'Weak Match <45' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio"
                name="scoreTier"
                checked={filters.scoreTier === value}
                onChange={() => setFilter('scoreTier', value as typeof filters.scoreTier)}
                style={{ accentColor: '#6366F1' }}
              />
              <span className="text-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sort By
        </p>
        <select value={filters.sortBy}
          onChange={(e) => setFilter('sortBy', e.target.value as typeof filters.sortBy)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: '#0A0A0F', border: '1px solid #1E1E2E', color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
          <option value="score_desc">Score (High to Low)</option>
          <option value="score_asc">Score (Low to High)</option>
          <option value="date">Date Uploaded</option>
          <option value="experience_desc">Experience (High to Low)</option>
        </select>
      </div>

      <button onClick={resetFilters}
        className="text-xs transition-colors hover:opacity-80"
        style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>
        Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4" style={{ borderBottom: '1px solid #1E1E2E', background: '#111118' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#64748B' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
              Candidate Results
            </h1>
            <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
              {filtered.length} candidates · Job ID: <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366F1', fontSize: '10px' }}>{params.id}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${params.id}/upload`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ background: '#1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
            Upload More
          </Link>
          {/* Mobile filter button */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
            style={{ background: '#1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Filters sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 overflow-y-auto p-5"
          style={{ borderRight: '1px solid #1E1E2E', background: '#111118' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} style={{ color: '#94A3B8' }} />
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                Filters
              </p>
            </div>
          </div>
          <Filters />
        </aside>

        {/* Mobile filters drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.6)' }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 overflow-y-auto p-5"
                style={{ background: '#111118', borderRight: '1px solid #1E1E2E' }}>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Filters</p>
                  <button onClick={() => setSidebarOpen(false)} style={{ color: '#64748B' }}>
                    <X size={18} />
                  </button>
                </div>
                <Filters />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Candidate list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <CandidateCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchCandidates} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No candidates found"
              description="Try adjusting your filters or upload more CVs."
              ctaLabel="Clear Filters"
              ctaOnClick={resetFilters}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  jobId={params.id}
                  onStatusChange={handleStatusChange}
                  showCompare
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare sticky bar */}
      <AnimatePresence>
        {selection && selection.jobProfileId === params.id && selection.candidateIds.length >= 2 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3"
            style={{ background: '#16161F', borderTop: '1px solid #6366F1' }}>
            <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
              {selection.candidateIds.length} candidates selected for comparison
            </p>
            <div className="flex items-center gap-2">
              <button onClick={clearSelection}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
                style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                Clear
              </button>
              <Link href={`/jobs/${params.id}/compare`}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                <GitCompareArrows size={14} />
                Compare
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
