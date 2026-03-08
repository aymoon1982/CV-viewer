import { cn } from '@/lib/utils'
import type { CandidateStatus, JobStatus, ThreadStatus } from '@/types'

const candidateStatusConfig: Record<CandidateStatus, { label: string; color: string; bg: string }> = {
  uploaded: { label: 'Uploaded', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  extracting: { label: 'Extracting', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  scoring: { label: 'Scoring', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  scored: { label: 'Scored', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  shortlisted: { label: 'Shortlisted', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  under_review: { label: 'Under Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  eliminated: { label: 'Eliminated', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const jobStatusConfig: Record<JobStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  closed: { label: 'Closed', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  draft: { label: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
}

const threadStatusConfig: Record<ThreadStatus, { label: string; color: string; bg: string }> = {
  screening: { label: 'Screening', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  follow_up: { label: 'Follow-up', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  closed: { label: 'Closed', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
}

interface CandidateStatusBadgeProps {
  status: CandidateStatus
  className?: string
}

export function CandidateStatusBadge({ status, className }: CandidateStatusBadgeProps) {
  const config = candidateStatusConfig[status]
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color: config.color, background: config.bg, fontFamily: 'DM Sans, sans-serif' }}>
      {config.label}
    </span>
  )
}

interface JobStatusBadgeProps {
  status: JobStatus
  className?: string
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = jobStatusConfig[status]
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color: config.color, background: config.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: config.color }} />
      {config.label}
    </span>
  )
}

interface ThreadStatusBadgeProps {
  status: ThreadStatus
  className?: string
}

export function ThreadStatusBadge({ status, className }: ThreadStatusBadgeProps) {
  const config = threadStatusConfig[status]
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color: config.color, background: config.bg, fontFamily: 'DM Sans, sans-serif' }}>
      {config.label}
    </span>
  )
}
