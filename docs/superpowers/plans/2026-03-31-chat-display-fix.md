# Chat Display Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide raw streaming markdown text and show a pulsing typing indicator while the AI is generating, then reveal the final parsed message (question bubble + FeedbackCard) when done.

**Architecture:** Single early-return added to `ChatBubble` — when `isStreaming=true` for an assistant bubble, delegate to the existing `TypingIndicator` component instead of rendering content. No data-flow changes; `useStreamingChat` keeps streaming in the background.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4. No new dependencies.

---

### Task 1: Hide streaming text in ChatBubble

**Files:**
- Modify: `components/interview/ChatBubble.tsx`

No test runner is configured in this project, so verification is manual (see steps below).

- [ ] **Step 1: Add early return for streaming assistant messages**

Open `components/interview/ChatBubble.tsx`. The file currently starts:

```tsx
import type { InterviewMode } from '@/lib/types'
import { FeedbackCard, parseFeedback, hasFeedback } from './FeedbackCard'
```

Replace the file content with:

```tsx
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
          {displayText || content}
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
```

Note: the `streaming-cursor` CSS class was removed from the final bubble since it no longer applies (streaming state now shows `TypingIndicator` instead).

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected output: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Manual verification — Learn mode**

```bash
npm run dev
```

1. Open `http://localhost:3000`, enter job requirements (50+ chars), select **Learn** mode, click Start.
2. Send a response to the first question.
3. **While AI generates:** confirm only pulsing dots appear (no raw `**Score:**` text).
4. **When generation ends:** confirm three distinct elements appear together:
   - AI bubble with the next question (plain text only)
   - FeedbackCard with score circle, Ideal Answer, and Feedback sections
5. Send another response and repeat.

- [ ] **Step 4: Manual verification — Real mode**

1. Go back to setup, select **Real** mode.
2. Send a response.
3. **While AI generates:** confirm pulsing dots only.
4. **When done:** confirm plain question text in AI bubble, no FeedbackCard.

- [ ] **Step 5: Commit**

```bash
git add components/interview/ChatBubble.tsx
git commit -m "$(cat <<'EOF'
fix: hide streaming text, show typing indicator until AI response is complete

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
