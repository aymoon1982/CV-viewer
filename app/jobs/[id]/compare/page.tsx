'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useCompareStore } from '@/store'
import type { Candidate } from '@/types'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { scoreToColor } from '@/lib/utils'

export default function ComparePage() {
  const params = useParams<{ id: string }>()
  const { selection } = useCompareStore()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selection) return
    const fetchCandidates = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          selection.candidateIds.map(id => apiClient.candidates.get(id))
        )
        setCandidates(results.filter(Boolean) as Candidate[])
      } finally {
        setLoading(false)
      }
    }
    fetchCandidates()
  }, [selection])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
        <div className="px-4 sm:px-6 py-6">
          <div className="h-5 w-32 rounded mb-6 animate-pulse" style={{ background: '#1E1E2E' }} />
          <div className="h-8 w-56 rounded mb-6 animate-pulse" style={{ background: '#1E1E2E' }} />
          <div className="rounded-xl animate-pulse" style={{ background: '#111118', border: '1px solid #1E1E2E', minHeight: 400 }} />
        </div>
      </div>
    )
  }

  if (candidates.length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link href={`/jobs/${params.id}/results`}
          className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          <ArrowLeft size={14} />
          Back to Results
        </Link>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-semibold mb-2" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif' }}>
            Select 2–4 candidates to compare
          </p>
          <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            Go back to results and use the checkboxes to select candidates.
          </p>
          <Link href={`/jobs/${params.id}/results`}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
            Back to Results
          </Link>
        </div>
      </div>
    )
  }

  // Collect all unique criteria keys
  const allCriteria = Array.from(
    new Set(candidates.flatMap((c) => Object.keys(c.criterionScores)))
  )

  // Find best value per row
  const getBestScore = (key: string) => {
    return Math.max(...candidates.map((c) => c.criterionScores[key]?.score ?? 0))
  }

  const headerStyle = {
    background: '#111118',
    color: '#F1F5F9',
    fontFamily: 'DM Sans, sans-serif',
    padding: '16px',
    border: '1px solid #1E1E2E',
    minWidth: 200,
    textAlign: 'center' as const,
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  }

  const labelColStyle = {
    position: 'sticky' as const,
    left: 0,
    background: '#0A0A0F',
    padding: '12px 16px',
    minWidth: 160,
    borderRight: '1px solid #1E1E2E',
    zIndex: 5,
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="px-4 sm:px-6 py-6">
        <Link href={`/jobs/${params.id}/results`}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          <ArrowLeft size={14} />
          Back to Results
        </Link>

        <h1 className="text-2xl font-bold mb-6" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          Candidate Comparison
        </h1>

        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1E1E2E' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Label column header */}
                <th style={{ ...headerStyle, textAlign: 'left', minWidth: 160, background: '#0A0A0F' }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: '#64748B' }}>Criteria</span>
                </th>
                {candidates.map((c) => (
                  <th key={c.id} style={headerStyle}>
                    <div className="flex flex-col items-center gap-2">
                      <ScoreGauge score={c.finalScore} size={70} strokeWidth={6} />
                      <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>{c.name}</p>
                      <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>{c.currentTitle}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Overall score */}
              <CompareRow
                label="Overall Score"
                labelColStyle={labelColStyle}
                cells={candidates.map((c, i) => {
                  const best = Math.max(...candidates.map((cc) => cc.finalScore))
                  const isBest = c.finalScore === best
                  return (
                    <td key={c.id} style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      background: isBest ? 'rgba(99,102,241,0.08)' : '#111118',
                      border: isBest ? '1px solid rgba(99,102,241,0.3)' : '1px solid #1E1E2E',
                    }}>
                      <span className="text-2xl font-bold" style={{ color: scoreToColor(c.finalScore), fontFamily: 'Syne, sans-serif' }}>
                        {c.finalScore}
                      </span>
                    </td>
                  )
                })}
              />

              {/* Separator */}
              <tr style={{ background: '#0A0A0F' }}>
                <td colSpan={candidates.length + 1} style={{ padding: '4px 0' }}>
                  <p className="text-xs px-4 uppercase tracking-widest" style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>
                    Mandatory Criteria
                  </p>
                </td>
              </tr>

              {/* Degree */}
              <CompareRow
                label="Degree"
                labelColStyle={labelColStyle}
                cells={candidates.map((c) => (
                  <td key={c.id} style={{ padding: '12px 16px', textAlign: 'center', background: '#111118', border: '1px solid #1E1E2E' }}>
                    <p className="text-xs font-medium capitalize" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      {c.degreeLevel}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                      {c.degreeField}
                    </p>
                  </td>
                ))}
              />

              <CompareRow
                label="Years Exp"
                labelColStyle={labelColStyle}
                cells={candidates.map((c) => {
                  const best = Math.max(...candidates.map((cc) => cc.yearsExperience))
                  return (
                    <td key={c.id} style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      background: c.yearsExperience === best ? 'rgba(34,197,94,0.06)' : '#111118',
                      border: c.yearsExperience === best ? '1px solid rgba(34,197,94,0.2)' : '1px solid #1E1E2E',
                    }}>
                      <span className="text-base font-bold" style={{ color: '#22C55E', fontFamily: 'Syne, sans-serif' }}>
                        {c.yearsExperience}
                      </span>
                      <span className="text-xs ml-1" style={{ color: '#64748B' }}>yr</span>
                    </td>
                  )
                })}
              />

              {/* Separator */}
              <tr style={{ background: '#0A0A0F' }}>
                <td colSpan={candidates.length + 1} style={{ padding: '4px 0' }}>
                  <p className="text-xs px-4 uppercase tracking-widest" style={{ color: '#F59E0B', fontFamily: 'DM Sans, sans-serif' }}>
                    Scoring Criteria
                  </p>
                </td>
              </tr>

              {/* Per-criterion scores */}
              {allCriteria.map((key) => {
                const best = getBestScore(key)
                const label = key.replace(/([A-Z])/g, ' $1').trim()
                return (
                  <CompareRow
                    key={key}
                    label={label}
                    labelColStyle={labelColStyle}
                    cells={candidates.map((c) => {
                      const crit = c.criterionScores[key]
                      if (!crit) return (
                        <td key={c.id} style={{ padding: '12px 16px', textAlign: 'center', background: '#111118', border: '1px solid #1E1E2E' }}>
                          <span className="text-xs" style={{ color: '#64748B' }}>—</span>
                        </td>
                      )
                      const isBest = crit.score === best && best > 0
                      if (crit.passFail) {
                        return (
                          <td key={c.id} style={{ padding: '12px 16px', textAlign: 'center', background: '#111118', border: '1px solid #1E1E2E' }}>
                            {crit.passFail === 'pass'
                              ? <CheckCircle size={18} style={{ color: '#22C55E', margin: '0 auto' }} />
                              : <XCircle size={18} style={{ color: '#EF4444', margin: '0 auto' }} />}
                          </td>
                        )
                      }
                      return (
                        <td key={c.id} style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          background: isBest ? `${scoreToColor(crit.score)}10` : '#111118',
                          border: isBest ? `1px solid ${scoreToColor(crit.score)}40` : '1px solid #1E1E2E',
                        }}>
                          <span className="text-base font-bold" style={{ color: scoreToColor(crit.score), fontFamily: 'Syne, sans-serif' }}>
                            {crit.score}
                          </span>
                          <span className="text-xs ml-1" style={{ color: '#64748B' }}>/100</span>
                        </td>
                      )
                    })}
                  />
                )
              })}

              {/* AI Summary */}
              <tr>
                <td style={{ ...labelColStyle, verticalAlign: 'top', paddingTop: '14px' }}>
                  <span className="text-xs font-medium capitalize" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                    AI Summary
                  </span>
                </td>
                {candidates.map((c) => (
                  <td key={c.id} style={{ padding: '12px 16px', background: '#111118', border: '1px solid #1E1E2E', verticalAlign: 'top' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      {c.aiSummary.slice(0, 180)}…
                    </p>
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td style={{ ...labelColStyle }}>
                  <span className="text-xs font-medium" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>Actions</span>
                </td>
                {candidates.map((c) => (
                  <td key={c.id} style={{ padding: '12px 16px', textAlign: 'center', background: '#111118', border: '1px solid #1E1E2E' }}>
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={() => toast.success(`${c.name} shortlisted`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontFamily: 'DM Sans, sans-serif' }}>
                        <Star size={11} />
                        Shortlist
                      </button>
                      <button
                        onClick={() => toast.success(`WhatsApp to ${c.name}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontFamily: 'DM Sans, sans-serif' }}>
                        <MessageSquare size={11} />
                        WhatsApp
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CompareRow({ label, labelColStyle, cells }: {
  label: string
  labelColStyle: React.CSSProperties
  cells: React.ReactNode[]
}) {
  return (
    <tr>
      <td style={labelColStyle}>
        <span className="text-xs font-medium capitalize" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
          {label}
        </span>
      </td>
      {cells}
    </tr>
  )
}
