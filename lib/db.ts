import { mockJobProfiles, allMockCandidates, mockWhatsAppThreads } from './mock-data'
import type { JobProfile, Candidate, WhatsAppThread, WhatsAppMessage } from '@/types'

// ─── Mutable in-memory stores (reset on server restart) ──────────────────────

let jobs: JobProfile[] = [...mockJobProfiles]
let candidates: Candidate[] = [...allMockCandidates]
let threads: WhatsAppThread[] = JSON.parse(JSON.stringify(mockWhatsAppThreads))

// ─── Database interface ───────────────────────────────────────────────────────

export const db = {
  jobs: {
    list: (): JobProfile[] => [...jobs],

    get: (id: string): JobProfile | null => jobs.find((j) => j.id === id) ?? null,

    create: (data: Omit<JobProfile, 'id' | 'createdAt' | 'updatedAt'>): JobProfile => {
      const newJob: JobProfile = {
        ...data,
        id: `job-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      jobs = [...jobs, newJob]
      return { ...newJob }
    },

    update: (id: string, data: Partial<JobProfile>): JobProfile | null => {
      const idx = jobs.findIndex((j) => j.id === id)
      if (idx === -1) return null
      const updated: JobProfile = {
        ...jobs[idx],
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      }
      jobs = [...jobs.slice(0, idx), updated, ...jobs.slice(idx + 1)]
      return { ...updated }
    },

    delete: (id: string): void => {
      jobs = jobs.filter((j) => j.id !== id)
    },
  },

  candidates: {
    list: (): Candidate[] => [...candidates],

    listByJob: (jobId: string): Candidate[] =>
      candidates.filter((c) => c.jobProfileId === jobId),

    get: (id: string): Candidate | null => candidates.find((c) => c.id === id) ?? null,

    create: (data: Candidate): Candidate => {
      candidates = [...candidates, data]
      return { ...data }
    },

    update: (id: string, data: Partial<Candidate>): Candidate | null => {
      const idx = candidates.findIndex((c) => c.id === id)
      if (idx === -1) return null
      const updated: Candidate = { ...candidates[idx], ...data, id }
      candidates = [...candidates.slice(0, idx), updated, ...candidates.slice(idx + 1)]
      return { ...updated }
    },

    updateStatus: (id: string, status: Candidate['status']): Candidate | null => {
      const idx = candidates.findIndex((c) => c.id === id)
      if (idx === -1) return null
      const now = new Date().toISOString()
      const patch: Partial<Candidate> = { status }
      if (status === 'shortlisted') patch.shortlistedAt = now
      if (status === 'rejected') patch.rejectedAt = now
      const updated: Candidate = { ...candidates[idx], ...patch }
      candidates = [...candidates.slice(0, idx), updated, ...candidates.slice(idx + 1)]
      return { ...updated }
    },
  },

  threads: {
    list: (): WhatsAppThread[] => [...threads],

    get: (id: string): WhatsAppThread | null => threads.find((t) => t.id === id) ?? null,

    addMessage: (threadId: string, message: WhatsAppMessage): WhatsAppThread | null => {
      const idx = threads.findIndex((t) => t.id === threadId)
      if (idx === -1) return null
      const thread = threads[idx]
      const updated: WhatsAppThread = {
        ...thread,
        messages: [...thread.messages, message],
        lastMessage: message.content,
        lastMessageAt: message.sentAt,
        unread: message.direction === 'inbound',
      }
      threads = [...threads.slice(0, idx), updated, ...threads.slice(idx + 1)]
      return { ...updated }
    },

    markRead: (id: string): void => {
      const idx = threads.findIndex((t) => t.id === id)
      if (idx === -1) return
      threads = [
        ...threads.slice(0, idx),
        { ...threads[idx], unread: false },
        ...threads.slice(idx + 1),
      ]
    },
  },
}
