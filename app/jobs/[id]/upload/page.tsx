'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Upload,
  FileText,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import type { UploadedFile, UploadStatus } from '@/types'

export default function CVUploadPage() {
  const params = useParams<{ id: string }>()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (fileObj: File, id: string) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'extracting', progress: 30 } : f))
    try {
      await apiClient.jobs.upload(params.id, [fileObj])
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'scoring', progress: 70 } : f))
      // Brief pause to show scoring state before marking done
      await new Promise((r) => setTimeout(r, 800))
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'done', progress: 100 } : f))
    } catch {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'failed', progress: 100, error: 'Upload failed — please retry' } : f))
    }
  }

  const addFiles = (newFiles: File[]) => {
    const remaining = 50 - files.length
    const toAdd = newFiles.slice(0, remaining)
    const mapped: UploadedFile[] = toAdd.map((f) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      type: f.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
      status: 'queued' as UploadStatus,
      progress: 0,
      _file: f,
    }))
    setFiles((prev) => [...prev, ...mapped])
    mapped.forEach((m) => uploadFile((m as UploadedFile & { _file: File })._file, m.id))
    if (newFiles.length > 50) {
      alert('Maximum 50 files at once. Only the first 50 were added.')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === 'application/pdf' ||
        f.name.toLowerCase().endsWith('.docx')
    )
    addFiles(dropped)
  }, [files.length])

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

const done = files.filter((f) => f.status === 'done').length
  const failed = files.filter((f) => f.status === 'failed').length
  const processing = files.filter((f) => ['queued', 'extracting', 'scoring'].includes(f.status)).length
  const hasResults = done > 0

  const statusConfig: Record<UploadStatus, { label: string; color: string; icon: React.ReactNode }> = {
    queued: { label: 'Queued', color: '#64748B', icon: <File size={13} /> },
    extracting: { label: 'Extracting', color: '#F59E0B', icon: <Loader2 size={13} className="animate-spin" /> },
    scoring: { label: 'Scoring', color: '#6366F1', icon: <Loader2 size={13} className="animate-spin" /> },
    done: { label: 'Done', color: '#22C55E', icon: <CheckCircle size={13} /> },
    failed: { label: 'Failed', color: '#EF4444', icon: <AlertCircle size={13} /> },
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#F1F5F9', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          Upload CVs
        </h1>
        <p className="text-sm" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
          Bulk upload candidate CVs for AI scoring and ranking.
        </p>
      </div>

      {/* Drop zone */}
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: dragging ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
        className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-4 mb-6 transition-all"
        style={{
          height: 240,
          border: `2px dashed ${dragging ? '#6366F1' : '#1E1E2E'}`,
          background: dragging ? 'rgba(99,102,241,0.05)' : '#111118',
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: dragging ? 'rgba(99,102,241,0.2)' : '#1E1E2E' }}>
          <Upload size={26} style={{ color: dragging ? '#6366F1' : '#64748B' }} />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold mb-1"
            style={{ color: dragging ? '#6366F1' : '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
            Drop CVs here or click to browse
          </p>
          <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
            PDF, DOCX accepted — up to 50 files at once
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={handleBrowse}
          className="hidden"
        />
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #1E1E2E' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E1E2E', background: '#111118' }}>
              <p className="text-xs font-semibold" style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {files.length} Files
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: '#1E1E2E' }}>
              {files.map((file) => {
                const config = statusConfig[file.status]
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="px-4 py-3"
                    style={{ background: '#111118' }}>
                    <div className="flex items-center gap-3">
                      {/* File icon */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: file.type === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        <FileText size={16} style={{ color: file.type === 'pdf' ? '#EF4444' : '#6366F1' }} />
                      </div>

                      {/* Name and size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"
                          style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                          {file.name}
                        </p>
                        <p className="text-xs" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                          {formatFileSize(file.size)}
                          {file.error && (
                            <span className="ml-2" style={{ color: '#EF4444' }}>{file.error}</span>
                          )}
                        </p>
                        {/* Progress bar */}
                        {['extracting', 'scoring'].includes(file.status) && (
                          <div className="mt-1.5 h-0.5 rounded-full" style={{ background: '#1E1E2E' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: '#6366F1' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1.5 flex-shrink-0"
                        style={{ color: config.color, fontFamily: 'DM Sans, sans-serif', fontSize: '12px' }}>
                        {config.icon}
                        <span>{config.label}</span>
                      </div>

                      {/* Remove (queued only) */}
                      {file.status === 'queued' && (
                        <button onClick={() => removeFile(file.id)}
                          className="p-1 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
                          style={{ color: '#64748B' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Summary bar */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: '#0A0A0F', borderTop: '1px solid #1E1E2E' }}>
              <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ color: '#64748B' }}>Total: <strong style={{ color: '#F1F5F9' }}>{files.length}</strong></span>
                <span style={{ color: '#22C55E' }}>Done: <strong>{done}</strong></span>
                {failed > 0 && <span style={{ color: '#EF4444' }}>Failed: <strong>{failed}</strong></span>}
                {processing > 0 && <span style={{ color: '#6366F1' }}>Processing: <strong>{processing}</strong></span>}
              </div>
              {hasResults && (
                <Link href={`/jobs/${params.id}/results`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: '#6366F1', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                  <Eye size={12} />
                  View Results
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
