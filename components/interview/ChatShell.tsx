'use client'

import type { ChatMessage } from '@/lib/useStreamingChat'
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
  onInputChange: (value: string) => void
  onSubmit: () => void
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
  onInputChange,
  onSubmit,
}: ChatShellProps) {
  // Extract role name from first line of requirements
  const roleName = requirements.split('\n')[0].replace(/^#\s*/, '').trim() || 'Technical Interview'

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
          />
        </div>
      )}
    </div>
  )
}
