'use client'

import { useState } from 'react'
import { AlertTriangle, Minus, Plus } from 'lucide-react'
import type { JobProfileFormData, Department } from '@/types'
import { jobTitleTemplates } from '@/lib/mock-data'

const DEPARTMENTS: Department[] = ['Engineering', 'Commercial', 'Operations', 'HR', 'Finance']

const JOB_TEMPLATE_DEFAULTS: Record<string, Partial<JobProfileFormData>> = {
  'Senior Site Engineer': {
    department: 'Engineering',
    mandatory: {
      degreeRequired: true, minDegreeLevel: 'bachelor', degreeFields: ['Civil Engineering', 'Structural Engineering'],
      yearsMin: 8, yearsMax: 20, certifications: ['PMP', 'LEED'], uaeDrivingLicense: true, rightToWorkUAE: true, allowedNationalities: []
    },
    preferred: {
      skills: [
        { id: 'sk-1', name: 'AutoCAD', weight: 4 },
        { id: 'sk-2', name: 'Primavera P6', weight: 5 },
        { id: 'sk-3', name: 'FIDIC Contracts', weight: 3 },
      ],
      industryBackground: ['Construction', 'Infrastructure'],
      employerType: ['Main Contractor'],
      languages: ['English', 'Arabic'],
      relevantProjects: ['High-rise residential', 'Infrastructure'],
    },
    weights: { yearsExperience: 30, technicalSkills: 30, industryBackground: 20, certifications: 15, languages: 5 },
  },
  'Project Manager': {
    department: 'Operations',
    mandatory: { degreeRequired: true, minDegreeLevel: 'bachelor', degreeFields: ['Engineering', 'Management'], yearsMin: 10, yearsMax: 25, certifications: ['PMP'], uaeDrivingLicense: true, rightToWorkUAE: true, allowedNationalities: [] },
    preferred: { skills: [{ id: 'sk-1', name: 'MS Project', weight: 4 }, { id: 'sk-2', name: 'Primavera', weight: 5 }], industryBackground: ['Construction', 'Real Estate'], employerType: ['Main Contractor', 'Developer'], languages: ['English', 'Arabic'], relevantProjects: [] },
    weights: { yearsExperience: 35, technicalSkills: 25, industryBackground: 20, certifications: 15, languages: 5 },
  },
  'Quantity Surveyor': {
    department: 'Commercial',
    mandatory: { degreeRequired: true, minDegreeLevel: 'bachelor', degreeFields: ['Quantity Surveying', 'Civil Engineering'], yearsMin: 5, yearsMax: 20, certifications: ['MRICS'], uaeDrivingLicense: false, rightToWorkUAE: true, allowedNationalities: [] },
    preferred: { skills: [{ id: 'sk-1', name: 'CostX', weight: 5 }, { id: 'sk-2', name: 'Bluebeam', weight: 4 }, { id: 'sk-3', name: 'FIDIC', weight: 3 }], industryBackground: ['Construction', 'Consulting'], employerType: ['Consultant', 'Main Contractor'], languages: ['English'], relevantProjects: [] },
    weights: { yearsExperience: 25, technicalSkills: 35, industryBackground: 20, certifications: 15, languages: 5 },
  },
}

interface Props {
  data: JobProfileFormData
  onChange: (updates: Partial<JobProfileFormData>) => void
}

const fieldStyle = {
  background: '#0A0A0F',
  border: '1px solid #1E1E2E',
  color: '#F1F5F9',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'DM Sans, sans-serif',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
}

export function Step1RoleBasics({ data, onChange }: Props) {
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [showTemplate, setShowTemplate] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleTitleChange = (val: string) => {
    onChange({ title: val })
    if (val.length > 1) {
      const matches = jobTitleTemplates.filter((t) =>
        t.toLowerCase().includes(val.toLowerCase())
      )
      setTitleSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      const exactMatch = jobTitleTemplates.find((t) =>
        t.toLowerCase() === val.toLowerCase()
      )
      if (exactMatch) {
        setTemplateTitle(exactMatch)
        setShowTemplate(true)
      } else {
        setShowTemplate(false)
      }
    } else {
      setTitleSuggestions([])
      setShowSuggestions(false)
      setShowTemplate(false)
    }
  }

  const selectSuggestion = (title: string) => {
    const template = JOB_TEMPLATE_DEFAULTS[title]
    if (template) {
      onChange({ title, ...template })
    } else {
      onChange({ title })
    }
    setShowSuggestions(false)
    setTemplateTitle(title)
    setShowTemplate(true)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Role Basics
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        Define the fundamental details of this job profile.
      </p>

      <div className="space-y-5">
        {/* Job Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Job Title *
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Senior Site Engineer"
              style={fieldStyle}
            />
            {showSuggestions && titleSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-20"
                style={{ background: '#16161F', border: '1px solid #1E1E2E' }}>
                {titleSuggestions.map((t) => (
                  <button key={t} onMouseDown={() => selectSuggestion(t)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template suggestion banner */}
          {showTemplate && (
            <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span className="text-xs flex-1" style={{ color: '#F59E0B', fontFamily: 'DM Sans, sans-serif' }}>
                We found a template for <strong>{templateTitle}</strong>. Load it?
              </span>
              <button className="text-xs font-medium px-2 py-1 rounded"
                style={{ background: '#F59E0B', color: '#0A0A0F' }}
                onClick={() => {
                  const template = JOB_TEMPLATE_DEFAULTS[templateTitle]
                  if (template) onChange({ ...template })
                  setShowTemplate(false)
                }}>
                Load Template
              </button>
              <button className="text-xs" style={{ color: '#94A3B8' }}
                onClick={() => setShowTemplate(false)}>
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Department *
          </label>
          <select
            value={data.department}
            onChange={(e) => onChange({ department: e.target.value as Department })}
            style={{ ...fieldStyle, cursor: 'pointer' }}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Location *
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Dubai, UAE"
            style={fieldStyle}
          />
        </div>

        {/* Openings */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Number of Openings
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange({ openings: Math.max(1, data.openings - 1) })}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: '#1E1E2E', color: '#94A3B8' }}>
              <Minus size={14} />
            </button>
            <span className="text-2xl font-bold w-12 text-center"
              style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif' }}>
              {data.openings}
            </span>
            <button
              onClick={() => onChange({ openings: data.openings + 1 })}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: '#1E1E2E', color: '#94A3B8' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Job Description
            <span className="ml-2 normal-case" style={{ color: '#64748B', fontWeight: 400 }}>(optional, for reference only)</span>
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            placeholder="Brief description of the role..."
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  )
}
