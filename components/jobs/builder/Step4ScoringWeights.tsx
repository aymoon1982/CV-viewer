'use client'

import { useMemo } from 'react'
import type { JobProfileFormData } from '@/types'
import { scoringPresets } from '@/lib/mock-data'

interface Props {
  data: JobProfileFormData
  onChange: (updates: Partial<JobProfileFormData>) => void
}

const DEFAULT_CRITERIA = [
  { id: 'yearsExperience', label: 'Years of Experience', color: '#6366F1' },
  { id: 'technicalSkills', label: 'Technical Skills', color: '#22C55E' },
  { id: 'industryBackground', label: 'Industry Background', color: '#F59E0B' },
  { id: 'certifications', label: 'Certifications', color: '#EF4444' },
  { id: 'languages', label: 'Languages', color: '#94A3B8' },
]

export function Step4ScoringWeights({ data, onChange }: Props) {
  const weights = data.weights
  const total = useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights])
  const isValid = total === 100

  const updateWeight = (id: string, value: number) => {
    onChange({ weights: { ...weights, [id]: value } })
  }

  const applyPreset = (preset: keyof typeof scoringPresets) => {
    onChange({ weights: { ...scoringPresets[preset] } })
  }

  // SVG ring progress
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(total, 100) / 100)
  const ringColor = total > 100 ? '#EF4444' : total === 100 ? '#22C55E' : '#6366F1'

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Scoring Weights
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        Allocate exactly 100 points across scoring criteria. Mandatory criteria are pass/fail and not scored.
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Weight allocation ring */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <svg width={130} height={130} viewBox="0 0 130 130">
              {/* Track */}
              <circle cx="65" cy="65" r={radius}
                fill="none" stroke="#1E1E2E" strokeWidth="10" />
              {/* Progress */}
              <circle cx="65" cy="65" r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s', filter: `drop-shadow(0 0 6px ${ringColor}66)` }}
              />
              <text x="65" y="62" textAnchor="middle" dominantBaseline="middle"
                fontSize="24" fontWeight="700" fill={ringColor}
                fontFamily="Syne, sans-serif">
                {total}
              </text>
              <text x="65" y="78" textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fill="#64748B" fontFamily="DM Sans, sans-serif">
                / 100
              </text>
            </svg>
          </div>

          {total > 100 && (
            <p className="text-xs font-medium text-center" style={{ color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
              Total exceeds 100. Reduce weights to continue.
            </p>
          )}

          {/* Presets */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-xs font-medium text-center" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
              Quick Presets
            </p>
            {[
              { key: 'balanced', label: 'Balanced' },
              { key: 'experienceHeavy', label: 'Experience Heavy' },
              { key: 'skillsHeavy', label: 'Skills Heavy' },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => applyPreset(key as keyof typeof scoringPresets)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                style={{ background: '#1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 space-y-5">
          {DEFAULT_CRITERIA.map(({ id, label, color }) => {
            const val = weights[id] ?? 0
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) => updateWeight(id, Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-14 text-center rounded-lg py-1 text-sm font-bold"
                      style={{
                        background: '#0A0A0F',
                        border: '1px solid #1E1E2E',
                        color,
                        fontFamily: 'Syne, sans-serif',
                        outline: 'none',
                      }}
                    />
                    <span className="text-xs" style={{ color: '#64748B' }}>pts</span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full" style={{ background: '#1E1E2E' }}>
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                    style={{ width: `${val}%`, background: color, opacity: 0.8 }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => updateWeight(id, Number(e.target.value))}
                  className="w-full mt-1"
                  style={{ accentColor: color, cursor: 'pointer' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {isValid && (
        <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span className="text-sm font-medium" style={{ color: '#22C55E', fontFamily: 'DM Sans, sans-serif' }}>
            ✓ Weights correctly allocated. Ready to proceed.
          </span>
        </div>
      )}
    </div>
  )
}
