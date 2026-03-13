import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { WhatsAppMessage } from '@/types'

export async function POST(req: Request) {
  const body: { threadId: string; content: string } = await req.json()
  const { threadId, content } = body

  if (!threadId || !content) {
    return NextResponse.json({ error: 'Missing threadId or content' }, { status: 400 })
  }

  const thread = db.threads.get(threadId)
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const now = new Date().toISOString()
  const message: WhatsAppMessage = {
    id: `msg-${Date.now()}`,
    threadId,
    direction: 'outbound',
    content,
    messageType: 'free_text',
    sentAt: now,
    deliveredAt: now,
  }

  const updated = db.threads.addMessage(threadId, message)
  return NextResponse.json(updated)
}
