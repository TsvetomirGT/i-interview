'use client'

import { useRouter } from 'next/navigation'
import { clearSession } from '@/lib/session'
import { Button } from '@/components/ui/Button'

interface SummaryPanelProps {
  content: string
}

function getRecommendationStyle(content: string) {
  if (/strong hire/i.test(content)) return 'bg-emerald-500 text-white'
  if (/no hire/i.test(content)) return 'bg-red-500 text-white'
  return 'bg-amber-500 text-white'
}

function extractRecommendation(content: string): string | null {
  const match = content.match(/\*\*Recommendation:\*\*\s*(Strong Hire|Hire|No Hire)/i)
  return match ? match[1] : null
}

export function SummaryPanel({ content }: SummaryPanelProps) {
  const router = useRouter()
  const recommendation = extractRecommendation(content)

  function handleRestart() {
    clearSession()
    router.push('/')
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Interview Complete
        </h2>
        {recommendation && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getRecommendationStyle(content)}`}
          >
            {recommendation}
          </span>
        )}
      </div>

      <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
        {content}
      </div>

      <Button onClick={handleRestart} className="self-start">
        Start New Interview
      </Button>
    </div>
  )
}
