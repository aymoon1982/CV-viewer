import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FALLBACK_DRAFT =
  "Thank you for your quick response! That timing works perfectly for us. I'll send a calendar invite with the video call link shortly. Please let me know if you need any further information before then."

export async function POST(req: Request) {
  const body: { threadId: string } = await req.json()
  const { threadId } = body

  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })
  }

  const thread = db.threads.get(threadId)
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Dynamic import so the server doesn't crash if the SDK isn't installed
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const recentMessages = thread.messages
        .slice(-6)
        .map((m) => `${m.direction === 'inbound' ? thread.candidateName : 'Recruiter'}: ${m.content}`)
        .join('\n')

      const systemPrompt = `You are an AI recruitment assistant for TalentLens. Draft a professional WhatsApp reply to a candidate on behalf of a recruiter.
Candidate: ${thread.candidateName}
Job: ${thread.jobTitle}
Recent conversation:
${recentMessages}
Write a concise, friendly, professional reply. Do not include any preamble or explanation — output only the message text.`

      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Draft a reply to the candidate.' }],
      })

      const draft =
        response.content[0].type === 'text' ? response.content[0].text : FALLBACK_DRAFT

      return NextResponse.json({ draft })
    } catch (err) {
      console.error('Anthropic API error:', err)
      // Fall through to mock draft
    }
  }

  return NextResponse.json({ draft: FALLBACK_DRAFT })
}
