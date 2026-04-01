export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-[var(--bubble-ai-bg)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)] shrink-0">
        AI
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[var(--bubble-ai-bg)] px-4 py-3">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]" />
      </div>
    </div>
  )
}
