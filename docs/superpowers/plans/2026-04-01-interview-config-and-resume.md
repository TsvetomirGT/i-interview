# Interview Configuration & Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users configure question count (1–50) and optional time limit (up to 120 min), and allow unfinished interviews to be resumed from the history panel.

**Architecture:** Extend the data model in `lib/types.ts` and `lib/history.ts` to carry new config fields and full message history; add a countdown timer hook; update the setup form, interview page, and history sidebar to wire everything together.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4, browser `localStorage`/`sessionStorage`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/types.ts` | Modify | Add `questionCount`, `timeLimitMinutes`, `continueFromId` to `InterviewSession`; move `ChatMessage` here from `useStreamingChat.ts` |
| `lib/history.ts` | Modify | Extend `HistoryEntry` with new fields; replace `saveHistoryEntry` with `upsertHistoryEntry` |
| `lib/session.ts` | Modify | Persist/load `questionCount`, `timeLimitMinutes`, `continueFromId` |
| `lib/useStreamingChat.ts` | Modify | Import `ChatMessage` from `lib/types`; expose `setMessages` in return value |
| `lib/useInterviewTimer.ts` | Create | Countdown hook returning `secondsRemaining` |
| `components/setup/SetupForm.tsx` | Modify | Add question count slider + time limit slider with no-limit toggle |
| `components/interview/ChatShell.tsx` | Modify | Add `secondsRemaining` prop; render timer in header |
| `app/interview/page.tsx` | Modify | Resume flow, dynamic question count, timer integration, message persistence |
| `components/interview/HistorySidebar.tsx` | Modify | Show in-progress cards with Continue button; sort in-progress first |

---

## Task 1: Move `ChatMessage` to `lib/types.ts` and extend `InterviewSession`

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/useStreamingChat.ts`

- [ ] **Step 1: Update `lib/types.ts`**

Replace the entire file contents:

```typescript
export type InterviewMode = 'learn' | 'real'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface InterviewSession {
  requirements: string
  mode: InterviewMode
  questionCount: number          // target questions (1–50)
  timeLimitMinutes: number | null // null = no limit
  continueFromId?: string        // set when resuming an in-progress interview
}

export interface ApiRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  requirements: string
  mode: InterviewMode
  requestSummary?: boolean
}
```

- [ ] **Step 2: Update `lib/useStreamingChat.ts` to import `ChatMessage` from types**

Remove the local `ChatMessage` interface and import it instead:

```typescript
'use client'

import { useState, useCallback, useRef } from 'react'
import type { InterviewMode, ChatMessage } from './types'

export type { ChatMessage }

interface UseStreamingChatOptions {
  api: string
  requirements: string
  mode: InterviewMode
  onFinish?: (message: ChatMessage) => void
}

let msgCounter = 0
function newId() {
  return `msg-${++msgCounter}-${Date.now()}`
}

export function useStreamingChat({ api, requirements, mode, onFinish }: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string, requestSummary = false) => {
      if (!content.trim() || isLoading) return

      const userMsg: ChatMessage = { id: newId(), role: 'user', content }

      // Append user message immediately (except the sentinel start message which we hide)
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setIsLoading(true)

      const assistantId = newId()
      // Add empty assistant message as placeholder for streaming
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      abortRef.current = new AbortController()

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
            requirements,
            mode,
            requestSummary,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          const captured = fullContent
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: captured } : m))
          )
        }

        const finalMsg: ChatMessage = { id: assistantId, role: 'assistant', content: fullContent }
        onFinish?.(finalMsg)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Streaming error:', err)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, api, requirements, mode, onFinish]
  )

  const append = useCallback(
    (msg: { role: 'user' | 'assistant'; content: string }, requestSummary = false) => {
      sendMessage(msg.content, requestSummary)
    },
    [sendMessage]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { messages, setMessages, input, setInput, sendMessage, append, isLoading, stop }
}
```

- [ ] **Step 3: Verify type-check passes**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no errors related to `ChatMessage`.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/useStreamingChat.ts
git commit -m "refactor: move ChatMessage to lib/types, expose setMessages from useStreamingChat"
```

---

## Task 2: Extend `lib/history.ts`

**Files:**
- Modify: `lib/history.ts`

- [ ] **Step 1: Replace `lib/history.ts` with the new implementation**

```typescript
import type { ChatMessage } from './types'

const HISTORY_KEY = 'ii:history'

