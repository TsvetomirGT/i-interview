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
