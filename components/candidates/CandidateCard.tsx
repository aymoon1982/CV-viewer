'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, MessageSquare, Star, X, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import type { Candidate } from '@/types'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { CandidateStatusBadge } from '@/components/ui/StatusBadge'
import { useCompareStore } from '@/store'
import { getScoreColor } from '@/lib/utils'

interface Props {
  candidate: Candidate
  jobId: string
  onStatusChange: (id: string, status: Candidate['status']) => void
  showCompare?: boolean
}

export function CandidateCard({ candidate: c, jobId, onStatusChange, showCompare = true }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const { selection, toggleCandidate } = useCompareStore()

  const isEliminated = c.status === 'eliminated'
  const isShortlisted = c.status === 'shortlisted'
  const isSelected = selection?.candidateIds.includes(c.id) ?? false

  const handleShortlist = () => {
    const newStatus = isShortlisted ? 'scored' : 'shortlisted'
    onStatusChange(c.id, newStatus)
    toast.success(isShortlisted ? 'Removed from shortlist' : 'Added to shortlist')
  }

  const handleReject = () => {
    onStatusChange(c.id, 'rejected')
    setShowRejectConfirm(false)
    toast.success('Candidate rejected')
  }

  const criteriaKeys = Object.keys(c.criterionScores)
  const matchedCount = criteriaKeys.filter((k) => {
    const score = c.criterionScores[k]
    return score.passFail !== 'fail' && score.score >= 60
  }).length

  if (isEliminated && !expanded) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)', opacity: 0.7 }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#111118', borderLeft: '3px solid #EF4444' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ScoreGauge score={c.finalScore} size={48} strokeWidth={5} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                {c.name}
              </p>
              <p className="text-xs" style={{ color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
                ELIMINATED — {c.eliminationReason?.split('.')[0]}
              </p>
            </div>
          </div>
          <button onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            <ChevronDown size={12} />
            Show
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden noise-texture"
      style={{
        background: '#111118',
        border: `1px solid ${isEliminated ? 'rgba(239,68,68,0.3)' : '#1E1E2E'}`,
        borderLeft: isEliminated ? '3px solid #EF4444' : undefined,
        opacity: isEliminated ? 0.75 : 1,
        position: 'relative',
      }}>
      {/* Eliminated stamp */}
      {isEliminated && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <span className="text-4xl font-black opacity-5 rotate-[-15deg]"
            style={{ color: '#EF4444', fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>
            ELIMINATED
          </span>
        </div>
      )}

      <div className="p-4 relative" style={{ zIndex: 2 }}>
        {/* Top row */}
        <div className="flex items-start gap-4">
          {/* Compare checkbox */}
          {showCompare && !isEliminated && (
            <button onClick={() => toggleCandidate(jobId, c.id)}
              className="mt-1 flex-shrink-0 transition-colors"
              style={{ color: isSelected ? '#6366F1' : '#1E1E2E' }}>
              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          )}

          {/* Score gauge */}
          <ScoreGauge score={c.finalScore} size={68} strokeWidth={6} />

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-semibold truncate"
                  style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                  {c.name}
                </p>
                <p className="text-xs truncate" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                  {c.currentTitle} · {c.currentCompany}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                    {c.yearsExperience} yr exp
                  </span>
                  <span className="text-xs capitalize" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                    {c.degreeLevel}
                  </span>
                  <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                    {c.nationality}
                  </span>
                </div>
              </div>
              <CandidateStatusBadge status={c.status} className="flex-shrink-0" />
            </div>

            {/* Criteria match bar */}
            <div className="mt-2 flex items-center gap-1 group">
              {criteriaKeys.map((key) => {
                const score = c.criterionScores[key]
                const isPassed = score.passFail !== 'fail' && score.score >= 60
                const isMandatoryFail = score.passFail === 'fail'
                const color = isMandatoryFail ? '#EF4444' : isPassed ? '#22C55E' : '#F59E0B'
                return (
                  <div key={key} className="relative flex-1 h-1.5 rounded-full"
                    style={{ background: color, opacity: 0.75 }}
                    title={`${key}: ${score.passFail ? (score.passFail === 'pass' ? 'PASS' : 'FAIL') : score.score + '/100'}`}
                  />
                )
              })}
              <span className="ml-2 text-xs flex-shrink-0" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                {matchedCount}/{criteriaKeys.length}
              </span>
            </div>

            {/* AI Summary */}
            <div className="mt-2">
              <p className="text-xs leading-relaxed" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                {summaryExpanded ? c.aiSummary : c.aiSummary.slice(0, 120) + (c.aiSummary.length > 120 ? '…' : '')}
                {c.aiSummary.length > 120 && (
                  <button onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="ml-1 transition-colors"
                    style={{ color: '#6366F1' }}>
                    {summaryExpanded ? 'Less' : 'Read more'}
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <ActionBtn
              icon={<Star size={14} fill={isShortlisted ? '#F59E0B' : 'none'} />}
              color={isShortlisted ? '#F59E0B' : '#64748B'}
              title={isShortlisted ? 'Remove from shortlist' : 'Shortlist'}
              onClick={handleShortlist}
            />
            <ActionBtn
              icon={<Eye size={14} />}
              color="#6366F1"
              title="View profile"
              onClick={() => router.push(`/jobs/${jobId}/candidates/${c.id}`)}
            />
            <ActionBtn
              icon={<MessageSquare size={14} />}
              color="#22C55E"
              title="WhatsApp"
              onClick={() => toast.success('Opening WhatsApp composer…')}
            />
            {!isEliminated && (
              <div className="relative">
                <ActionBtn
                  icon={<X size={14} />}
                  color="#EF4444"
                  title="Reject"
                  onClick={() => setShowRejectConfirm(true)}
                />
                <AnimatePresence>
                  {showRejectConfirm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-full top-0 mr-2 w-40 rounded-lg p-3 shadow-xl z-10"
                      style={{ background: '#16161F', border: '1px solid #EF4444' }}>
                      <p className="text-xs mb-2" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                        Reject this candidate?
                      </p>
                      <div className="flex gap-2">
                        <button onClick={handleReject}
                          className="flex-1 py-1 rounded text-xs font-medium"
                          style={{ background: '#EF4444', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                          Reject
                        </button>
                        <button onClick={() => setShowRejectConfirm(false)}
                          className="flex-1 py-1 rounded text-xs"
                          style={{ background: '#1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {isEliminated && (
              <button onClick={() => setExpanded(false)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#64748B' }}>
                <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ActionBtn({
  icon, color, title, onClick,
}: {
  icon: React.ReactNode
  color: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {icon}
    </button>
  )
}
