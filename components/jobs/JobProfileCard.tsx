'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart2,
  Calendar,
  Copy,
  Edit3,
  Eye,
  MapPin,
  MoreHorizontal,
  Users,
  Archive,
} from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import type { JobProfile } from '@/types'
import { JobStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface JobProfileCardProps {
  job: JobProfile
}

export function JobProfileCard({ job }: JobProfileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const handleClone = () => {
    toast.success('Opening new job with copied settings...')
    router.push(`/jobs/new?clone=${job.id}`)
    setMenuOpen(false)
  }

  const handleArchive = async () => {
    setMenuOpen(false)
    try {
      await apiClient.jobs.update(job.id, { status: 'closed' })
      toast.success('Job profile archived')
    } catch {
      toast.error('Failed to archive job')
    }
  }

  const pipelineItems = [
    { label: 'Uploaded', value: job.stats.uploaded, color: '#94A3B8' },
    { label: 'Scored', value: job.stats.scored, color: '#6366F1' },
    { label: 'Shortlisted', value: job.stats.shortlisted, color: '#22C55E' },
    { label: 'Eliminated', value: job.stats.eliminated, color: '#EF4444' },
  ]

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(99,102,241,0.12)' }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl overflow-hidden noise-texture"
      style={{
        background: '#111118',
        border: '1px solid #1E1E2E',
      }}>
      {/* Gradient accent top border */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate mb-1"
              style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
              {job.title}
            </h3>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
              <span className="flex items-center gap-1">
                <BarChart2 size={11} />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {job.location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <JobStatusBadge status={job.status} />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#64748B' }}>
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-lg overflow-hidden shadow-xl z-20"
                    style={{ background: '#16161F', border: '1px solid #1E1E2E' }}>
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                      style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      <Edit3 size={13} />
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleClone}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                      style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      <Copy size={13} />
                      Clone
                    </button>
                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                      style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                      <Archive size={13} />
                      Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline bar */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {pipelineItems.map(({ label, value, color }) => (
            <span key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: '#0A0A0F', color, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
              {label}: {value}
            </span>
          ))}
        </div>

        {/* Score sparkline */}
        <div className="mb-4" style={{ height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={job.stats.scoreDistribution} barCategoryGap="20%">
              <Bar dataKey="count" fill="#6366F1" radius={[2, 2, 0, 0]} opacity={0.7} />
              <Tooltip
                contentStyle={{
                  background: '#16161F',
                  border: '1px solid #1E1E2E',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '11px',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                formatter={(val: number | undefined) => [`${val ?? 0} candidates`, '' as const]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            <Calendar size={11} />
            <span>Created {formatDate(job.createdAt)}</span>
            <span className="ml-2 flex items-center gap-1">
              <Users size={11} />
              {job.openings} opening{job.openings !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#F59E0B', fontFamily: 'Syne, sans-serif' }}>
            Avg {job.stats.avgScore}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #1E1E2E' }}>
          <Link href={`/jobs/${job.id}/results`}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
            <Eye size={14} />
            View Results
          </Link>
          <Link href={`/jobs/${job.id}/upload`}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
            style={{ border: '1px solid #1E1E2E', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
            Upload CVs
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
