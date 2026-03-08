import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={style}
    />
  )
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl p-6" style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function CandidateCardSkeleton() {
  return (
    <div className="rounded-xl p-4" style={{ background: '#111118', border: '1px solid #1E1E2E' }}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-56 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
