import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { JobProfile } from '@/types'

export async function GET() {
  return NextResponse.json(db.jobs.list())
}

export async function POST(req: Request) {
  const data: Omit<JobProfile, 'id' | 'createdAt' | 'updatedAt'> = await req.json()
  const job = db.jobs.create(data)
  return NextResponse.json(job, { status: 201 })
}
