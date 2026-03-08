'use client'

import { Edit3 } from 'lucide-react'
import type { JobProfileFormData } from '@/types'

interface Props {
  data: JobProfileFormData
  onEditStep: (step: number) => void
  onSave: (status: 'active' | 'draft') => void
  saving: boolean
}

export function Step5Review({ data, onEditStep, onSave, saving }: Props) {
  const { mandatory: m, preferred: p, weights: w } = data

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Review & Save
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        Confirm all details before activating this job profile.
      </p>

      <div className="space-y-4">
        {/* Role Basics */}
        <Section title="Role Basics" onEdit={() => onEditStep(1)}>
          <Row label="Job Title" value={data.title || '—'} />
          <Row label="Department" value={data.department} />
          <Row label="Location" value={data.location} />
          <Row label="Openings" value={String(data.openings)} />
        </Section>

        {/* Mandatory */}
        <Section title="Mandatory Criteria" onEdit={() => onEditStep(2)}>
          <Row label="Degree Required" value={m.degreeRequired ? `Yes — ${m.minDegreeLevel}` : 'No'} />
          <Row label="Degree Fields" value={m.degreeFields.length > 0 ? m.degreeFields.join(', ') : 'Any'} />
          <Row label="Years of Experience" value={`${m.yearsMin} – ${m.yearsMax} years`} />
          <Row label="Certifications" value={m.certifications.length > 0 ? m.certifications.join(', ') : 'None'} />
          <Row label="UAE Driving License" value={m.uaeDrivingLicense ? 'Required' : 'Not required'} />
          <Row label="Right to Work UAE" value={m.rightToWorkUAE ? `Required${m.allowedNationalities.length > 0 ? ` (${m.allowedNationalities.join(', ')})` : ''}` : 'Not required'} />
        </Section>

        {/* Preferred */}
        <Section title="Preferred Criteria" onEdit={() => onEditStep(3)}>
          <Row label="Skills" value={p.skills.length > 0 ? p.skills.map((s) => `${s.name} (${'★'.repeat(s.weight)})`).join(', ') : 'None'} />
          <Row label="Industry" value={p.industryBackground.length > 0 ? p.industryBackground.join(', ') : 'Any'} />
          <Row label="Employer Type" value={p.employerType.length > 0 ? p.employerType.join(', ') : 'Any'} />
          <Row label="Languages" value={p.languages.length > 0 ? p.languages.join(', ') : 'Any'} />
        </Section>

        {/* Scoring Weights */}
        <Section title="Scoring Weights" onEdit={() => onEditStep(4)}>
          {Object.entries(w).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-sm capitalize" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full" style={{ background: '#1E1E2E' }}>
                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: '#6366F1' }} />
                </div>
                <span className="text-sm font-bold w-8 text-right" style={{ color: '#6366F1', fontFamily: 'Syne, sans-serif' }}>
                  {val}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: '1px solid #1E1E2E' }}>
            <span className="text-xs font-bold" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>TOTAL</span>
            <span className="text-sm font-bold" style={{
              color: Object.values(w).reduce((a, b) => a + b, 0) === 100 ? '#22C55E' : '#EF4444',
              fontFamily: 'Syne, sans-serif',
            }}>
              {Object.values(w).reduce((a, b) => a + b, 0)} / 100
            </span>
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={() => onSave('active')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-base font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
          {saving ? 'Activating…' : 'Activate Job Profile'}
        </button>
        <button
          onClick={() => onSave('draft')}
          disabled={saving}
          className="py-3 px-6 rounded-xl text-base font-medium transition-all hover:bg-white/5 disabled:opacity-50"
          style={{ border: '1px solid #1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
          Save as Draft
        </button>
      </div>
    </div>
  )
}

function Section({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
          {title}
        </h3>
        <button onClick={onEdit}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>
          <Edit3 size={11} />
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs flex-shrink-0" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif', minWidth: 140 }}>
        {label}
      </span>
      <span className="text-xs text-right" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
        {value}
      </span>
    </div>
  )
}
