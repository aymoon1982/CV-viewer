import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ChatMessage } from '@/types'

export async function POST(req: Request) {
  const body: { message: string; candidateId: string } = await req.json()
  const { message, candidateId } = body

  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const candidate = db.candidates.get(candidateId)

  if (process.env.ANTHROPIC_API_KEY && candidate) {
    try {
      // Dynamic import so the server doesn't crash if the SDK isn't installed
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const systemPrompt = `You are an AI recruitment assistant for TalentLens. You are helping an HR manager evaluate a candidate.
Candidate Profile:
Name: ${candidate.name}
Current Role: ${candidate.currentTitle} at ${candidate.currentCompany}
Experience: ${candidate.yearsExperience} years
Score: ${candidate.finalScore}/100
Summary: ${candidate.aiSummary}
Answer questions about this candidate concisely and professionally.`

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
        sources: ['CV extraction', 'Scoring analysis'],
        createdAt: new Date().toISOString(),
      }
      return NextResponse.json(chatMessage)
    } catch (err) {
      console.error('Anthropic API error:', err)
      // Fall through to mock response
    }
  }

  // Mock response when no API key or candidate not found
  const chatMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: candidate
      ? `Based on ${candidate.name}'s profile, they have ${candidate.yearsExperience} years of experience as ${candidate.currentTitle} at ${candidate.currentCompany}. Their overall score is ${candidate.finalScore}/100. ${candidate.aiSummary || 'No additional summary available.'}`
      : "I couldn't find the candidate's profile. Please ensure the candidate ID is valid.",
    sources: ['CV extraction', 'Scoring analysis'],
    createdAt: new Date().toISOString(),
  }
  return NextResponse.json(chatMessage)
}
