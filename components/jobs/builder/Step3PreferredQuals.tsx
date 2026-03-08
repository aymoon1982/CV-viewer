'use client'

import { useState } from 'react'
import { X, Plus, Star, GripVertical } from 'lucide-react'
import type { JobProfileFormData, PreferredSkill, PreferredCriteria } from '@/types'

const INDUSTRY_OPTIONS = ['Construction', 'Real Estate', 'Infrastructure', 'Oil & Gas', 'Government', 'Consulting']
const EMPLOYER_TYPES = ['Main Contractor', 'Subcontractor', 'Consultant', 'Developer', 'Government']
const LANGUAGE_OPTIONS = ['Arabic', 'English', 'French', 'Hindi', 'Urdu', 'German', 'Chinese', 'Spanish']

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

export function Step3PreferredQuals({ data, onChange }: Props) {
  const [skillInput, setSkillInput] = useState('')
  const [projectInput, setProjectInput] = useState('')
  const p = data.preferred

  const updatePreferred = (updates: Partial<PreferredCriteria>) => {
    onChange({ preferred: { ...p, ...updates } })
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    const newSkill: PreferredSkill = {
      id: `sk-${Date.now()}`,
      name: skillInput.trim(),
      weight: 3,
    }
    updatePreferred({ skills: [...p.skills, newSkill] })
    setSkillInput('')
  }

  const removeSkill = (id: string) => {
    updatePreferred({ skills: p.skills.filter((s) => s.id !== id) })
  }

  const updateSkillWeight = (id: string, weight: number) => {
    updatePreferred({ skills: p.skills.map((s) => s.id === id ? { ...s, weight } : s) })
  }

  const toggleChip = (
    field: 'industryBackground' | 'employerType' | 'languages',
    value: string
  ) => {
    const current = p[field]
    updatePreferred({
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    })
  }

  const addProject = () => {
    if (!projectInput.trim()) return
    updatePreferred({ relevantProjects: [...p.relevantProjects, projectInput.trim()] })
    setProjectInput('')
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Preferred Qualifications
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        These criteria inform scoring but don't eliminate candidates automatically.
      </p>

      <div className="space-y-6">
        {/* Skills */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Preferred Skills (with importance weight)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSkill() }}
              placeholder="AutoCAD, Primavera P6, FIDIC..."
              style={{ ...fieldStyle, flex: 1 }}
            />
            <button onClick={addSkill}
              className="px-3 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: '#1E1E2E', color: '#94A3B8' }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {p.skills.map((skill, idx) => (
              <div key={skill.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                <GripVertical size={14} style={{ color: '#64748B', flexShrink: 0, cursor: 'grab' }} />
                <span className="flex-1 text-sm" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                  {skill.name}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => updateSkillWeight(skill.id, star)}
                      className="transition-colors">
                      <Star
                        size={16}
                        fill={star <= skill.weight ? '#F59E0B' : 'none'}
                        style={{ color: star <= skill.weight ? '#F59E0B' : '#1E1E2E' }}
                      />
                    </button>
                  ))}
                </div>
                <button onClick={() => removeSkill(skill.id)}
                  className="p-1 rounded transition-colors hover:bg-white/10"
                  style={{ color: '#64748B' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {p.skills.length === 0 && (
              <p className="text-xs py-3 text-center" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                Add skills to score candidates on. Rate each by importance (1–5 stars).
              </p>
            )}
          </div>
        </div>

        {/* Industry Background */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Industry Background
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((opt) => (
              <button key={opt}
                onClick={() => toggleChip('industryBackground', opt)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: p.industryBackground.includes(opt) ? 'rgba(99,102,241,0.2)' : '#1E1E2E',
                  color: p.industryBackground.includes(opt) ? '#818CF8' : '#94A3B8',
                  border: `1px solid ${p.industryBackground.includes(opt) ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Employer Type */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Employer Type
          </label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYER_TYPES.map((opt) => (
              <button key={opt}
                onClick={() => toggleChip('employerType', opt)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: p.employerType.includes(opt) ? 'rgba(99,102,241,0.2)' : '#1E1E2E',
                  color: p.employerType.includes(opt) ? '#818CF8' : '#94A3B8',
                  border: `1px solid ${p.employerType.includes(opt) ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Languages
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button key={opt}
                onClick={() => toggleChip('languages', opt)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: p.languages.includes(opt) ? 'rgba(99,102,241,0.2)' : '#1E1E2E',
                  color: p.languages.includes(opt) ? '#818CF8' : '#94A3B8',
                  border: `1px solid ${p.languages.includes(opt) ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Relevant Projects */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Previous Relevant Project Types
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addProject() }}
              placeholder="High-rise residential, Metro infrastructure..."
              style={{ ...fieldStyle, flex: 1 }}
            />
            <button onClick={addProject}
              className="px-3 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: '#1E1E2E', color: '#94A3B8' }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {p.relevantProjects.map((proj) => (
              <span key={proj}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontFamily: 'DM Sans, sans-serif' }}>
                {proj}
                <button onClick={() => updatePreferred({ relevantProjects: p.relevantProjects.filter((v) => v !== proj) })}
                  className="ml-0.5 rounded transition-colors hover:text-white">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
