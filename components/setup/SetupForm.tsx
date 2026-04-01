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
