'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Info,
  Award,
  Briefcase,
  GraduationCap,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Candidate } from '@/types'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { CandidateStatusBadge } from '@/components/ui/StatusBadge'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { CandidateCardSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { getScoreColor, formatDate } from '@/lib/utils'

export default function CandidateProfilePage() {
  const params = useParams<{ id: string; candidateId: string }>()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailRevealed, setEmailRevealed] = useState(false)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [scoringOpen, setScoringOpen] = useState(true)
  const [openCriteria, setOpenCriteria] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.candidates.get(params.candidateId)
      setCandidate(data)
    } catch {
      setError('Failed to load candidate profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [params.candidateId])

  const handleShortlist = () => {
    if (!candidate) return
    const newStatus = candidate.status === 'shortlisted' ? 'scored' : 'shortlisted'
    setCandidate({ ...candidate, status: newStatus })
    toast.success(newStatus === 'shortlisted' ? 'Added to shortlist' : 'Removed from shortlist')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-4">
          {[1, 2].map((i) => <CandidateCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }
  if (error || !candidate) {
    return <ErrorState message={error ?? 'Candidate not found'} onRetry={fetch} />
  }

  const c = candidate
  const criteriaEntries = Object.entries(c.criterionScores)

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Left panel — Candidate data */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ minWidth: 0 }}>
        <div className="max-w-2xl mx-auto">
          {/* Back */}
          <Link href={`/jobs/${params.id}/results`}
            className="inline-flex items-center gap-2 text-sm mb-5 transition-colors hover:opacity-80"
            style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            <ArrowLeft size={14} />
            Back to Results
          </Link>

          {/* Header card */}
          <div className="rounded-xl p-5 mb-4 noise-texture"
            style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
            <div className="flex items-start gap-5">
              <ScoreGauge score={c.finalScore} size={90} strokeWidth={7} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold mb-0.5"
                      style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
                      {c.name}
                    </h1>
                    <p className="text-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      {c.currentTitle} · {c.currentCompany}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        {c.yearsExperience} yr exp
                      </span>
                      <span className="text-xs capitalize" style={{ color: '#64748B' }}>· {c.nationality}</span>
                      <span className="text-xs" style={{ color: '#64748B' }}>· {c.languages.join(', ')}</span>
                    </div>
                  </div>
                  <CandidateStatusBadge status={c.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleShortlist}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: c.status === 'shortlisted' ? 'rgba(245,158,11,0.15)' : '#1E1E2E',
                      color: c.status === 'shortlisted' ? '#F59E0B' : '#94A3B8',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    <Star size={12} fill={c.status === 'shortlisted' ? '#F59E0B' : 'none'} />
                    {c.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  <button
                    onClick={() => toast.success('Opening WhatsApp composer…')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontFamily: 'DM Sans, sans-serif' }}>
                    <MessageSquare size={12} />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setCandidate({ ...c, status: 'rejected' })
                      toast.success('Candidate rejected')
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
                    <X size={12} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Info */}
          <div className="rounded-xl p-5 mb-4" style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Candidate Information
            </h2>

            {/* Contact */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #1E1E2E' }}>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                Contact
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Email</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: '#F1F5F9', fontFamily: 'JetBrains Mono, monospace' }}>
                      {emailRevealed ? c.email : '•••••@••••.com'}
                    </span>
                    <button onClick={() => setEmailRevealed(!emailRevealed)} style={{ color: '#64748B' }}>
                      {emailRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Phone</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: '#F1F5F9', fontFamily: 'JetBrains Mono, monospace' }}>
                      {phoneRevealed ? c.phone : '+971 •• ••• ••••'}
                    </span>
                    <button onClick={() => setPhoneRevealed(!phoneRevealed)} style={{ color: '#64748B' }}>
                      {phoneRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Education timeline */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #1E1E2E' }}>
              <h3 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                <GraduationCap size={13} />
                Education
              </h3>
              {c.education.map((edu, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#6366F1', flexShrink: 0 }} />
                    {i < c.education.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: '#1E1E2E' }} />}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      {edu.degree} in {edu.field}
                    </p>
                    <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      {edu.institution} · {edu.year}
                      {edu.grade && ` · ${edu.grade}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Experience timeline */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #1E1E2E' }}>
              <h3 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                <Briefcase size={13} />
                Experience
              </h3>
              {c.experience.map((exp, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#22C55E', flexShrink: 0 }} />
                    {i < c.experience.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: '#1E1E2E' }} />}
                  </div>
                  <div className="pb-2 flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      {exp.title}
                    </p>
                    <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      {exp.company} · {exp.duration}
                    </p>
                    {exp.description && (
                      <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #1E1E2E' }}>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                <Tag size={13} />
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((skill) => (
                  <span key={skill.name}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: skill.matched ? 'rgba(99,102,241,0.15)' : '#1E1E2E',
                      color: skill.matched ? '#818CF8' : '#64748B',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                <Award size={13} />
                Certifications
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {c.certifications.map((cert) => (
                  <span key={cert}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontFamily: 'DM Sans, sans-serif' }}>
                    {cert}
                  </span>
                ))}
                {c.certifications.length === 0 && (
                  <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>None extracted</span>
                )}
              </div>
            </div>
          </div>

          {/* Scoring Breakdown Accordion */}
          <div className="rounded-xl overflow-hidden mb-4" style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
            <button
              onClick={() => setScoringOpen(!scoringOpen)}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/3">
              <div className="flex items-center gap-2">
                <Info size={14} style={{ color: '#6366F1' }} />
                <span className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                  Scoring Breakdown
                </span>
              </div>
              {scoringOpen ? <ChevronUp size={16} style={{ color: '#64748B' }} /> : <ChevronDown size={16} style={{ color: '#64748B' }} />}
            </button>

            <AnimatePresence>
              {scoringOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="px-5 pb-4 space-y-3">
                    {criteriaEntries.map(([key, criterion]) => {
                      const label = key.replace(/([A-Z])/g, ' $1').trim()
                      const color = getScoreColor(criterion.score)
                      const isOpen = openCriteria === key
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs w-36 flex-shrink-0 capitalize"
                              style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                              {label}
                            </span>
                            {criterion.passFail ? (
                              <span className="px-2 py-0.5 rounded text-xs font-bold"
                                style={{
                                  background: criterion.passFail === 'pass' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: criterion.passFail === 'pass' ? '#22C55E' : '#EF4444',
                                }}>
                                {criterion.passFail.toUpperCase()}
                              </span>
                            ) : (
                              <>
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1E1E2E' }}>
                                  <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${criterion.score}%`, background: color }} />
                                </div>
                                <span className="text-xs font-bold w-8 text-right"
                                  style={{ color, fontFamily: 'Syne, sans-serif' }}>
                                  {criterion.score}
                                </span>
                              </>
                            )}
                            <button onClick={() => setOpenCriteria(isOpen ? null : key)}
                              className="flex items-center gap-1 text-xs transition-colors"
                              style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                              Why?
                            </button>
                          </div>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden ml-36">
                                <div className="py-2 px-3 rounded-lg text-xs mt-1"
                                  style={{ background: '#0A0A0F', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                                  {criterion.justification}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CV Preview placeholder */}
          <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CV Preview
            </h3>
            <div className="h-32 rounded-lg flex flex-col items-center justify-center gap-2"
              style={{ background: '#0A0A0F', border: '1px dashed #1E1E2E' }}>
              <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                PDF viewer loads in production when CV file is available
              </p>
              <a href="#" className="text-xs font-medium"
                style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>
                Download original CV
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Chat */}
      <div className="hidden xl:flex flex-col w-96 flex-shrink-0" style={{ borderLeft: '1px solid #1E1E2E' }}>
        <ChatPanel candidateId={c.id} candidateName={c.name} />
      </div>
    </div>
  )
}
