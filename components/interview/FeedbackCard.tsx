import type { ReactNode } from 'react'

interface ParsedFeedback {
  score: number | null
  idealAnswer: string | null
  feedback: string | null
}

export function parseFeedback(content: string): ParsedFeedback {
  const scoreMatch = content.match(/\*\*Score:\s*(\d+)\/10\*\*/i)
  // Ideal Answer: everything up to **Feedback:** (non-greedy, anchored to that marker)
  const idealMatch = content.match(/\*\*Ideal Answer:\*\*\s*([\s\S]*?)(?=\*\*Feedback:|$)/i)
  // Feedback: stop at --- separator (or end of string)
  const feedbackMatch = content.match(/\*\*Feedback:\*\*\s*([\s\S]*?)(?=\n{1,2}-{3,}|$)/i)

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : null,
    idealAnswer: idealMatch ? idealMatch[1].trim() : null,
    feedback: feedbackMatch ? feedbackMatch[1].trim() : null,
  }
}

export function hasFeedback(content: string): boolean {
  return /\*\*Score:\s*\d+\/10\*\*/i.test(content)
}

/** Render a string with **bold** markdown as React nodes */
export function renderMd(text: string): ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const nodes = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    )
    return (
      <span key={i}>
        {nodes}
        {i < arr.length - 1 && '\n'}
      </span>
    )
  })
}

interface FeedbackCardProps {
  score: number
  idealAnswer: string | null
  feedback: string | null
}

export function FeedbackCard({ score, idealAnswer, feedback }: FeedbackCardProps) {
  const scoreColor =
    score >= 8
      ? 'bg-emerald-500'
      : score >= 5
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div
      className="mt-3 rounded-xl border border-[var(--feedback-border)] bg-[var(--feedback-bg)] p-4 flex flex-col gap-3"
      style={{ color: 'var(--feedback-fg)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold ${scoreColor}`}
        >
          {score}
        </span>
        <span className="text-sm font-semibold">out of 10</span>
      </div>

      {idealAnswer && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Ideal Answer
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMd(idealAnswer)}</p>
        </div>
      )}

      {feedback && feedback !== 'Great answer!' && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Feedback
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMd(feedback)}</p>
        </div>
      )}

      {feedback === 'Great answer!' && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Great answer!
        </p>
      )}
    </div>
  )
}
