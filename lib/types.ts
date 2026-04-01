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
