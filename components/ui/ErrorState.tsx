'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertTriangle size={28} style={{ color: '#EF4444' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif' }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#1E1E2E', color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  )
}
