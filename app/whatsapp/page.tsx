'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, Sparkles, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { WhatsAppThread, WhatsAppMessage, ThreadStatus } from '@/types'
import { ThreadStatusBadge } from '@/components/ui/StatusBadge'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { mockMessageTemplates } from '@/lib/mock-data'
import { Skeleton } from '@/components/ui/Skeleton'

const FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'screening', label: 'Screening' },
  { value: 'follow_up', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
]

export default function WhatsAppPage() {
  const [threads, setThreads] = useState<WhatsAppThread[]>([])
  const [loading, setLoading] = useState(true)
  const [activeThread, setActiveThread] = useState<WhatsAppThread | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftSuggestion, setDraftSuggestion] = useState<string | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const data = await apiClient.whatsapp.threads()
      setThreads(data)
      setActiveThread(data[0] ?? null)
      setLoading(false)
    }
    fetch()
  }, [])

  const filteredThreads = threads.filter((t) => {
    const matchesTab = activeTab === 'all' || t.status === activeTab
    const matchesSearch =
      search === '' ||
      t.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      t.jobTitle.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const selectThread = (thread: WhatsAppThread) => {
    // Mark as read
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
    )
    setActiveThread({ ...thread, unread: false })
    setMobileShowThread(true)
    setDraftSuggestion(null)
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeThread) return
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      threadId: activeThread.id,
      direction: 'outbound',
      content: messageInput,
      messageType: 'free_text',
      sentAt: new Date().toISOString(),
    }
    // Optimistic update
    const updatedThread = { ...activeThread, messages: [...activeThread.messages, newMsg], lastMessage: messageInput, lastMessageAt: newMsg.sentAt }
    setActiveThread(updatedThread)
    setThreads((prev) => prev.map((t) => t.id === activeThread.id ? updatedThread : t))
    setMessageInput('')
    setDraftSuggestion(null)
    toast.success('Message sent')
  }

  const generateDraft = async () => {
    if (!activeThread) return
    setDraftLoading(true)
    const draft = await apiClient.whatsapp.generateDraft(activeThread.id)
    setDraftSuggestion(draft)
    setDraftLoading(false)
  }

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Conversation list */}
      <aside
        className={`flex flex-col ${mobileShowThread ? 'hidden md:flex' : 'flex'} md:flex`}
        style={{ width: 340, flexShrink: 0, borderRight: '1px solid #1E1E2E', background: '#111118' }}>
        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E1E2E' }}>
          <h2 className="text-base font-bold mb-2" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            WhatsApp Inbox
          </h2>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: '#0A0A0F', border: '1px solid #1E1E2E', color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 py-2" style={{ borderBottom: '1px solid #1E1E2E' }}>
          {FILTER_TABS.map(({ value, label }) => (
            <button key={value}
              onClick={() => setActiveTab(value)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: activeTab === value ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === value ? '#818CF8' : '#64748B',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-sm" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>No conversations found</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => selectThread(thread)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: '1px solid #1E1E2E',
                  background: activeThread?.id === thread.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                }}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                    {getInitials(thread.candidateName)}
                  </div>
                  {thread.unread && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{ background: '#22C55E', border: '2px solid #111118' }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: thread.unread ? '#F1F5F9' : '#94A3B8', fontFamily: 'DM Sans, sans-serif', fontWeight: thread.unread ? 600 : 400 }}>
                      {thread.candidateName}
                    </p>
                    <p className="text-xs flex-shrink-0 ml-2" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatRelativeTime(thread.lastMessageAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded text-xs"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontFamily: 'DM Sans, sans-serif', fontSize: '10px' }}>
                      {thread.jobTitle}
                    </span>
                    <ThreadStatusBadge status={thread.status} />
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                    {thread.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conversation thread */}
      <div className={`flex flex-col flex-1 ${!mobileShowThread ? 'hidden md:flex' : 'flex'} md:flex`}
        style={{ background: '#0A0A0F', minWidth: 0 }}>
        {activeThread ? (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid #1E1E2E', background: '#111118' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileShowThread(false)}
                  className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: '#64748B' }}>
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white' }}>
                  {getInitials(activeThread.candidateName)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                    {activeThread.candidateName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                      {activeThread.jobTitle} · {activeThread.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
              <ScoreGauge score={activeThread.candidateScore} size={56} strokeWidth={5} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {activeThread.messages.map((msg) => {
                if (msg.isSystemEvent) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs px-3 py-1 rounded-full"
                        style={{ background: '#1E1E2E', color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        {msg.content}
                      </span>
                    </div>
                  )
                }
                return (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: msg.direction === 'outbound' ? '#6366F1' : '#16161F',
                          color: '#F1F5F9',
                          fontFamily: 'DM Sans, sans-serif',
                          borderRadius: msg.direction === 'outbound'
                            ? '18px 18px 4px 18px'
                            : '4px 18px 18px 18px',
                        }}>
                        {msg.content}
                      </div>
                      <p className="text-xs mt-1 px-1"
                        style={{
                          color: '#64748B',
                          fontFamily: 'DM Sans, sans-serif',
                          textAlign: msg.direction === 'outbound' ? 'right' : 'left',
                        }}>
                        {formatRelativeTime(msg.sentAt)}
                        {msg.readAt && msg.direction === 'outbound' && ' · Read'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI Draft suggestion */}
            <AnimatePresence>
              {draftSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mx-5 mb-2 px-4 py-3 rounded-xl flex items-start gap-3"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Sparkles size={14} style={{ color: '#6366F1', flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium mb-1" style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>AI Draft</p>
                    <p className="text-xs" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                      {draftSuggestion}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { setMessageInput(draftSuggestion); setDraftSuggestion(null) }}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                        Use this
                      </button>
                      <button onClick={() => setDraftSuggestion(null)} style={{ color: '#64748B' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Template picker */}
            <AnimatePresence>
              {templateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mx-5 mb-2 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: '#16161F', border: '1px solid #1E1E2E' }}>
                  {mockMessageTemplates.map((tmpl) => (
                    <button key={tmpl.id}
                      onClick={() => {
                        setMessageInput(tmpl.content)
                        setTemplateOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
                      style={{ borderBottom: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                        {tmpl.name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        {tmpl.content}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="px-5 py-3" style={{ borderTop: '1px solid #1E1E2E', background: '#111118' }}>
              <div className="flex items-end gap-2">
                <div className="flex-1 rounded-xl px-4 py-3 flex items-end gap-3"
                  style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none text-sm outline-none"
                    style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', maxHeight: 120 }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={generateDraft}
                    disabled={draftLoading}
                    title="AI Draft"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                    <Sparkles size={14} />
                  </button>
                  <button
                    onClick={() => setTemplateOpen(!templateOpen)}
                    title="Templates"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                    style={{ background: '#1E1E2E', color: '#94A3B8' }}>
                    <span className="text-xs font-bold">T</span>
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: '#6366F1', color: 'white' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
              Select a conversation to view messages
            </p>
          </div>
        )}
      </div>

      {/* Click outside to close template */}
      {templateOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setTemplateOpen(false)} />
      )}
    </div>
  )
}
