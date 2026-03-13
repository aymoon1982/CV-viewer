import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Candidate } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const candidate = db.candidates.get(id)
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(candidate)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body: { status?: Candidate['status'] } = await req.json()

  if (!body.status) {
    return NextResponse.json({ error: 'Missing status field' }, { status: 400 })
  }

  const updated = db.candidates.updateStatus(id, body.status)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
