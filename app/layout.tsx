import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'TalentLens — AI Recruitment Intelligence',
  description: 'Screen smarter. Hire faster. Know why.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="pt-14 min-h-screen" style={{ background: '#0A0A0F' }}>
          {children}
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161F',
              border: '1px solid #1E1E2E',
              color: '#F1F5F9',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
