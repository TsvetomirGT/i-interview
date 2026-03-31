import type { InterviewMode } from '@/lib/types'
import { FeedbackCard, parseFeedback, hasFeedback } from './FeedbackCard'
import { TypingIndicator } from './TypingIndicator'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  mode: InterviewMode
}

/** Strip the structured feedback block from AI message so it's rendered separately */
function extractConversationalText(content: string): string {
  // Remove Score, Ideal Answer, Feedback blocks; keep everything else (the next question)
  return content
    .replace(/\*\*Score:\s*\d+\/10\*\*\n?/gi, '')
    .replace(/\*\*Ideal Answer:\*\*[\s\S]*?(?=\*\*Feedback:|\n\n[A-Z#*]|$)/gi, '')
    .replace(/\*\*Feedback:\*\*[\s\S]*?(?=\n\n[A-Z#*]|$)/gi, '')
    .trim()
}

export function ChatBubble({ role, content, isStreaming, mode }: ChatBubbleProps) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[var(--bubble-user-bg)] px-4 py-3 text-sm text-[var(--bubble-user-fg)] whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // While the AI is generating, show pulsing dots instead of raw streaming text
  if (isStreaming) return <TypingIndicator />

  const showFeedback = mode === 'learn' && hasFeedback(content)
  const displayText = showFeedback ? extractConversationalText(content) : content
  const feedback = showFeedback ? parseFeedback(content) : null

  return (
    <div className="flex items-start gap-3 px-4 py-1">
      <div className="w-8 h-8 rounded-full bg-[var(--bubble-ai-bg)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)] shrink-0 mt-0.5">
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm bg-[var(--bubble-ai-bg)] px-4 py-3 text-sm text-[var(--bubble-ai-fg)] whitespace-pre-wrap break-words leading-relaxed">
          {displayText || null}
        </div>
        {feedback && feedback.score !== null && (
          <FeedbackCard
            score={feedback.score}
            idealAnswer={feedback.idealAnswer}
            feedback={feedback.feedback}
          />
        )}
      </div>
    </div>
  )
}
