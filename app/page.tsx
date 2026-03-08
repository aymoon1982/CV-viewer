'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Users, Star, Clock } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { JobProfile } from '@/types'
import { JobProfileCard } from '@/components/jobs/JobProfileCard'
import { JobCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.jobs.list()
      setJobs(data)
    } catch {
      setError('Failed to load job profiles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const totalCandidates = jobs.reduce((sum, j) => sum + j.stats.uploaded, 0)
  const totalShortlisted = jobs.reduce((sum, j) => sum + j.stats.shortlisted, 0)
  const activeJobs = jobs.filter((j) => j.status === 'active').length

  const stats = [
    { label: 'Active Jobs', value: activeJobs, icon: Briefcase, color: '#6366F1' },
    { label: 'Total Candidates', value: totalCandidates, icon: Users, color: '#22C55E' },
    { label: 'Shortlisted', value: totalShortlisted, icon: Star, color: '#F59E0B' },
    { label: 'Avg Time to Shortlist', value: '3.2d', icon: Clock, color: '#94A3B8' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1"
            style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            Recruitment Dashboard
          </h1>
          <p className="text-sm" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            Monitor your hiring pipeline at a glance
          </p>
        </div>
        <Link href="/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
          style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
          <Plus size={16} />
          New Job Profile
        </Link>
      </div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={cardVariants}
            className="rounded-xl p-5 noise-texture"
            style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-0.5"
              style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontWeight: 600 }}>
          Job Profiles ({jobs.length})
        </h2>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No job profiles yet"
          description="Create your first job profile to start screening candidates with AI-powered analysis."
          ctaLabel="Create your first job profile"
          ctaHref="/jobs/new"
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible">
          {jobs.map((job) => (
            <motion.div key={job.id} variants={cardVariants}>
              <JobProfileCard job={job} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
