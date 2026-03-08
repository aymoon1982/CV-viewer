'use client'

import { useMemo } from 'react'
import { getScoreColor } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export function ScoreGauge({
  score,
  size = 80,
  strokeWidth = 7,
  showLabel = true,
  className,
}: ScoreGaugeProps) {
  const color = getScoreColor(score)
  const center = size / 2
  const radius = center - strokeWidth / 2 - 2
  // 180° arc: from 180° to 0° (left to right across top)
  const circumference = Math.PI * radius // half circle

  const { path, progressPath } = useMemo(() => {
    const r = radius
    const cx = center
    const cy = center

    // Start: left (180°), End: right (0°) — semicircle arc going through top
    const startX = cx - r
    const startY = cy
    const endX = cx + r
    const endY = cy

    const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`

    // Progress: clamp score 0-100, map to 0-π radians
    const clampedScore = Math.max(0, Math.min(100, score))
    const fraction = clampedScore / 100
    // Angle from 180° (left) sweeping clockwise to 0° (right)
    const angle = Math.PI * fraction // radians from left
    const px = cx - r * Math.cos(angle)
    const py = cy - r * Math.sin(angle)
    const largeArc = fraction > 0.5 ? 1 : 0
    const progressArcPath =
      fraction === 0
        ? ''
        : fraction >= 1
        ? `M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`
        : `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`

    return { path: trackPath, progressPath: progressArcPath }
  }, [score, radius, center, circumference])

  const fontSize = size < 60 ? 14 : size < 90 ? 20 : 28
  const subFontSize = size < 60 ? 8 : size < 90 ? 10 : 12

  return (
    <div className={className} style={{ width: size, height: size / 2 + strokeWidth + 4, position: 'relative', flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}>
        {/* Track */}
        <path
          d={path}
          fill="none"
          stroke="#1E1E2E"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress */}
        {progressPath && (
          <path
            d={progressPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        )}
        {/* Score label */}
        {showLabel && (
          <>
            <text
              x={center}
              y={center + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="700"
              fill={color}
              fontFamily="Syne, sans-serif">
              {score}
            </text>
            <text
              x={center}
              y={center + fontSize / 2 + 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={subFontSize}
              fill="#64748B"
              fontFamily="DM Sans, sans-serif">
              / 100
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
