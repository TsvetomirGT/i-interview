import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompts'
import type { InterviewMode } from './types'

const client = new Anthropic()

export function buildInterviewStream(
  mode: InterviewMode,
  requestSummary: boolean,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  requirements: string
) {
  const system = buildSystemPrompt(mode, requestSummary, requirements)
  return client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    temperature: 0.7,
    system,
    messages: [
      ...history,
      { role: 'user', content: userMessage },
    ],
  })
}
