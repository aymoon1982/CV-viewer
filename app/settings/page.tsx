'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bot,
  MessageSquare,
  Link2,
  Bell,
  Save,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSettingsStore } from '@/store'
import type { AiModel } from '@/types'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai', label: 'AI Configuration', icon: Bot },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const

type TabId = (typeof TABS)[number]['id']

const fieldStyle = {
  background: '#0A0A0F',
  border: '1px solid #1E1E2E',
  color: '#F1F5F9',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'DM Sans, sans-serif',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: '12px',
  fontWeight: 500,
  color: '#94A3B8',
  fontFamily: 'DM Sans, sans-serif',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '6px',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
      {children}
    </h3>
  )
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm mb-5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-6" style={{ borderTop: '1px solid #1E1E2E' }} />
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <span className="text-sm" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
        style={{ background: value ? '#6366F1' : '#1E1E2E' }}
        aria-checked={value}
        role="switch">
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
          style={{
            background: 'white',
            transform: value ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </label>
  )
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••••••••••'}
        style={{ ...fieldStyle, paddingRight: '40px', fontFamily: value ? 'JetBrains Mono, monospace' : 'DM Sans, sans-serif' }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: '#64748B' }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function StatusIndicator({ connected, label }: { connected: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', fontFamily: 'DM Sans, sans-serif' }}>
      {connected
        ? <CheckCircle size={12} style={{ color: '#22C55E' }} />
        : <AlertTriangle size={12} style={{ color: '#64748B' }} />}
      <span style={{ color: connected ? '#22C55E' : '#64748B' }}>{label}</span>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast.success('Settings saved')
  }

  const handleReset = () => {
    resetSettings()
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            Configure your TalentLens workspace, AI integrations, and notification preferences.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar tabs */}
          <nav className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  }}>
                  <Icon size={15} style={{ color: isActive ? '#818CF8' : '#64748B', flexShrink: 0 }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? '#F1F5F9' : '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                    {label}
                  </span>
                  {isActive && <ChevronRight size={12} className="ml-auto" style={{ color: '#6366F1' }} />}
                </button>
              )
            })}
          </nav>

          {/* Mobile tabs */}
          <div className="md:hidden w-full mb-4 overflow-x-auto">
            <div className="flex gap-1 pb-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.15)' : '#1E1E2E',
                      color: isActive ? '#F1F5F9' : '#64748B',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    <Icon size={12} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl p-6"
              style={{ background: '#111118', border: '1px solid #1E1E2E' }}>

              {/* ── Profile ── */}
              {activeTab === 'profile' && (
                <div>
                  <SectionTitle>User Profile</SectionTitle>
                  <SectionDesc>Your personal information displayed across the platform.</SectionDesc>

                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white', fontFamily: 'Syne, sans-serif' }}>
                        {settings.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>{settings.userName}</p>
                        <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>{settings.userEmail}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6366F1', fontFamily: 'DM Sans, sans-serif' }}>{settings.userRole}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <input
                          type="text"
                          value={settings.userName}
                          onChange={(e) => updateSettings({ userName: e.target.value })}
                          placeholder="Your full name"
                          style={fieldStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                          type="email"
                          value={settings.userEmail}
                          onChange={(e) => updateSettings({ userEmail: e.target.value })}
                          placeholder="you@company.com"
                          style={fieldStyle}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label style={labelStyle}>Role / Title</label>
                        <input
                          type="text"
                          value={settings.userRole}
                          onChange={(e) => updateSettings({ userRole: e.target.value })}
                          placeholder="e.g. HR Manager, Talent Acquisition Lead"
                          style={fieldStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI Configuration ── */}
              {activeTab === 'ai' && (
                <div>
                  <SectionTitle>AI Configuration</SectionTitle>
                  <SectionDesc>
                    Configure the Anthropic Claude integration used for CV analysis, candidate chat, and WhatsApp draft generation.
                    Your API key is stored locally in your browser and never sent to any third-party server.
                  </SectionDesc>

                  <div className="space-y-5">
                    <Toggle
                      value={settings.aiEnabled}
                      onChange={(v) => updateSettings({ aiEnabled: v })}
                      label="Enable AI features (chat, scoring, draft generation)"
                    />

                    <Divider />

                    <div>
                      <label style={labelStyle}>Anthropic API Key</label>
                      <SecretInput
                        value={settings.anthropicApiKey}
                        onChange={(v) => updateSettings({ anthropicApiKey: v })}
                        placeholder="sk-ant-api03-..."
                      />
                      <p className="text-xs mt-1.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        Get your API key from{' '}
                        <span style={{ color: '#6366F1' }}>console.anthropic.com</span>.
                        Required for AI chat and WhatsApp draft generation.
                      </p>
                    </div>

                    <div>
                      <label style={labelStyle}>Model</label>
                      <select
                        value={settings.aiModel}
                        onChange={(e) => updateSettings({ aiModel: e.target.value as AiModel })}
                        style={{ ...fieldStyle, cursor: 'pointer' }}>
                        <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Balanced (Recommended)</option>
                        <option value="claude-opus-4-6">Claude Opus 4.6 — Most Capable</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — Fastest</option>
                      </select>
                      <p className="text-xs mt-1.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        Sonnet 4.6 is recommended for the best balance of speed and quality.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusIndicator connected={!!settings.anthropicApiKey} label={settings.anthropicApiKey ? 'API key configured' : 'No API key — using mock AI'} />
                        <StatusIndicator connected={settings.aiEnabled} label={settings.aiEnabled ? 'AI features enabled' : 'AI features disabled'} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WhatsApp ── */}
              {activeTab === 'whatsapp' && (
                <div>
                  <SectionTitle>WhatsApp Business API</SectionTitle>
                  <SectionDesc>
                    Connect your WhatsApp Business account to send and receive messages directly from TalentLens.
                    You will need a Meta Developer account and a WhatsApp Business App.
                  </SectionDesc>

                  <div className="space-y-5">
                    <div>
                      <label style={labelStyle}>Access Token</label>
                      <SecretInput
                        value={settings.whatsappAccessToken}
                        onChange={(v) => updateSettings({ whatsappAccessToken: v })}
                        placeholder="EAAx..."
                      />
                      <p className="text-xs mt-1.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        Permanent token from your Meta App. Found in WhatsApp → API Setup.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Phone Number ID</label>
                        <input
                          type="text"
                          value={settings.whatsappPhoneNumberId}
                          onChange={(e) => updateSettings({ whatsappPhoneNumberId: e.target.value })}
                          placeholder="123456789012345"
                          style={{ ...fieldStyle, fontFamily: 'JetBrains Mono, monospace' }}
                        />
                        <p className="text-xs mt-1" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                          From WhatsApp → API Setup in Meta Business Suite.
                        </p>
                      </div>
                      <div>
                        <label style={labelStyle}>Verify Token</label>
                        <input
                          type="text"
                          value={settings.whatsappVerifyToken}
                          onChange={(e) => updateSettings({ whatsappVerifyToken: e.target.value })}
                          placeholder="my_custom_verify_token"
                          style={fieldStyle}
                        />
                        <p className="text-xs mt-1" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                          A secret string you define for webhook verification.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Webhook URL</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                        <span className="text-xs font-mono flex-1 truncate" style={{ color: '#6366F1', fontFamily: 'JetBrains Mono, monospace' }}>
                          {settings.backendApiUrl || window?.location?.origin || 'https://your-domain.com'}/api/whatsapp/webhook
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        Register this URL in your Meta App as the webhook callback URL.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Connection Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusIndicator connected={!!settings.whatsappAccessToken} label={settings.whatsappAccessToken ? 'Access token set' : 'No access token'} />
                        <StatusIndicator connected={!!settings.whatsappPhoneNumberId} label={settings.whatsappPhoneNumberId ? 'Phone ID set' : 'No phone ID'} />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div className="flex gap-2">
                        <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#F59E0B', fontFamily: 'DM Sans, sans-serif' }}>
                            Set server-side environment variables
                          </p>
                          <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                            For production, set <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818CF8' }}>WHATSAPP_ACCESS_TOKEN</code>, <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818CF8' }}>WHATSAPP_PHONE_NUMBER_ID</code>, and <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818CF8' }}>WHATSAPP_VERIFY_TOKEN</code> as server-side environment variables (not NEXT_PUBLIC_) so they are never exposed to the browser.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Integrations ── */}
              {activeTab === 'integrations' && (
                <div>
                  <SectionTitle>Backend & Integrations</SectionTitle>
                  <SectionDesc>
                    Configure backend API connection and data source settings.
                  </SectionDesc>

                  <div className="space-y-5">
                    <Toggle
                      value={settings.useMockData}
                      onChange={(v) => updateSettings({ useMockData: v })}
                      label="Use mock data (disable to connect to real backend)"
                    />

                    <Divider />

                    <div>
                      <label style={labelStyle}>Backend API URL</label>
                      <input
                        type="url"
                        value={settings.backendApiUrl}
                        onChange={(e) => updateSettings({ backendApiUrl: e.target.value })}
                        placeholder="https://api.yourcompany.com  (leave empty to use built-in Next.js routes)"
                        style={fieldStyle}
                      />
                      <p className="text-xs mt-1.5" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                        Leave empty to use the built-in Next.js API routes at <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366F1' }}>/api/*</code>.
                        Set this to an external URL only if running a separate backend service.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg space-y-3" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Environment Variables Summary
                      </p>
                      {[
                        { key: 'NEXT_PUBLIC_USE_MOCK', value: settings.useMockData ? 'true' : 'false', desc: 'Toggle mock / real API' },
                        { key: 'NEXT_PUBLIC_API_URL', value: settings.backendApiUrl || '(empty = internal routes)', desc: 'External backend URL' },
                        { key: 'ANTHROPIC_API_KEY', value: settings.anthropicApiKey ? '••••••' : '(not set)', desc: 'AI features' },
                        { key: 'ANTHROPIC_MODEL', value: settings.aiModel, desc: 'AI model selection' },
                        { key: 'WHATSAPP_ACCESS_TOKEN', value: settings.whatsappAccessToken ? '••••••' : '(not set)', desc: 'WhatsApp API' },
                        { key: 'WHATSAPP_PHONE_NUMBER_ID', value: settings.whatsappPhoneNumberId || '(not set)', desc: 'WhatsApp phone' },
                        { key: 'WHATSAPP_VERIFY_TOKEN', value: settings.whatsappVerifyToken ? '••••••' : '(not set)', desc: 'Webhook verification' },
                      ].map(({ key, value, desc }) => (
                        <div key={key} className="flex items-start gap-3">
                          <code className="text-xs flex-shrink-0 w-52 truncate" style={{ color: '#818CF8', fontFamily: 'JetBrains Mono, monospace' }}>
                            {key}
                          </code>
                          <code className="text-xs flex-1 truncate" style={{ color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>
                            {value}
                          </code>
                          <span className="text-xs flex-shrink-0" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                            {desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notifications ── */}
              {activeTab === 'notifications' && (
                <div>
                  <SectionTitle>Notification Preferences</SectionTitle>
                  <SectionDesc>
                    Choose which events trigger in-app notifications in TalentLens.
                  </SectionDesc>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl space-y-4" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        CV Processing
                      </p>
                      <Toggle
                        value={settings.notifyUploadComplete}
                        onChange={(v) => updateSettings({ notifyUploadComplete: v })}
                        label="Upload complete — notify when all CVs in a batch are uploaded"
                      />
                      <Toggle
                        value={settings.notifyScoringComplete}
                        onChange={(v) => updateSettings({ notifyScoringComplete: v })}
                        label="Scoring complete — notify when all candidates have been scored"
                      />
                    </div>

                    <div className="p-4 rounded-xl space-y-4" style={{ background: '#0A0A0F', border: '1px solid #1E1E2E' }}>
                      <p className="text-xs font-medium" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Candidate Communication
                      </p>
                      <Toggle
                        value={settings.notifyWhatsAppReply}
                        onChange={(v) => updateSettings({ notifyWhatsAppReply: v })}
                        label="WhatsApp reply — notify when a candidate responds via WhatsApp"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save / Reset footer */}
              <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: '1px solid #1E1E2E' }}>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                  style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                  <RotateCcw size={13} />
                  Reset to defaults
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
