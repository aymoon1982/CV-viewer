import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Candidate } from '@/types'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const job = db.jobs.get(id)
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const scoreMin = searchParams.get('scoreMin')
  const scoreMax = searchParams.get('scoreMax')
  const statusesParam = searchParams.get('statuses')

  let candidates: Candidate[] = db.candidates.listByJob(id)

  if (scoreMin !== null) {
    const min = Number(scoreMin)
    candidates = candidates.filter((c) => c.finalScore >= min)
  }

  if (scoreMax !== null) {
    const max = Number(scoreMax)
    candidates = candidates.filter((c) => c.finalScore <= max)
  }

  if (statusesParam) {
    const statuses = statusesParam.split(',') as Candidate['status'][]
    candidates = candidates.filter((c) => statuses.includes(c.status))
  }

  return NextResponse.json(candidates)
}
