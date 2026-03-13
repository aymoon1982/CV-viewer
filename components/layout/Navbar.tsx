'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
  Briefcase,
  LayoutDashboard,
  Plus,
} from 'lucide-react'
import { useSettingsStore } from '@/store'
import { useNotificationStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()
  const { notifications, markRead, markAllRead } = useNotificationStore()
  const { settings } = useSettingsStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const userInitials = settings.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 lg:px-6"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1E1E2E',
        }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7 L7 2 L12 7 L7 12 Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="7" cy="7" r="2" fill="white" />
            </svg>
          </div>
          <span className="font-display font-700 text-base text-text-primary tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            TalentLens
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-text-primary bg-accent-muted'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  ...(isActive ? {
                    color: '#F1F5F9',
                    background: 'rgba(99,102,241,0.15)',
                    borderBottom: '2px solid #6366F1',
                    borderRadius: '4px 4px 0 0',
                  } : {}),
                }}>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* New Job button */}
          <Link
            href="/jobs/new"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: '#6366F1',
              color: 'white',
              fontFamily: 'DM Sans, sans-serif',
            }}>
            <Plus size={14} />
            New Job
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false) }}
              className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#94A3B8' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ background: '#6366F1', color: 'white', fontSize: '9px' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: '#16161F', border: '1px solid #1E1E2E', zIndex: 100 }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid #1E1E2E' }}>
                    <span className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs" style={{ color: '#6366F1' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.slice(0, 5).map((n) => (
                      <Link
                        key={n.id}
                        href={n.href ?? '#'}
                        onClick={() => { markRead(n.id); setNotifOpen(false) }}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                        style={{ borderBottom: '1px solid #1E1E2E' }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: n.read ? 'transparent' : '#6366F1' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                            {n.title}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>
                            {n.message}
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => { setUserOpen(!userOpen); setNotifOpen(false) }}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-white/5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                {userInitials}
              </div>
              <ChevronDown size={14} style={{ color: '#64748B' }} />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: '#16161F', border: '1px solid #1E1E2E', zIndex: 100 }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E1E2E' }}>
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                      {settings.userName}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{settings.userEmail}</p>
                  </div>
                  {[
                    { icon: User, label: 'Profile', href: '/settings' },
                    { icon: Settings, label: 'Settings', href: '/settings' },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}
                      onClick={() => setUserOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>
                      <Icon size={14} />
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid #1E1E2E' }}>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                      style={{ color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#94A3B8' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: '#0A0A0F', top: '56px' }}>
            <nav className="p-4 flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    )}
                    style={{
                      color: isActive ? '#F1F5F9' : '#94A3B8',
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                    <Icon size={20} />
                    {label}
                  </Link>
                )
              })}
              <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '8px', paddingTop: '8px' }}>
                <Link
                  href="/jobs/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium"
                  style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                  <Plus size={20} />
                  New Job Profile
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for dropdowns */}
      {(notifOpen || userOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserOpen(false) }} />
      )}
    </>
  )
}
