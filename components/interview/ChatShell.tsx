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
