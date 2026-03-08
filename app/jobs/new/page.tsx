'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

// Steps
import { Step1RoleBasics } from '@/components/jobs/builder/Step1RoleBasics'
import { Step2MandatoryQuals } from '@/components/jobs/builder/Step2MandatoryQuals'
import { Step3PreferredQuals } from '@/components/jobs/builder/Step3PreferredQuals'
import { Step4ScoringWeights } from '@/components/jobs/builder/Step4ScoringWeights'
import { Step5Review } from '@/components/jobs/builder/Step5Review'

import type { JobProfileFormData, Department, DegreeLevel } from '@/types'

const STEPS = [
  { id: 1, label: 'Role Basics', description: 'Title, location, openings' },
  { id: 2, label: 'Mandatory Criteria', description: 'Degree, experience, certs' },
  { id: 3, label: 'Preferred Criteria', description: 'Skills, industry, languages' },
  { id: 4, label: 'Scoring Weights', description: 'Allocate 100 points' },
  { id: 5, label: 'Review & Save', description: 'Confirm and activate' },
]

const defaultFormData: JobProfileFormData = {
  title: '',
  department: 'Engineering' as Department,
  location: 'Dubai, UAE',
  openings: 1,
  description: '',
  mandatory: {
    degreeRequired: true,
    minDegreeLevel: 'bachelor' as DegreeLevel,
    degreeFields: [],
    yearsMin: 5,
    yearsMax: 15,
    certifications: [],
    uaeDrivingLicense: false,
    rightToWorkUAE: true,
    allowedNationalities: [],
  },
  preferred: {
    skills: [],
    industryBackground: [],
    employerType: [],
    languages: [],
    relevantProjects: [],
  },
  weights: {
    yearsExperience: 20,
    technicalSkills: 25,
    industryBackground: 20,
    certifications: 20,
    languages: 15,
  },
}

export default function NewJobPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<JobProfileFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)

  const updateFormData = (updates: Partial<JobProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const goNext = () => {
    if (currentStep < 5) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  const handleSave = async (status: 'active' | 'draft') => {
    setSaving(true)
    try {
      await apiClient.jobs.create({
        ...formData,
        status,
        mandatoryCriteria: formData.mandatory,
        preferredCriteria: formData.preferred,
        scoringWeights: formData.weights,
      })
      toast.success(status === 'active' ? 'Job profile activated!' : 'Saved as draft')
      router.push('/')
    } catch {
      toast.error('Failed to save job profile')
    } finally {
      setSaving(false)
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            New Job Profile
          </h1>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — steps */}
          <div className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0">
            {STEPS.map((step) => {
              const isDone = step.id < currentStep
              const isCurrent = step.id === currentStep
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: isCurrent ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isCurrent ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
                    style={{
                      background: isDone ? '#22C55E' : isCurrent ? '#6366F1' : '#1E1E2E',
                      border: 'none',
                    }}>
                    {isDone ? (
                      <Check size={12} style={{ color: 'white' }} />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: isCurrent ? 'white' : '#64748B', fontFamily: 'Syne, sans-serif' }}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium"
                      style={{ color: isCurrent ? '#F1F5F9' : isDone ? '#22C55E' : '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                      {step.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                      {step.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Mobile step tabs */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {STEPS.map((step) => {
                const isDone = step.id < currentStep
                const isCurrent = step.id === currentStep
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isCurrent ? '#F1F5F9' : isDone ? '#22C55E' : '#64748B',
                      border: '1px solid',
                      borderColor: isCurrent ? 'rgba(99,102,241,0.3)' : '#1E1E2E',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    {isDone ? <Check size={10} /> : null}
                    {step.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl p-6 sm:p-8 overflow-hidden"
              style={{ background: '#111118', border: '1px solid #1E1E2E', minHeight: 500 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeOut' }}>
                  {currentStep === 1 && (
                    <Step1RoleBasics data={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 2 && (
                    <Step2MandatoryQuals data={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 3 && (
                    <Step3PreferredQuals data={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 4 && (
                    <Step4ScoringWeights data={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 5 && (
                    <Step5Review data={formData} onEditStep={goToStep} onSave={handleSave} saving={saving} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                  style={{ background: '#1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                  Step {currentStep} of {STEPS.length}
                </span>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
