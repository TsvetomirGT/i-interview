# Interview Configuration & Resume Design

**Date:** 2026-04-01  
**Status:** Approved

## Context

The interview app currently hardcodes 10 questions per session with no time limit and no way to resume an unfinished interview. Users need control over interview length (1–50 questions) and optional time pressure (up to 120 minutes). Incomplete interviews should persist and be resumable from the history panel.

---

## Data Model Changes

### `lib/types.ts`

Extend `InterviewSession` (sessionStorage) with two new config fields and an optional resume pointer:

```typescript
interface InterviewSession {
  requirements: string
  mode: InterviewMode
  questionCount: number           // target questions (1–50), default 10
  timeLimitMinutes: number | null // null = no limit
  continueFromId?: string         // set when resuming an in-progress interview
}
```

Extend `HistoryEntry` (localStorage) with status, progress, config, and messages:

```typescript
interface HistoryEntry {
  id: string
  topic: string
  mode: 'learn' | 'real'
  averageScore: number | null
  completedAt: string             // ISO timestamp; set on first save, updated on complete
  startedAt: string               // NEW: ISO timestamp of first message
  status: 'completed' | 'in_progress'  // NEW
  questionCount: number           // NEW: target question count
  currentQuestion: number         // NEW: questions answered so far
  timeLimitMinutes: number | null // NEW
  requirements: string            // NEW: stored for session restore on Continue
  messages: ChatMessage[]         // NEW: full chat history; cleared to [] on completion
}
```

**Note:** Messages are cleared on completion to free localStorage space. Completed entries retain all metadata for display.

---

## Setup Form (`components/setup/SetupForm.tsx`)

Two new controls added below the existing mode selector:

### Question count slider
- Range: 1–50, default: 10, step: 1
- Displays current value inline: `Questions: 10`
- Implemented as `<input type="range">` with numeric label

### Time limit control
- "No time limit" checkbox (default: checked = no limit)
- When unchecked: slider appears, range 5–120 min, step 5, default 30
- Label: `Time limit: 30 min`

`handleSubmit` saves `questionCount` and `timeLimitMinutes` (or `null`) to sessionStorage.

### Resume bypass
When the user clicks "Continue" on a history card, `saveSession()` is called with the stored entry values plus `continueFromId: entry.id`, then `router.push('/interview')`. The setup form is not shown.

---

## Timer Hook (`lib/useInterviewTimer.ts`)

New hook encapsulating countdown logic:

```typescript
function useInterviewTimer(
  timeLimitMinutes: number | null,
  onTimeUp: () => void
): { secondsRemaining: number | null }
```

- If `timeLimitMinutes` is `null`, hook is a no-op; returns `null`
- Counts down in 1-second intervals using `setInterval`
- Calls `onTimeUp()` when `secondsRemaining` reaches 0
- Cleans up interval on unmount

---

## Interview Page (`app/interview/page.tsx`)

### Configuration
- `MAX_QUESTIONS` reads from `session.questionCount` instead of hardcoded `10`
- `timeLimitMinutes` read from session and passed to `useInterviewTimer`

### Resume flow
On mount, if `session.continueFromId` is set:
1. Load `HistoryEntry` from localStorage by ID
2. Restore `entry.messages` as initial chat state
3. Restore `entry.currentQuestion` as initial question count
4. Skip the `__START_INTERVIEW__` sentinel (interview already started)

### Progress persistence
On every new message (in the `onFinish` callback):
- Call `upsertHistoryEntry()` with updated `messages`, `currentQuestion`, and `status: 'in_progress'`
- This creates the entry on the first message and updates it on every subsequent one

### Completion
- Same trigger as today (question count reached, or `timeIsUp` flag after current answer submits)
- Call `upsertHistoryEntry()` with `status: 'completed'`, `messages: []`, final `averageScore`, and updated `completedAt`

### Time-up flow
`onTimeUp` callback sets `timeIsUp = true` in page state:
- Chat input is disabled after the current in-flight response finishes
- The summary request (`__REQUEST_SUMMARY__`) fires automatically — same path as reaching the question limit

---

## Chat Header (`components/interview/ChatShell.tsx`)

Header row gains a timer display alongside existing question progress:

- Format: `MM:SS` countdown
- Hidden when `secondsRemaining === null` (no limit)
- Colors: default → amber when < 2 min → red when < 1 min
- Question progress label uses dynamic `questionCount` from session

---

## History Panel (`components/interview/HistorySidebar.tsx`)

### Card layout by status

**In-progress card:**
- Topic (same as today)
- Mode badge
- Progress: `3 / 10 questions`
- Time config: `30 min` or `No limit`
- Started date
- "Continue" button (primary) + delete button

**Completed card:** unchanged from today

### Ordering
In-progress entries float to the top. Within each group, sorted by date descending.

### Continue action
```typescript
function handleContinue(entry: HistoryEntry) {
  saveSession({
    requirements: entry.requirements,  // stored in HistoryEntry (new field)
    mode: entry.mode,
    questionCount: entry.questionCount,
    timeLimitMinutes: entry.timeLimitMinutes,
    continueFromId: entry.id,
  })
  router.push('/interview')
}
```

---

## `lib/history.ts` Changes

- `saveHistoryEntry` → renamed to `upsertHistoryEntry(entry: HistoryEntry)`: creates or updates by ID
- `loadHistory()` returns both completed and in-progress entries
- `deleteHistoryEntry(id)` unchanged

---

## Verification

1. **Setup form:** Start app, verify sliders appear, verify values persist to sessionStorage on submit
2. **Question limit:** Set to 5, run interview, confirm it ends after 5 questions
3. **Timer:** Set to 5 min, verify countdown in header, let it reach 0, confirm interview ends after current answer
4. **No limit:** Toggle "No time limit", verify no timer shows in interview header
5. **In-progress persistence:** Start interview, answer 2 questions, close tab, reopen app, verify history shows in-progress card with correct progress
6. **Resume:** Click "Continue" on in-progress card, verify chat restores all previous messages and continues from where it left off
7. **Completion updates history:** Complete a resumed interview, verify card changes to completed with score
