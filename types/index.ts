// ─── Job Profile Types ─────────────────────────────────────────────────────

export type JobStatus = 'active' | 'paused' | 'closed' | 'draft'
export type DegreeLevel = 'any' | 'diploma' | 'bachelor' | 'master' | 'phd'
export type Department = 'Engineering' | 'Commercial' | 'Operations' | 'HR' | 'Finance'

export interface MandatoryCriteria {
  degreeRequired: boolean
  minDegreeLevel: DegreeLevel
  degreeFields: string[]
  yearsMin: number
  yearsMax: number
  certifications: string[]
  uaeDrivingLicense: boolean
  rightToWorkUAE: boolean
  allowedNationalities: string[]
}

export interface PreferredSkill {
  id: string
  name: string
  weight: number // 1-5 stars
}

export interface PreferredCriteria {
  skills: PreferredSkill[]
  industryBackground: string[]
  employerType: string[]
  languages: string[]
  relevantProjects: string[]
}

export interface ScoringWeights {
  [criterionId: string]: number // weights sum to 100
}

export interface JobProfile {
  id: string
  title: string
  department: Department
  location: string
  openings: number
  status: JobStatus
  description?: string
  mandatoryCriteria: MandatoryCriteria
  preferredCriteria: PreferredCriteria
  scoringWeights: ScoringWeights
  templateUsed?: string
  createdAt: string
  updatedAt: string
  stats: JobStats
}

export interface JobStats {
  uploaded: number
  scored: number
  shortlisted: number
  eliminated: number
  avgScore: number
  scoreDistribution: ScoreDistributionPoint[]
}

export interface ScoreDistributionPoint {
  range: string
  count: number
}

// ─── Candidate Types ────────────────────────────────────────────────────────

export type CandidateStatus =
  | 'uploaded'
  | 'extracting'
  | 'scoring'
  | 'scored'
  | 'shortlisted'
  | 'under_review'
  | 'rejected'
  | 'eliminated'

export interface EducationEntry {
  institution: string
  degree: string
  field: string
  year: number
  grade?: string
}

export interface ExperienceEntry {
  company: string
  title: string
  startDate: string
  endDate: string | null // null = current
  duration: string // e.g. "3 yr 2 mo"
  description?: string
}

export interface CandidateSkill {
  name: string
  matched: boolean
  confidence: number
}

export interface CriterionScore {
  score: number
  justification: string
  passFail?: 'pass' | 'fail' // for mandatory criteria
}

export interface Candidate {
  id: string
  jobProfileId: string
  name: string
  email: string
  phone: string
  nationality: string
  age?: number
  languages: string[]
  currentTitle: string
  currentCompany: string
  yearsExperience: number
  degreeLevel: DegreeLevel
  degreeField: string
  education: EducationEntry[]
  experience: ExperienceEntry[]
  skills: CandidateSkill[]
  certifications: string[]
  status: CandidateStatus
  finalScore: number
  criterionScores: Record<string, CriterionScore>
  aiSummary: string
  eliminationReason?: string
  cvFilePath?: string
  extractionConfidence: number
  shortlistedAt?: string
  rejectedAt?: string
  createdAt: string
}

// ─── WhatsApp Types ─────────────────────────────────────────────────────────

export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'template' | 'free_text' | 'screening' | 'ai_draft'
export type ThreadStatus = 'screening' | 'follow_up' | 'closed'

export interface WhatsAppMessage {
  id: string
  threadId: string
  direction: MessageDirection
  content: string
  messageType: MessageType
  sentAt: string
  deliveredAt?: string
  readAt?: string
  isSystemEvent?: boolean
}

export interface WhatsAppThread {
  id: string
  candidateId: string
  candidateName: string
  candidateInitials: string
  jobProfileId: string
  jobTitle: string
  phoneNumber: string
  status: ThreadStatus
  lastMessage: string
  lastMessageAt: string
  unread: boolean
  candidateScore: number
  messages: WhatsAppMessage[]
}

// ─── Notification Types ─────────────────────────────────────────────────────

export type NotificationType = 'upload_complete' | 'scoring_complete' | 'whatsapp_reply'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  href?: string
}

// ─── UI / Store Types ───────────────────────────────────────────────────────

export interface FilterState {
  scoreMin: number
  scoreMax: number
  statuses: CandidateStatus[]
  scoreTier: 'all' | 'strong' | 'possible' | 'weak'
  missingCriteria: string[]
  sortBy: 'score_desc' | 'score_asc' | 'date' | 'experience_desc'
}

export interface CompareSelection {
  jobProfileId: string
  candidateIds: string[]
}

// ─── Chat Types ─────────────────────────────────────────────────────────────

export type ChatScope = 'candidate' | 'shortlist'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  createdAt: string
}

// ─── Form Types ─────────────────────────────────────────────────────────────

export interface JobProfileFormData {
  // Step 1
  title: string
  department: Department
  location: string
  openings: number
  description?: string
  // Step 2
  mandatory: MandatoryCriteria
  // Step 3
  preferred: PreferredCriteria
  // Step 4
  weights: ScoringWeights
}

// ─── Upload Types ───────────────────────────────────────────────────────────

export type UploadStatus = 'queued' | 'extracting' | 'scoring' | 'done' | 'failed'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'pdf' | 'docx'
  status: UploadStatus
  progress: number
  error?: string
}

// ─── Settings Types ──────────────────────────────────────────────────────────

export type AiModel =
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-haiku-4-5-20251001'

export interface AppSettings {
  // User Profile
  userName: string
  userEmail: string
  userRole: string
  // AI Configuration
  anthropicApiKey: string
  aiModel: AiModel
  aiEnabled: boolean
  // WhatsApp Configuration
  whatsappAccessToken: string
  whatsappPhoneNumberId: string
  whatsappVerifyToken: string
  whatsappWebhookUrl: string
  // Integration
  backendApiUrl: string
  useMockData: boolean
  // Notification Preferences
  notifyUploadComplete: boolean
  notifyScoringComplete: boolean
  notifyWhatsAppReply: boolean
}
