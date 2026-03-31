# Chat Display Fix Design

**Date:** 2026-03-31

## Problem

During streaming, the AI bubble renders accumulating raw markdown text character-by-character (`**Score: 8/10**`, `**Ideal Answer:**`, etc.). When streaming ends, `extractConversationalText` strips the feedback block from the bubble, leaving only the next question, and `FeedbackCard` pops in below. This creates two problems:

1. The user watches raw markdown symbols stream in, which looks broken.
2. The bubble content visually "shrinks" when streaming ends (full text → question only), which is jarring.

## Desired Behavior

- While AI is generating: show pulsing typing indicator (no text preview).
- When generation completes: reveal the final parsed structure at once — question bubble + FeedbackCard (Learn mode) or question bubble only (Real mode).

## Solution

**Approach A — Hide streaming text in `ChatBubble`**

Single change in `components/interview/ChatBubble.tsx`: when `isStreaming=true` for an assistant role, return `<TypingIndicator />` instead of rendering the bubble content.

```tsx
// Early return when streaming
if (!isUser && isStreaming) return <TypingIndicator />
```

Everything else stays the same: `extractConversationalText`, `FeedbackCard`, `parseFeedback`, `hasFeedback`, the bubble markup, and all of `useStreamingChat`.

## Files Changed

- `components/interview/ChatBubble.tsx` — add early return for streaming state

## Files Unchanged

- `lib/useStreamingChat.ts` — data flow unchanged
- `components/interview/MessageList.tsx` — unchanged
- `components/interview/TypingIndicator.tsx` — reused as-is
- `components/interview/FeedbackCard.tsx` — unchanged
- `app/api/interview/route.ts` — unchanged

## Verification

1. Run `npm run dev`
2. Start an interview in **Learn mode** — send a response and confirm only pulsing dots appear while AI generates, then the full question + FeedbackCard appear together when done
3. Start an interview in **Real mode** — confirm same behavior (dots while generating, final question when done)
4. Run `npm run build` — no type errors
