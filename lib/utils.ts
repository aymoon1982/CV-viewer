import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getScoreColor(score: number): string {
  if (score >= 70) return '#22C55E'
  if (score >= 45) return '#F59E0B'
  return '#EF4444'
}

export function getScoreTier(score: number): 'strong' | 'possible' | 'weak' {
  if (score >= 70) return 'strong'
  if (score >= 45) return 'possible'
  return 'weak'
}

export function getScoreTierLabel(score: number): string {
  if (score >= 70) return 'Strong Match'
  if (score >= 45) return 'Possible Match'
  return 'Weak Match'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Interpolate color between red (#EF4444), amber (#F59E0B), green (#22C55E) based on score 0-100
export function scoreToColor(score: number): string {
  const s = Math.max(0, Math.min(100, score)) / 100
  if (s < 0.45) {
    // red to amber
    const t = s / 0.45
    const r = Math.round(lerp(239, 245, t))
    const g = Math.round(lerp(68, 158, t))
    const b = Math.round(lerp(68, 11, t))
    return `rgb(${r},${g},${b})`
  } else {
    // amber to green
    const t = (s - 0.45) / 0.55
    const r = Math.round(lerp(245, 34, t))
    const g = Math.round(lerp(158, 197, t))
    const b = Math.round(lerp(11, 94, t))
    return `rgb(${r},${g},${b})`
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '…'
}
