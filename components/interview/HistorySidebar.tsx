'use client'

import { useState } from 'react'
import { loadHistory, deleteHistoryEntry, type HistoryEntry } from '@/lib/history'

// ── HistoryCard ───────────────────────────────────────────────────────────────

interface HistoryCardProps {
  entry: HistoryEntry
  onDelete: (id: string) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

function HistoryCard({ entry, onDelete }: HistoryCardProps) {
  const { id, topic, mode, averageScore, completedAt } = entry

  const scoreDisplay =
    averageScore === null ? null : averageScore.toFixed(1)

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
    <div className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 hover:opacity-80 transition-opacity">
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
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {/* Mode badge */}
        <span className="rounded-full bg-[var(--muted-foreground)]/10 px-2 py-0.5 text-[var(--muted-foreground)] capitalize">
          {mode === 'learn' ? 'Learn' : 'Real'}
        </span>

        {/* Score */}
        <span className={`font-medium ${scoreColor}`}>
          {scoreDisplay !== null ? `${scoreDisplay} / 10` : 'N/A'}
        </span>

        {/* Date — pushed to the right */}
        <span className="ml-auto text-[var(--muted-foreground)]">
          {formattedDate}
        </span>
      </div>
    </div>
  )
}

// ── HistorySidebar ────────────────────────────────────────────────────────────

export function HistorySidebar() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory())

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
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
              <HistoryCard entry={entry} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
