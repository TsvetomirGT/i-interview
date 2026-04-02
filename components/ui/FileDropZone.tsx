'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface FileDropZoneProps {
  onFile: (text: string) => void
}

const TEXT_EXTENSIONS = new Set(['md', 'txt'])
const BINARY_EXTENSIONS = new Set(['pdf', 'doc', 'docx'])

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function FileDropZone({ onFile }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    const ext = getExtension(file.name)

    if (TEXT_EXTENSIONS.has(ext)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onFile(e.target?.result as string)
        setFileName(file.name)
      }
      reader.readAsText(file)
      return
    }

    if (BINARY_EXTENSIONS.has(ext)) {
      setLoading(true)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/parse-file', { method: 'POST', body: form })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Upload failed, please try again')
          return
        }
        onFile(json.text as string)
        setFileName(file.name)
      } catch {
        setError('Upload failed, please try again')
      } finally {
        setLoading(false)
      }
      return
    }

    setError('Unsupported file type')
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !loading && inputRef.current?.click()}
      onKeyDown={(e) => !loading && e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!loading) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors select-none ${
        loading
          ? 'border-[var(--border)] opacity-60 cursor-not-allowed'
          : dragging
          ? 'border-[var(--bubble-user-bg)] bg-[var(--feedback-bg)]'
          : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleChange}
      />
      <svg
        className="w-8 h-8 text-[var(--muted-foreground)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      {loading ? (
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Extracting text…</p>
      ) : error ? (
        <p className="text-sm font-medium text-red-500">{error}</p>
      ) : fileName ? (
        <p className="text-sm font-medium text-[var(--foreground)]">{fileName}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Drop your requirements file here
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            .md, .txt, .pdf, .doc, .docx — or click to browse
          </p>
        </>
      )}
    </div>
  )
}
