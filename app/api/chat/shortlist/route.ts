import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ChatMessage } from '@/types'

export async function POST(req: Request) {
  const body: { message: string; jobProfileId?: string } = await req.json()
  const { message, jobProfileId } = body

  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const shortlisted = jobProfileId
    ? db.candidates
        .listByJob(jobProfileId)
        .filter((c) => c.status === 'shortlisted')
    : db.candidates.list().filter((c) => c.status === 'shortlisted')

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Dynamic import so the server doesn't crash if the SDK isn't installed
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const candidateSummaries = shortlisted
        .map(
          (c) =>
            `- ${c.name} (${c.currentTitle} @ ${c.currentCompany}, ${c.yearsExperience} yrs, score: ${c.finalScore}/100)`
        )
        .join('\n')

      const systemPrompt = `You are an AI recruitment assistant for TalentLens. You are helping an HR manager compare and evaluate shortlisted candidates.
Shortlisted Candidates (${shortlisted.length} total):
${candidateSummaries || 'No shortlisted candidates yet.'}
Answer questions about these candidates concisely and professionally. You can compare them, highlight strengths and weaknesses, and provide recommendations.`

      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      })

      const content =
        response.content[0].type === 'text' ? response.content[0].text : ''

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        sources: ['Shortlist', 'Scoring analysis'],
        createdAt: new Date().toISOString(),
      }
      return NextResponse.json(chatMessage)
    } catch (err) {
      console.error('Anthropic API error:', err)
      // Fall through to mock response
    }
  }

  // Mock response
  const topCandidate = shortlisted.sort((a, b) => b.finalScore - a.finalScore)[0]
  const content =
    shortlisted.length === 0
      ? 'There are currently no shortlisted candidates. Please shortlist some candidates first to use this feature.'
      : `You have ${shortlisted.length} shortlisted candidate${shortlisted.length !== 1 ? 's' : ''}. ${
          topCandidate
            ? `The top scorer is ${topCandidate.name} with ${topCandidate.finalScore}/100 points (${topCandidate.currentTitle} at ${topCandidate.currentCompany}, ${topCandidate.yearsExperience} years experience).`
            : ''
        } I can help you compare candidates, review their qualifications, or suggest next steps in your recruitment process.`

  const chatMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content,
    sources: ['Shortlist', 'Scoring analysis'],
    createdAt: new Date().toISOString(),
  }
  return NextResponse.json(chatMessage)
}
