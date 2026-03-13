import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification, CompareSelection, FilterState, AppSettings, AiModel } from '@/types'
import { mockNotifications } from '@/lib/mock-data'

// ─── Notification Store ──────────────────────────────────────────────────────

interface NotificationStore {
  notifications: Notification[]
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (n: Notification) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: mockNotifications,
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  addNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications] })),
}))

// ─── Compare Selection Store ─────────────────────────────────────────────────

interface CompareStore {
  selection: CompareSelection | null
  toggleCandidate: (jobId: string, candidateId: string) => void
  clearSelection: () => void
}

export const useCompareStore = create<CompareStore>((set) => ({
  selection: null,
  toggleCandidate: (jobId, candidateId) =>
    set((s) => {
      const current = s.selection
      if (!current || current.jobProfileId !== jobId) {
        return { selection: { jobProfileId: jobId, candidateIds: [candidateId] } }
      }
      const ids = current.candidateIds.includes(candidateId)
        ? current.candidateIds.filter((id) => id !== candidateId)
        : current.candidateIds.length < 4
        ? [...current.candidateIds, candidateId]
        : current.candidateIds
      return {
        selection:
          ids.length === 0 ? null : { jobProfileId: jobId, candidateIds: ids },
      }
    }),
  clearSelection: () => set({ selection: null }),
}))

// ─── Filter Store ────────────────────────────────────────────────────────────

const defaultFilters: FilterState = {
  scoreMin: 0,
  scoreMax: 100,
  statuses: [],
  scoreTier: 'all',
  missingCriteria: [],
  sortBy: 'score_desc',
}

interface FilterStore {
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))

// ─── Settings Store ───────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  userName: 'HR Manager',
  userEmail: 'hr@talentlens.io',
  userRole: 'HR Manager',
  anthropicApiKey: '',
  aiModel: 'claude-sonnet-4-6' as AiModel,
  aiEnabled: true,
  whatsappAccessToken: '',
  whatsappPhoneNumberId: '',
  whatsappVerifyToken: '',
  whatsappWebhookUrl: '',
  backendApiUrl: '',
  useMockData: true,
  notifyUploadComplete: true,
  notifyScoringComplete: true,
  notifyWhatsAppReply: true,
}

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'talentlens-settings' }
  )
)
