export type InterviewMode = 'learn' | 'real'

export interface InterviewSession {
  requirements: string
  mode: InterviewMode
}

export interface ApiRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  requirements: string
  mode: InterviewMode
  requestSummary?: boolean
}
