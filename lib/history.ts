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
