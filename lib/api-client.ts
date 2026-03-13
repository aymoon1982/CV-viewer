import type {
  JobProfile,
  Candidate,
  WhatsAppThread,
  ChatMessage,
  ChatScope,
  FilterState,
} from '@/types'
import {
  mockJobProfiles,
  mockCandidatesByJob,
  allMockCandidates,
  mockWhatsAppThreads,
  mockChatResponses,
  mockShortlistChatResponses,
} from './mock-data'
import { delay } from './utils'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// ─── Mock API ────────────────────────────────────────────────────────────────

const mockApi = {
  jobs: {
    list: async (): Promise<JobProfile[]> => {
      await delay(400)
      return [...mockJobProfiles]
    },
    get: async (id: string): Promise<JobProfile | null> => {
      await delay(300)
      return mockJobProfiles.find((j) => j.id === id) ?? null
    },
    create: async (data: Partial<JobProfile>): Promise<JobProfile> => {
      await delay(800)
      const newJob: JobProfile = {
        id: `job-${Date.now()}`,
        title: data.title ?? 'Untitled Role',
        department: data.department ?? 'Engineering',
        location: data.location ?? 'Dubai, UAE',
        openings: data.openings ?? 1,
        status: 'draft',
        mandatoryCriteria: data.mandatoryCriteria ?? {
          degreeRequired: true,
          minDegreeLevel: 'bachelor',
          degreeFields: [],
          yearsMin: 0,
          yearsMax: 30,
          certifications: [],
          uaeDrivingLicense: false,
          rightToWorkUAE: true,
          allowedNationalities: [],
        },
        preferredCriteria: data.preferredCriteria ?? {
          skills: [],
          industryBackground: [],
          employerType: [],
          languages: [],
          relevantProjects: [],
        },
        scoringWeights: data.scoringWeights ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          uploaded: 0,
          scored: 0,
          shortlisted: 0,
          eliminated: 0,
          avgScore: 0,
          scoreDistribution: [],
        },
      }
      return newJob
    },
    update: async (id: string, data: Partial<JobProfile>): Promise<JobProfile> => {
      await delay(600)
      const existing = mockJobProfiles.find((j) => j.id === id)
      if (!existing) throw new Error('Job not found')
      return { ...existing, ...data, updatedAt: new Date().toISOString() }
    },
  },

  candidates: {
    listByJob: async (jobId: string, _filters?: Partial<FilterState>): Promise<Candidate[]> => {
      await delay(500)
      return mockCandidatesByJob[jobId] ?? []
    },
    get: async (candidateId: string): Promise<Candidate | null> => {
      await delay(350)
      return allMockCandidates.find((c) => c.id === candidateId) ?? null
    },
    updateStatus: async (
      candidateId: string,
      status: Candidate['status']
    ): Promise<Candidate> => {
      await delay(400)
      const candidate = allMockCandidates.find((c) => c.id === candidateId)
      if (!candidate) throw new Error('Candidate not found')
      return { ...candidate, status }
    },
  },

  chat: {
    send: async (
      message: string,
      _candidateId: string | null,
      scope: ChatScope
    ): Promise<ChatMessage> => {
      await delay(1500)
      const responses =
        scope === 'shortlist' ? mockShortlistChatResponses : mockChatResponses
      const content =
        responses[message] ??
        'I can help you analyse this candidate\'s profile. Based on the available CV data and scoring breakdown, I don\'t have specific information about that query. Could you rephrase or ask about a specific criterion?'

      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        sources: ['CV extraction', 'Scoring analysis'],
        createdAt: new Date().toISOString(),
      }
    },
  },

  whatsapp: {
    threads: async (): Promise<WhatsAppThread[]> => {
      await delay(400)
      return [...mockWhatsAppThreads]
    },
    thread: async (id: string): Promise<WhatsAppThread | null> => {
      await delay(300)
      return mockWhatsAppThreads.find((t) => t.id === id) ?? null
    },
    sendMessage: async (threadId: string, content: string): Promise<void> => {
      await delay(600)
      // In mock: message is added optimistically by the UI
      void threadId
      void content
    },
    generateDraft: async (threadId: string): Promise<string> => {
      await delay(800)
      void threadId
      return 'Thank you for your quick response! That timing works perfectly for us. I\'ll send a calendar invite for Tuesday at 10:00 AM UAE time with the video call link. Please let me know if you need any further information before then.'
    },
  },
}

// ─── Real API ────────────────────────────────────────────────────────────────

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '')
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API Error ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

const realApi = {
  jobs: {
    list: () => fetchApi<JobProfile[]>('/api/jobs'),
    get: (id: string) => fetchApi<JobProfile>(`/api/jobs/${id}`),
    create: (data: Partial<JobProfile>) =>
      fetchApi<JobProfile>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<JobProfile>) =>
      fetchApi<JobProfile>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    upload: async (jobId: string, files: File[]): Promise<void> => {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      await fetch(`/api/jobs/${jobId}/upload`, { method: 'POST', body: form })
    },
  },
  candidates: {
    listByJob: (jobId: string, filters?: Partial<FilterState>) =>
      fetchApi<Candidate[]>(`/api/jobs/${jobId}/candidates?${new URLSearchParams(filters as Record<string, string>)}`),
    get: (candidateId: string) => fetchApi<Candidate>(`/api/candidates/${candidateId}`),
    updateStatus: (candidateId: string, status: Candidate['status']) =>
      fetchApi<Candidate>(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  chat: {
    send: async (message: string, candidateId: string | null, scope: ChatScope): Promise<ChatMessage> => {
      const endpoint = scope === 'shortlist' ? '/api/chat/shortlist' : '/api/chat/candidate'
      return fetchApi<ChatMessage>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ message, candidateId }),
      })
    },
  },
  whatsapp: {
    threads: () => fetchApi<WhatsAppThread[]>('/api/whatsapp/threads'),
    thread: (id: string) => fetchApi<WhatsAppThread>(`/api/whatsapp/threads/${id}`),
    sendMessage: (threadId: string, content: string) =>
      fetchApi<void>('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ threadId, content }),
      }),
    generateDraft: async (threadId: string): Promise<string> => {
      const data = await fetchApi<{ draft: string }>('/api/whatsapp/draft', {
        method: 'POST',
        body: JSON.stringify({ threadId }),
      })
      return data.draft
    },
  },
}

// ─── Unified Client ──────────────────────────────────────────────────────────

export const apiClient = USE_MOCK ? mockApi : realApi
