# PDF, DOC, DOCX File Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to upload `.pdf`, `.doc`, and `.docx` files in addition to the existing `.md` and `.txt` formats, with server-side text extraction optimised for LLM readability.

**Architecture:** A new `POST /api/parse-file` route accepts a multipart file upload, runs `pdf-parse` (PDF) or `mammoth` (DOC/DOCX) on the server, and returns `{ text: string }`. `FileDropZone.tsx` is updated to branch on file extension: `.md`/`.txt` continue using the existing `FileReader.readAsText()` path; binary formats are POSTed to the new route. All extracted text flows into `SetupForm` as a plain string — nothing downstream changes.

**Tech Stack:** `pdf-parse`, `mammoth`, Next.js App Router API route (`app/api/parse-file/route.ts`), `FormData` browser API

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/api/parse-file/route.ts` | Accept multipart upload, extract plain text from PDF/DOC/DOCX, enforce 10MB limit |
| Modify | `components/ui/FileDropZone.tsx` | Expand accepted types, branch on extension, add loading + error states |

---

## Task 1: Install server-side parsing libraries

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install pdf-parse mammoth
```

Expected output: packages added, no peer dep warnings that block the build.

- [ ] **Step 2: Install TypeScript type declarations**

```bash
npm install --save-dev @types/mammoth
```

(`pdf-parse` ships its own types; no separate `@types/pdf-parse` needed.)

- [ ] **Step 3: Verify the dev server still starts**

```bash
npm run dev
```

Expected: server starts without errors on `http://localhost:3000`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install pdf-parse and mammoth for server-side document parsing"
```

---

## Task 2: Create `POST /api/parse-file` route

**Files:**
- Create: `app/api/parse-file/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/parse-file/route.ts` with the following content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large (max 10MB)' },
      { status: 413 }
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    let text: string

    if (ext === 'pdf') {
      const result = await pdfParse(buffer)
      text = result.text
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json(
      { error: 'Could not extract text from this file' },
      { status: 422 }
    )
  }
}
```

- [ ] **Step 2: Smoke-test the route with curl**

Start the dev server (`npm run dev`) in one terminal, then in another:

```bash
# Test with a real PDF (swap in any .pdf you have)
curl -s -X POST http://localhost:3000/api/parse-file \
  -F "file=@/path/to/sample.pdf" | head -c 500
```

Expected: JSON with a `text` field containing readable content, e.g. `{"text":"Introduction\nThis document..."}`

```bash
# Test the size limit — create a >10MB dummy file and upload it
dd if=/dev/zero of=/tmp/big.pdf bs=1m count=11
curl -s -X POST http://localhost:3000/api/parse-file \
  -F "file=@/tmp/big.pdf"
```

Expected: `{"error":"File is too large (max 10MB)"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/parse-file/route.ts
git commit -m "feat: add /api/parse-file route for PDF and DOCX text extraction"
```

---

## Task 3: Update `FileDropZone.tsx` to support binary formats

**Files:**
- Modify: `components/ui/FileDropZone.tsx`

- [ ] **Step 1: Replace the file with the updated implementation**

Replace the entire contents of `components/ui/FileDropZone.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
npm run dev
```

Expected: no TypeScript or compile errors in the terminal.

- [ ] **Step 3: Manual end-to-end test — PDF**

1. Open `http://localhost:3000`
2. Upload a `.pdf` requirements file via the drop zone
3. Verify the file name appears and the requirements textarea is populated with readable text
4. Click Start Interview — confirm the interview proceeds normally

- [ ] **Step 4: Manual end-to-end test — DOCX**

1. Upload a `.docx` file
2. Verify readable text appears in the requirements textarea
3. Start an interview — confirm it proceeds normally

- [ ] **Step 5: Manual end-to-end test — existing formats still work**

1. Upload a `.md` file — verify text appears (no regression)
2. Upload a `.txt` file — verify text appears (no regression)

- [ ] **Step 6: Manual error test — oversized file**

1. Find or create a file larger than 10MB
2. Drop it on the drop zone
3. Verify the error message "File is too large (max 10MB)" appears in the drop zone

- [ ] **Step 7: Commit**

```bash
git add components/ui/FileDropZone.tsx
git commit -m "feat: support PDF, DOC, DOCX uploads in FileDropZone via /api/parse-file"
```

---

## Verification Checklist

- [ ] `.pdf` upload → readable text in requirements textarea → interview starts
- [ ] `.docx` upload → readable text in requirements textarea → interview starts
- [ ] `.doc` upload → text extracted (best-effort) → interview starts
- [ ] File > 10MB → "File is too large (max 10MB)" shown in drop zone
- [ ] Corrupted/unreadable file → "Could not extract text from this file" shown
- [ ] Network failure during upload → "Upload failed, please try again" shown
- [ ] `.md` upload → unchanged behavior (no regression)
- [ ] `.txt` upload → unchanged behavior (no regression)
- [ ] Drop zone is disabled (no click/drag) while parsing is in progress
