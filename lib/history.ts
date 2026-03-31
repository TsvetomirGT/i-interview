const HISTORY_KEY = 'ii:history'

export interface HistoryEntry {
  id: string
  topic: string
  mode: 'learn' | 'real'
  averageScore: number | null
  completedAt: string  // ISO date string
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (!data) {
      return []
    }
    const parsed: unknown = JSON.parse(data)
    if (!Array.isArray(parsed)) return []
    return parsed as HistoryEntry[]
  } catch {
    return []
  }
}

export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'completedAt'>): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const history = loadHistory()
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    }
    const updatedHistory = [newEntry, ...history]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch {
    // Silently fail if localStorage is unavailable or quota exceeded
  }
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const history = loadHistory()
    const updatedHistory = history.filter((entry) => entry.id !== id)
    if (updatedHistory.length === history.length) return
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
