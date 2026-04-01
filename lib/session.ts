import type { InterviewSession } from './types'

const REQUIREMENTS_KEY = 'ii:requirements'
const MODE_KEY = 'ii:mode'

export function saveSession(session: InterviewSession): void {
  sessionStorage.setItem(REQUIREMENTS_KEY, session.requirements)
  sessionStorage.setItem(MODE_KEY, session.mode)
}

export function loadSession(): InterviewSession | null {
  const requirements = sessionStorage.getItem(REQUIREMENTS_KEY)
  const mode = sessionStorage.getItem(MODE_KEY)
  if (!requirements || !mode) return null
  return { requirements, mode: mode as InterviewSession['mode'] }
}

export function clearSession(): void {
  sessionStorage.removeItem(REQUIREMENTS_KEY)
  sessionStorage.removeItem(MODE_KEY)
}