export interface HistoryEntry {
  id: string
  topic: string
  mode: 'learn' | 'real'
  averageScore: number | null
  completedAt: string           // ISO date string; set on creation, updated on completion
  startedAt: string             // ISO date string of first message
  status: 'completed' | 'in_progress'
  questionCount: number         // target question count
  currentQuestion: number       // questions answered so far
  timeLimitMinutes: number | null
  requirements: string          // stored for session restore on Continue
  messages: ChatMessage[]       // full chat history; cleared to [] on completion
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (!data) return []
    const parsed: unknown = JSON.parse(data)
    if (!Array.isArray(parsed)) return []
    return parsed as HistoryEntry[]
  } catch {
    return []
  }
}

/** Creates or updates a history entry by ID. */
export function upsertHistoryEntry(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return
  try {
    const history = loadHistory()
    const idx = history.findIndex((e) => e.id === entry.id)
    if (idx === -1) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history]))
    } else {
      const updated = [...history]
      updated[idx] = entry
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    }
  } catch {
    // Silently fail if localStorage is unavailable or quota exceeded
  }
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const history = loadHistory()
    const updatedHistory = history.filter((entry) => entry.id !== id)
    if (updatedHistory.length === history.length) return
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
```

- [ ] **Step 2: Update `app/interview/page.tsx` import (temporary fix to unblock type-check)**

The page currently imports `saveHistoryEntry` which no longer exists. Find the import line:

```typescript
import { saveHistoryEntry } from '@/lib/history'
```

Change it to:

```typescript
import { upsertHistoryEntry } from '@/lib/history'
```

Leave the `upsertHistoryEntry` call broken for now (it will be fixed in Task 5). This is just to unblock the build.

- [ ] **Step 3: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: errors only in `app/interview/page.tsx` about the `upsertHistoryEntry` call signature — acceptable at this stage.

- [ ] **Step 4: Commit**

```bash
git add lib/history.ts app/interview/page.tsx
git commit -m "feat: extend HistoryEntry with status, messages, config fields; add upsertHistoryEntry"
```

---

## Task 3: Extend `lib/session.ts`

**Files:**
- Modify: `lib/session.ts`

- [ ] **Step 1: Replace `lib/session.ts`**

```typescript
import type { InterviewSession } from './types'

const REQUIREMENTS_KEY = 'ii:requirements'
const MODE_KEY = 'ii:mode'
const QUESTION_COUNT_KEY = 'ii:questionCount'
const TIME_LIMIT_KEY = 'ii:timeLimitMinutes'
const CONTINUE_FROM_KEY = 'ii:continueFromId'

export function saveSession(session: InterviewSession): void {
  sessionStorage.setItem(REQUIREMENTS_KEY, session.requirements)
  sessionStorage.setItem(MODE_KEY, session.mode)
  sessionStorage.setItem(QUESTION_COUNT_KEY, String(session.questionCount))
  sessionStorage.setItem(TIME_LIMIT_KEY, session.timeLimitMinutes === null ? '' : String(session.timeLimitMinutes))
  if (session.continueFromId) {
    sessionStorage.setItem(CONTINUE_FROM_KEY, session.continueFromId)
  } else {
    sessionStorage.removeItem(CONTINUE_FROM_KEY)
  }
}

