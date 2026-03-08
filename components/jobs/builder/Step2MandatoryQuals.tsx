'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { JobProfileFormData, DegreeLevel, MandatoryCriteria } from '@/types'

const DEGREE_LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
]

const CERT_SUGGESTIONS = ['PMP', 'PRINCE2', 'FIDIC', 'RICS', 'LEED', 'CIOB', 'APM', 'PMI-RMP', 'OSHA 30', 'MSP', 'MRICS']
const NATIONALITY_OPTIONS = ['Any', 'Emirati', 'GCC National', 'EU Passport', 'UK', 'US', 'Indian', 'Pakistani', 'Egyptian', 'Lebanese']

const fieldStyle = {
  background: '#0A0A0F',
  border: '1px solid #1E1E2E',
  color: '#F1F5F9',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
}

interface Props {
  data: JobProfileFormData
  onChange: (updates: Partial<JobProfileFormData>) => void
}

export function Step2MandatoryQuals({ data, onChange }: Props) {
  const [certInput, setCertInput] = useState('')
  const [fieldInput, setFieldInput] = useState('')
  const [natInput, setNatInput] = useState('')
  const m = data.mandatory

  const updateMandatory = (updates: Partial<MandatoryCriteria>) => {
    onChange({ mandatory: { ...m, ...updates } })
  }

  const addTag = (
    field: 'certifications' | 'degreeFields' | 'allowedNationalities',
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return
    const current = m[field] as string[]
    if (!current.includes(value.trim())) {
      updateMandatory({ [field]: [...current, value.trim()] })
    }
    setter('')
  }

  const removeTag = (
    field: 'certifications' | 'degreeFields' | 'allowedNationalities',
    value: string
  ) => {
    const current = m[field] as string[]
    updateMandatory({ [field]: current.filter((v) => v !== value) })
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Mandatory Qualifications
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        Candidates who don't meet these criteria are automatically eliminated.
      </p>

      <div className="space-y-6">
        {/* Degree Required */}
        <div className="flex items-start justify-between py-3 px-4 rounded-xl" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Degree Required</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Require a formal academic degree</p>
          </div>
          <Toggle checked={m.degreeRequired} onChange={(v) => updateMandatory({ degreeRequired: v })} />
        </div>

        {m.degreeRequired && (
          <div className="ml-4 space-y-4">
            {/* Min degree level */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Minimum Degree Level
              </label>
              <div className="flex flex-wrap gap-2">
                {DEGREE_LEVELS.map(({ value, label }) => (
                  <button key={value}
                    onClick={() => updateMandatory({ minDegreeLevel: value })}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: m.minDegreeLevel === value ? '#6366F1' : '#1E1E2E',
                      color: m.minDegreeLevel === value ? 'white' : '#94A3B8',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Degree fields */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Specific Field(s)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTag('degreeFields', fieldInput, setFieldInput) }}
                  placeholder="Civil Engineering, Architecture..."
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <button onClick={() => addTag('degreeFields', fieldInput, setFieldInput)}
                  className="px-3 py-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: '#1E1E2E', color: '#94A3B8' }}>
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.degreeFields.map((f) => (
                  <Chip key={f} label={f} onRemove={() => removeTag('degreeFields', f)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Years of Experience */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Years of Experience
          </label>
          <p className="text-sm mb-3 font-medium" style={{ color: '#6366F1', fontFamily: 'Syne, sans-serif' }}>
            Between {m.yearsMin} and {m.yearsMax} years
          </p>
          <DualSlider
            min={0}
            max={30}
            valueMin={m.yearsMin}
            valueMax={m.yearsMax}
            onChange={(min, max) => updateMandatory({ yearsMin: min, yearsMax: max })}
          />
        </div>

        {/* Professional Certifications */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Required Certifications
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag('certifications', certInput, setCertInput) }}
                placeholder="PMP, FIDIC, RICS..."
                style={{ ...fieldStyle, width: '100%' }}
              />
              {certInput && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-20"
                  style={{ background: '#16161F', border: '1px solid #1E1E2E' }}>
                  {CERT_SUGGESTIONS.filter((c) => c.toLowerCase().includes(certInput.toLowerCase()) && !m.certifications.includes(c)).map((c) => (
                    <button key={c}
                      onMouseDown={() => { addTag('certifications', c, setCertInput) }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => addTag('certifications', certInput, setCertInput)}
              className="px-3 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: '#1E1E2E', color: '#94A3B8' }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {m.certifications.map((c) => (
              <Chip key={c} label={c} onRemove={() => removeTag('certifications', c)} />
            ))}
          </div>
        </div>

        {/* UAE Driving License */}
        <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Valid UAE Driving License</p>
          </div>
          <Toggle checked={m.uaeDrivingLicense} onChange={(v) => updateMandatory({ uaeDrivingLicense: v })} />
        </div>

        {/* Right to Work */}
        <div>
          <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Right to Work in UAE</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Restrict by nationality/visa type</p>
            </div>
            <Toggle checked={m.rightToWorkUAE} onChange={(v) => updateMandatory({ rightToWorkUAE: v })} />
          </div>

          {m.rightToWorkUAE && (
            <div className="mt-3 ml-4">
              <div className="flex gap-2 mb-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !m.allowedNationalities.includes(e.target.value)) {
                      updateMandatory({ allowedNationalities: [...m.allowedNationalities, e.target.value] })
                    }
                  }}
                  style={{ ...fieldStyle, flex: 1, cursor: 'pointer' }}>
                  <option value="">Select nationality / visa type...</option>
                  {NATIONALITY_OPTIONS.filter((n) => !m.allowedNationalities.includes(n)).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.allowedNationalities.map((n) => (
                  <Chip key={n} label={n} onRemove={() => removeTag('allowedNationalities', n)} />
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                Leave empty to accept all nationalities with valid UAE residency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
      style={{ background: checked ? '#6366F1' : '#1E1E2E' }}>
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          background: 'white',
          left: checked ? '22px' : '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontFamily: 'DM Sans, sans-serif' }}>
      {label}
      <button onClick={onRemove} className="ml-0.5 rounded transition-colors hover:text-white">
        <X size={10} />
      </button>
    </span>
  )
}

function DualSlider({
  min, max, valueMin, valueMax, onChange
}: {
  min: number; max: number; valueMin: number; valueMax: number
  onChange: (min: number, max: number) => void
}) {
  const rangePercent = (val: number) => ((val - min) / (max - min)) * 100
  return (
    <div className="relative h-12 flex items-center px-2">
      {/* Track */}
      <div className="absolute left-2 right-2 h-1.5 rounded-full" style={{ background: '#1E1E2E' }}>
        {/* Fill */}
        <div className="absolute h-full rounded-full" style={{
          background: '#6366F1',
          left: `${rangePercent(valueMin)}%`,
          right: `${100 - rangePercent(valueMax)}%`,
        }} />
      </div>
      {/* Min thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={valueMin}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v < valueMax) onChange(v, valueMax)
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none"
        style={{ zIndex: 3 }}
      />
      {/* Max thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={valueMax}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v > valueMin) onChange(valueMin, v)
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none"
        style={{ zIndex: 4 }}
      />
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6366F1;
          border: 2px solid #111118;
          cursor: pointer;
          pointer-events: all;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6366F1;
          border: 2px solid #111118;
          cursor: pointer;
          pointer-events: all;
        }
      `}</style>
    </div>
  )
}
