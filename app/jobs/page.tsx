'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { JobProfile } from '@/types'
import { JobProfileCard } from '@/components/jobs/JobProfileCard'
import { JobCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      setJobs(await apiClient.jobs.list())
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          Job Profiles
        </h1>
        <Link href="/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
          <Plus size={16} />
          New Job Profile
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetch} />
      ) : jobs.length === 0 ? (
        <EmptyState title="No job profiles yet" description="Create your first job profile." ctaLabel="New Job Profile" ctaHref="/jobs/new" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => <JobProfileCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
