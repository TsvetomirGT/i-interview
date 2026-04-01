'use client'

import { useRef, KeyboardEvent, ChangeEvent } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, isLoading, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && !disabled && value.trim()) onSubmit()
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 144) + 'px'
  }

  return (
    <div className="flex gap-3 items-end">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading || disabled}
        placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--bubble-user-bg)] transition-shadow disabled:opacity-50 max-h-36 overflow-y-auto"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading || disabled || !value.trim()}
        className="shrink-0 w-10 h-10 rounded-xl bg-[var(--bubble-user-bg)] text-[var(--bubble-user-fg)] flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 active:scale-95 transition-all"
        aria-label="Send message"
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        )}
      </button>
    </div>
  )
}
