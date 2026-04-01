'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface FileDropZoneProps {
  onFile: (text: string) => void
}

export function FileDropZone({ onFile }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      onFile(text)
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors select-none ${
        dragging
          ? 'border-[var(--bubble-user-bg)] bg-[var(--feedback-bg)]'
          : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt"
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
      {fileName ? (
        <p className="text-sm font-medium text-[var(--foreground)]">{fileName}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Drop your requirements file here
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            .md or .txt — or click to browse
          </p>
        </>
      )}
    </div>
  )
}
