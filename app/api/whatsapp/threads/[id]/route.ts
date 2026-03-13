import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const thread = db.threads.get(id)
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark as read on retrieval
  db.threads.markRead(id)

  // Return the thread with unread set to false immediately
  return NextResponse.json({ ...thread, unread: false })
}
