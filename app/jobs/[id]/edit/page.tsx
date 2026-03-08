'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditJobPage() {
  const params = useParams<{ id: string }>()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
        Edit Job Profile
      </h1>
      <p className="text-sm mt-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        Editing job ID: <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366F1' }}>{params.id}</code>
      </p>
      <p className="mt-4 text-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
        The same multi-step form as &ldquo;New Job&rdquo; pre-populated with existing data.
        Pre-population is connected to the real API in Phase 2.
      </p>
    </div>
  )
}
