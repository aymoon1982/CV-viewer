'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageSquare } from 'lucide-react'
import type { ChatMessage, ChatScope } from '@/types'
import { apiClient } from '@/lib/api-client'
import { mockChatResponses, mockShortlistChatResponses } from '@/lib/mock-data'

const SUGGESTED_CANDIDATE = [
  'What are the key gaps for this role?',
  'Summarize leadership experience',
  'How does this candidate compare to average shortlisted?',
  'Are there any red flags?',
  'Is this candidate likely overqualified?',
]

const SUGGESTED_SHORTLIST = [
  'Compare top 3 candidates',
  'Who has the best cultural fit for UAE clients?',
]

interface Props {
  candidateId: string
  candidateName: string
}

export function ChatPanel({ candidateId, candidateName }: Props) {
  const [scope, setScope] = useState<ChatScope>('candidate')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const simulateStream = async (text: string) => {
    setIsStreaming(true)
    setStreamingText('')
    const charsPerTick = 3
    const tickMs = 33 // ~30 chars/sec
    for (let i = 0; i < text.length; i += charsPerTick) {
      await new Promise((r) => setTimeout(r, tickMs))
      setStreamingText(text.slice(0, i + charsPerTick))
    }
    setStreamingText(text)
    await new Promise((r) => setTimeout(r, 50))
    setIsStreaming(false)
    return text
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const response = await apiClient.chat.send(content, candidateId, scope)
      const fullText = response.content
      await simulateStream(fullText)
      const aiMsg: ChatMessage = {
        ...response,
        content: fullText,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to get a response. Please try again.',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const suggested = scope === 'candidate' ? SUGGESTED_CANDIDATE : SUGGESTED_SHORTLIST

  return (
    <div className="flex flex-col h-full" style={{ background: '#111118' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #1E1E2E' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
            Ask about {scope === 'candidate' ? candidateName : 'shortlisted candidates'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            {scope === 'candidate' ? 'Context: this candidate\'s profile' : 'Context: all shortlisted candidates'}
          </p>
        </div>
        {/* Scope toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1E1E2E' }}>
          {(['candidate', 'shortlist'] as ChatScope[]).map((s) => (
            <button key={s}
              onClick={() => setScope(s)}
              className="px-3 py-1.5 text-xs font-medium transition-colors capitalize"
              style={{
                background: scope === s ? '#6366F1' : 'transparent',
                color: scope === s ? 'white' : '#64748B',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              {s === 'candidate' ? 'This Candidate' : 'Shortlist'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              <MessageSquare size={22} style={{ color: '#6366F1' }} />
            </div>
            <p className="text-sm text-center" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
              Ask anything about {scope === 'candidate' ? candidateName : 'shortlisted candidates'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? '#6366F1' : '#16161F',
                  color: '#F1F5F9',
                  fontFamily: 'DM Sans, sans-serif',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '4px 18px 18px 18px',
                }}>
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {msg.sources.map((src) => (
                    <span key={src} className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Streaming AI response */}
        {isStreaming && streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                background: '#16161F',
                color: '#F1F5F9',
                fontFamily: 'DM Sans, sans-serif',
                borderRadius: '4px 18px 18px 18px',
              }}>
              {streamingText}
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-current align-middle animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Loading dots */}
        {loading && !isStreaming && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{ background: '#16161F', borderRadius: '4px 18px 18px 18px' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#6366F1' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {suggested.map((q) => (
            <button key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-90"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.2)',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1E1E2E' }}>
        <div className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this candidate…"
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm outline-none"
            style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', maxHeight: 120 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: '#6366F1', color: 'white' }}>
            <Send size={13} />
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}
