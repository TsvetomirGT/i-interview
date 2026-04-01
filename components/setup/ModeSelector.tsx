import type { InterviewMode } from '@/lib/types'

interface ModeSelectorProps {
  value: InterviewMode
  onChange: (mode: InterviewMode) => void
}

const MODES: { value: InterviewMode; label: string; description: string }[] = [
  {
    value: 'learn',
    label: 'Learn',
    description: 'Get scored and detailed feedback after every answer',
  },
  {
    value: 'real',
    label: 'Real',
    description: 'Simulate an actual interview — no hints or scoring',
  },
]

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Interview mode" className="grid grid-cols-2 gap-3">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          role="radio"
          aria-checked={value === mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={`flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all ${
            value === mode.value
              ? 'border-[var(--bubble-user-bg)] bg-[var(--feedback-bg)]'
              : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
          }`}
        >
          <span
            className={`text-sm font-semibold ${
              value === mode.value
                ? 'text-[var(--bubble-user-bg)]'
                : 'text-[var(--foreground)]'
            }`}
          >
            {mode.label}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            {mode.description}
          </span>
        </button>
      ))}
    </div>
  )
}
