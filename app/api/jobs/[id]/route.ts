import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { JobProfile } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const job = db.jobs.get(id)
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data: Partial<JobProfile> = await req.json()
  const job = db.jobs.update(id, data)
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  db.jobs.delete(id)
  return NextResponse.json({ ok: true })
}
