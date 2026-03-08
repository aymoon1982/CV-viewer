'use client'

import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  ctaOnClick?: () => void
}

const DefaultIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="12" width="48" height="40" rx="6" stroke="#1E1E2E" strokeWidth="2" fill="#111118" />
    <rect x="16" y="20" width="32" height="4" rx="2" fill="#1E1E2E" />
    <rect x="16" y="28" width="24" height="4" rx="2" fill="#1E1E2E" />
    <rect x="16" y="36" width="28" height="4" rx="2" fill="#1E1E2E" />
    <circle cx="48" cy="48" r="12" fill="#111118" stroke="#1E1E2E" strokeWidth="2" />
    <path d="M44 48 L52 48 M48 44 L48 52" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="mb-6">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif' }}>
        {title}
      </h3>
      <p className="text-sm mb-8 max-w-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}>
        {description}
      </p>
      {(ctaLabel && ctaHref) && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
          {ctaLabel}
        </Link>
      )}
      {(ctaLabel && ctaOnClick) && (
        <button
          onClick={ctaOnClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