export function loadSession(): InterviewSession | null {
  const requirements = sessionStorage.getItem(REQUIREMENTS_KEY)
  const mode = sessionStorage.getItem(MODE_KEY)
  const questionCountRaw = sessionStorage.getItem(QUESTION_COUNT_KEY)
  const timeLimitRaw = sessionStorage.getItem(TIME_LIMIT_KEY)
  const continueFromId = sessionStorage.getItem(CONTINUE_FROM_KEY) ?? undefined

  if (!requirements || !mode) return null

  const questionCount = questionCountRaw ? parseInt(questionCountRaw, 10) : 10
  const timeLimitMinutes = timeLimitRaw ? parseInt(timeLimitRaw, 10) : null

  return {
    requirements,
    mode: mode as InterviewSession['mode'],
    questionCount: isNaN(questionCount) ? 10 : questionCount,
    timeLimitMinutes: isNaN(timeLimitMinutes as number) || timeLimitRaw === '' ? null : timeLimitMinutes,
    continueFromId,
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(REQUIREMENTS_KEY)
  sessionStorage.removeItem(MODE_KEY)
  sessionStorage.removeItem(QUESTION_COUNT_KEY)
  sessionStorage.removeItem(TIME_LIMIT_KEY)
  sessionStorage.removeItem(CONTINUE_FROM_KEY)
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/session.ts
git commit -m "feat: extend session storage with questionCount, timeLimitMinutes, continueFromId"
```

---

## Task 4: Create `lib/useInterviewTimer.ts`

**Files:**
- Create: `lib/useInterviewTimer.ts`

- [ ] **Step 1: Create the hook**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Countdown timer for interview sessions.
 * Returns secondsRemaining (null if no limit) and calls onTimeUp when it reaches 0.
 */
export function useInterviewTimer(
  timeLimitMinutes: number | null,
  onTimeUp: () => void
): { secondsRemaining: number | null } {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    timeLimitMinutes !== null ? timeLimitMinutes * 60 : null
  )
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    if (timeLimitMinutes === null) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 0) return prev
        if (prev === 1) {
          onTimeUpRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimitMinutes])

  return { secondsRemaining }
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/useInterviewTimer.ts
git commit -m "feat: add useInterviewTimer countdown hook"
```

---

## Task 5: Update `app/interview/page.tsx`

**Files:**
- Modify: `app/interview/page.tsx`

This is the most complex task. It wires together resume, timer, dynamic question count, and progress persistence.

- [ ] **Step 1: Replace `app/interview/page.tsx`**

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStreamingChat } from '@/lib/useStreamingChat'
import type { ChatMessage } from '@/lib/types'
import { loadSession } from '@/lib/session'
import type { InterviewSession } from '@/lib/types'
import { ChatShell } from '@/components/interview/ChatShell'
import { hasFeedback, parseFeedback } from '@/components/interview/FeedbackCard'
import { upsertHistoryEntry, loadHistory } from '@/lib/history'
import { useInterviewTimer } from '@/lib/useInterviewTimer'

export default function InterviewPage() {
  const router = useRouter()
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryContent, setSummaryContent] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [timeIsUp, setTimeIsUp] = useState(false)

  const startedRef = useRef(false)
  const summaryRequestedRef = useRef(false)
  const scoresRef = useRef<number[]>([])
  // Stable ID for this interview session (used for upsertHistoryEntry)
  const entryIdRef = useRef<string>(crypto.randomUUID())

  const maxQuestions = session?.questionCount ?? 10

  const handleFinish = useCallback(
    (message: ChatMessage) => {
      if (summaryRequestedRef.current) {
        const scores = scoresRef.current
        const avg = scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        const topic = session?.requirements.split('\n').find((l) => l.trim()) ?? 'Interview'
        const now = new Date().toISOString()
        upsertHistoryEntry({
          id: entryIdRef.current,
          topic: topic.trim().slice(0, 60),
          mode: session!.mode,
          averageScore: avg,
          completedAt: now,
          startedAt: now,
          status: 'completed',
          questionCount: maxQuestions,
          currentQuestion: maxQuestions,
          timeLimitMinutes: session!.timeLimitMinutes,
          requirements: session!.requirements,
          messages: [], // clear messages on completion to save space
        })
        setSummaryContent(message.content)
        return
      }

      if (session?.mode === 'learn' && hasFeedback(message.content)) {
        const { score } = parseFeedback(message.content)
        if (score !== null) scoresRef.current.push(score)
      }

      setQuestionCount((prev) => {
        const next = prev + 1
        if (next >= maxQuestions || timeIsUp) setShowSummary(true)
        return next
      })
    },
    [session, maxQuestions, timeIsUp]
  )

  const { messages, setMessages, input, setInput, append, isLoading } = useStreamingChat({
    api: '/api/interview',
    requirements: session?.requirements ?? '',
    mode: session?.mode ?? 'learn',
    onFinish: handleFinish,
  })

  // Load session and restore resume data after mount.
  // setMessages is called here (not in useState) because useStreamingChat's
  // messages state is already initialized by the time useEffect runs.
  useEffect(() => {
    const s = loadSession()
    setSession(s)

    if (s?.continueFromId) {
      entryIdRef.current = s.continueFromId
      const history = loadHistory()
      const entry = history.find((e) => e.id === s.continueFromId)
      if (entry) {
        setMessages(entry.messages)       // restore full chat history
        setQuestionCount(entry.currentQuestion)
        startedRef.current = true          // skip __START_INTERVIEW__ sentinel
      }
    }

    setMounted(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist progress to localStorage after each message
  useEffect(() => {
    if (!session || messages.length === 0 || showSummary) return
    const topic = session.requirements.split('\n').find((l) => l.trim()) ?? 'Interview'
    const now = new Date().toISOString()
    upsertHistoryEntry({
      id: entryIdRef.current,
      topic: topic.trim().slice(0, 60),
      mode: session.mode,
      averageScore: null,
      completedAt: now,
      startedAt: now,
      status: 'in_progress',
      questionCount: maxQuestions,
      currentQuestion: questionCount,
      timeLimitMinutes: session.timeLimitMinutes,
      requirements: session.requirements,
      messages,
    })
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if no session
  useEffect(() => {
    if (mounted && !session) router.replace('/')
  }, [mounted, session, router])

  // Start interview (skip if resuming)
  useEffect(() => {
    if (!session || startedRef.current) return
    startedRef.current = true
    append({ role: 'user', content: '__START_INTERVIEW__' })
  }, [session, append])

  // Request summary when showSummary becomes true
  useEffect(() => {
    if (!showSummary || summaryRequestedRef.current) return
    summaryRequestedRef.current = true
    append({ role: 'user', content: '__REQUEST_SUMMARY__' }, true)
  }, [showSummary, append])

  // When time is up and no response in flight, trigger summary
  useEffect(() => {
    if (timeIsUp && !isLoading && !showSummary && startedRef.current) {
      setShowSummary(true)
    }
  }, [timeIsUp, isLoading, showSummary])

  const handleTimeUp = useCallback(() => setTimeIsUp(true), [])

  const { secondsRemaining } = useInterviewTimer(
    session?.timeLimitMinutes ?? null,
    handleTimeUp
  )

  function handleSubmit() {
    if (!input.trim() || isLoading || (timeIsUp && !isLoading)) return
    append({ role: 'user', content: input })
    setInput('')
  }

  if (!mounted || !session) return null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--background)]">
      <ChatShell
        messages={messages}
        input={input}
        isLoading={isLoading}
        mode={session.mode}
        requirements={session.requirements}
        questionCount={Math.min(questionCount, maxQuestions)}
        maxQuestions={maxQuestions}
        showSummary={showSummary && summaryContent !== ''}
        summaryContent={summaryContent}
        secondsRemaining={secondsRemaining}
        timeIsUp={timeIsUp}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: errors about `secondsRemaining` and `timeIsUp` props not existing on `ChatShell` — those get fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add app/interview/page.tsx
git commit -m "feat: wire resume flow, timer, dynamic question count, and progress persistence in InterviewPage"
```

---

## Task 6: Update `components/interview/ChatShell.tsx`

**Files:**
- Modify: `components/interview/ChatShell.tsx`

- [ ] **Step 1: Replace `components/interview/ChatShell.tsx`**

```typescript
'use client'

import type { ChatMessage } from '@/lib/types'
import type { InterviewMode } from '@/lib/types'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { SummaryPanel } from './SummaryPanel'

interface ChatShellProps {
  messages: ChatMessage[]
  input: string
  isLoading: boolean
  mode: InterviewMode
  requirements: string
  questionCount: number
  maxQuestions: number
  showSummary: boolean
  summaryContent: string
  secondsRemaining: number | null
  timeIsUp: boolean
  onInputChange: (value: string) => void
  onSubmit: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ChatShell({
  messages,
  input,
  isLoading,
  mode,
  requirements,
  questionCount,
  maxQuestions,
  showSummary,
  summaryContent,
  secondsRemaining,
  timeIsUp,
  onInputChange,
  onSubmit,
}: ChatShellProps) {
  const roleName = requirements.split('\n')[0].replace(/^#\s*/, '').trim() || 'Technical Interview'

  const timerColor =
    secondsRemaining === null
      ? ''
      : secondsRemaining < 60
      ? 'text-red-500'
      : secondsRemaining < 120
      ? 'text-amber-500'
      : 'text-[var(--muted-foreground)]'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3 flex items-center justify-between bg-[var(--background)]">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-semibold text-[var(--foreground)] truncate max-w-xs">
            {roleName}
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {questionCount}/{maxQuestions} questions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {secondsRemaining !== null && (
            <span className={`text-sm font-mono font-medium tabular-nums ${timerColor}`}>
              {formatTime(secondsRemaining)}
            </span>
          )}

          {/* Mode badge */}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              mode === 'learn'
                ? 'bg-[var(--feedback-bg)] text-[var(--bubble-user-bg)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            {mode === 'learn' ? 'Learn' : 'Real'} Mode
          </span>
        </div>
      </div>

      {/* Time's up banner */}
      {timeIsUp && !showSummary && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
          Time&apos;s up — finishing up your interview…
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} mode={mode} />

      {/* Summary or input */}
      {showSummary ? (
        <SummaryPanel content={summaryContent} />
      ) : (
        <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 bg-[var(--background)]">
          <ChatInput
            value={input}
            onChange={onInputChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            disabled={timeIsUp}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/interview/ChatShell.tsx
git commit -m "feat: add timer display and time's-up banner to ChatShell"
```

---

## Task 7: Update `components/setup/SetupForm.tsx`

**Files:**
- Modify: `components/setup/SetupForm.tsx`

- [ ] **Step 1: Replace `components/setup/SetupForm.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDropZone } from '@/components/ui/FileDropZone'
import { ModeSelector } from '@/components/setup/ModeSelector'
import { Button } from '@/components/ui/Button'
import { saveSession } from '@/lib/session'
import type { InterviewMode } from '@/lib/types'

export function SetupForm() {
  const router = useRouter()
  const [markdown, setMarkdown] = useState('')
  const [mode, setMode] = useState<InterviewMode>('learn')
  const [questionCount, setQuestionCount] = useState(10)
  const [noTimeLimit, setNoTimeLimit] = useState(true)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (markdown.trim().length < 50) {
      setError('Please provide a more detailed requirements document (at least 50 characters).')
      return
    }
    setError(null)
    saveSession({
      requirements: markdown,
      mode,
      questionCount,
      timeLimitMinutes: noTimeLimit ? null : timeLimitMinutes,
    })
    router.push('/interview')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* File upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Job Requirements
        </label>
        <FileDropZone onFile={setMarkdown} />
        <p className="text-xs text-[var(--muted-foreground)]">
          or paste the requirements below
        </p>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="# Senior React Developer&#10;&#10;## Requirements&#10;- 5+ years of React experience&#10;..."
          rows={8}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--bubble-user-bg)] transition-shadow"
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Interview Mode
        </label>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* Question count */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Questions: <span className="text-[var(--bubble-user-bg)] font-semibold">{questionCount}</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full accent-[var(--bubble-user-bg)]"
        />
        <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>1</span>
          <span>50</span>
        </div>
      </div>

      {/* Time limit */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {noTimeLimit
              ? 'Time Limit: No limit'
              : `Time Limit: ${timeLimitMinutes} min`}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
            <input
              type="checkbox"
              checked={noTimeLimit}
              onChange={(e) => setNoTimeLimit(e.target.checked)}
              className="accent-[var(--bubble-user-bg)]"
            />
            No time limit
          </label>
        </div>
        {!noTimeLimit && (
          <>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              className="w-full accent-[var(--bubble-user-bg)]"
            />
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </>
        )}
      </div>

      <Button size="lg" onClick={handleSubmit} className="w-full">
        Start Interview
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Question count slider appears (1–50, default 10)
- "No time limit" checkbox is checked by default; when unchecked, time slider appears (5–120 min, step 5)
- Submitting the form navigates to `/interview`

- [ ] **Step 4: Commit**

```bash
git add components/setup/SetupForm.tsx
git commit -m "feat: add question count and time limit sliders to SetupForm"
```

---

## Task 8: Update `components/interview/HistorySidebar.tsx`

**Files:**
- Modify: `components/interview/HistorySidebar.tsx`

- [ ] **Step 1: Replace `components/interview/HistorySidebar.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadHistory, deleteHistoryEntry, type HistoryEntry } from '@/lib/history'
import { saveSession } from '@/lib/session'

// ── HistoryCard ───────────────────────────────────────────────────────────────

interface HistoryCardProps {
  entry: HistoryEntry
  onDelete: (id: string) => void
  onContinue: (entry: HistoryEntry) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

function HistoryCard({ entry, onDelete, onContinue }: HistoryCardProps) {
  const { id, topic, mode, averageScore, completedAt, status, currentQuestion, questionCount, timeLimitMinutes } = entry

  const scoreDisplay = averageScore === null ? null : averageScore.toFixed(1)

  const scoreColor =
    averageScore === null
      ? 'text-[var(--muted-foreground)]'
      : averageScore >= 8
      ? 'text-emerald-600'
      : averageScore >= 5
      ? 'text-amber-600'
      : 'text-red-600'

  const formattedDate = dateFormatter.format(new Date(completedAt))

  function handleDelete() {
    deleteHistoryEntry(id)
    onDelete(id)
  }

  return (
    <div className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-opacity hover:opacity-80">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        aria-label="Delete entry"
        className="absolute top-2 right-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors text-sm leading-none p-0.5"
      >
        ×
      </button>

      {/* Topic */}
      <p className="text-sm font-medium truncate pr-5" title={topic}>
        {topic}
      </p>

      {/* Meta row */}
      <div className="mt-1.5 flex items-center gap-2 text-xs flex-wrap">
        {/* Mode badge */}
        <span className="rounded-full bg-[var(--muted-foreground)]/10 px-2 py-0.5 text-[var(--muted-foreground)] capitalize">
          {mode === 'learn' ? 'Learn' : 'Real'}
        </span>

        {status === 'in_progress' ? (
          <>
            {/* Progress */}
            <span className="text-[var(--muted-foreground)]">
              {currentQuestion}/{questionCount} questions
            </span>
            {/* Time config */}
            <span className="text-[var(--muted-foreground)]">
              {timeLimitMinutes === null ? 'No limit' : `${timeLimitMinutes} min`}
            </span>
          </>
        ) : (
          /* Score for completed */
          <span className={`font-medium ${scoreColor}`}>
            {scoreDisplay !== null ? `${scoreDisplay} / 10` : 'N/A'}
          </span>
        )}

        {/* Date — pushed to the right */}
        <span className="ml-auto text-[var(--muted-foreground)]">{formattedDate}</span>
      </div>

      {/* Continue button for in-progress */}
      {status === 'in_progress' && (
        <button
          onClick={() => onContinue(entry)}
          className="mt-2 w-full rounded-lg bg-[var(--bubble-user-bg)] text-[var(--bubble-user-fg)] text-xs font-medium py-1.5 hover:opacity-90 active:scale-95 transition-all"
        >
          Continue
        </button>
      )}
    </div>
  )
}

// ── HistorySidebar ────────────────────────────────────────────────────────────

export function HistorySidebar() {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    const all = loadHistory()
    // In-progress first, then completed; each group sorted newest first
    return [
      ...all.filter((e) => e.status === 'in_progress').sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
      ...all.filter((e) => e.status === 'completed').sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    ]
  })

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function handleContinue(entry: HistoryEntry) {
    saveSession({
      requirements: entry.requirements,
      mode: entry.mode,
      questionCount: entry.questionCount,
      timeLimitMinutes: entry.timeLimitMinutes,
      continueFromId: entry.id,
    })
    router.push('/interview')
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <h2 className="text-base font-semibold">History</h2>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No interviews yet</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
          {entries.map((entry) => (
            <li key={entry.id}>
              <HistoryCard entry={entry} onDelete={handleDelete} onContinue={handleContinue} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

```bash
cd /Users/tsvetomirgt/Developer/i-interview && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/interview/HistorySidebar.tsx
git commit -m "feat: show in-progress interviews in history sidebar with Continue button"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify question count**

1. Open `http://localhost:3000`
2. Paste any job description (≥50 chars)
3. Set question count slider to **3**
4. Leave "No time limit" checked
5. Start Interview
6. Answer 3 questions — confirm the interview ends and summary appears after exactly 3 AI responses

- [ ] **Step 3: Verify timer**

1. Return to home, set question count to 20, uncheck "No time limit", set slider to **1 min** (minimum is 5 but you can temporarily change `min={1}` in SetupForm for testing)
2. Start interview — confirm `01:00` countdown appears in the header
3. Let it reach 0 — confirm amber/red color changes at 2 min / 1 min thresholds
4. Confirm "Time's up" banner appears and summary is triggered

- [ ] **Step 4: Verify in-progress persistence**

1. Start an interview (5 questions, no limit)
2. Answer 2 questions
3. Open a new tab, navigate to `http://localhost:3000`
4. Confirm the history sidebar shows the in-progress card with `2/5 questions`

- [ ] **Step 5: Verify Continue**

1. Click "Continue" on the in-progress card
2. Confirm the interview page loads with previous messages restored
3. Confirm question count starts from where it left off
4. Answer the remaining 3 questions — confirm summary appears after the final question

- [ ] **Step 6: Verify completion clears in-progress status**

1. After completing the resumed interview, return to home
2. Confirm the history card now shows as completed with a score (Learn mode) or N/A (Real mode)
3. Confirm no "Continue" button appears

- [ ] **Step 7: Final build check**

```bash
npm run build
```

Expected: successful build with no type errors.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: interview configuration (question count, time limit) and resume from history"
```
