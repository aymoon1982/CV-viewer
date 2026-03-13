'use client'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  fileName?: string
}

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{background:'#0A0A0F', border:'1px solid #1E1E2E'}}>
        <div className="flex items-center gap-2">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber <= 1}
            className="p-1.5 rounded transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{color:'#94A3B8'}}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs" style={{color:'#94A3B8', fontFamily:'DM Sans, sans-serif'}}>
            {pageNumber} / {numPages}
          </span>
          <button onClick={() => setPageNumber(p => Math.min(numPages, p+1))} disabled={pageNumber >= numPages}
            className="p-1.5 rounded transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{color:'#94A3B8'}}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="p-1.5 rounded transition-colors hover:bg-white/5"
            style={{color:'#94A3B8'}}>
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center" style={{color:'#94A3B8'}}>{Math.round(scale*100)}%</span>
          <button onClick={() => setScale(s => Math.min(2, s + 0.25))}
            className="p-1.5 rounded transition-colors hover:bg-white/5"
            style={{color:'#94A3B8'}}>
            <ZoomIn size={14} />
          </button>
          {fileName && (
            <a href={url} download={fileName}
              className="ml-2 p-1.5 rounded transition-colors hover:bg-white/5"
              style={{color:'#6366F1'}}>
              <Download size={14} />
            </a>
          )}
        </div>
      </div>
      {/* PDF Document */}
      <div className="overflow-auto rounded-lg" style={{maxHeight: '500px', background:'#0A0A0F', border:'1px solid #1E1E2E'}}>
        <Document
          file={url}
          onLoadSuccess={({numPages}) => setNumPages(numPages)}
          onLoadError={() => {}}
          className="flex justify-center p-4"
          loading={<div className="h-64 flex items-center justify-center text-xs" style={{color:'#64748B'}}>Loading...</div>}
          error={<div className="h-64 flex items-center justify-center text-xs" style={{color:'#64748B'}}>Unable to load CV preview</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  )
}
