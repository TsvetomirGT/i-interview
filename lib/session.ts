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
