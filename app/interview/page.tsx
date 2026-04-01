'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStreamingChat } from '@/lib/useStreamingChat'
import type { ChatMessage } from '@/lib/types'
import { loadSession } from '@/lib/session'
import type { InterviewSession } from '@/lib/types'
import { ChatShell } from '@/components/interview/ChatShell'
import { hasFeedback, parseFeedback } from '@/components/interview/FeedbackCard'
import { upsertHistoryEntry, loadHistory } from '@/lib/history'
import { useInterviewTimer } from '@/lib/useInterviewTimer'

export default function InterviewPage() {
  const router = useRouter()
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryContent, setSummaryContent] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [timeIsUp, setTimeIsUp] = useState(false)

  const startedRef = useRef(false)
  const summaryRequestedRef = useRef(false)
  const scoresRef = useRef<number[]>([])
  // Stable ID for this interview session (used for upsertHistoryEntry)
  const entryIdRef = useRef<string>(crypto.randomUUID())

  const maxQuestions = session?.questionCount ?? 10

  const handleFinish = useCallback(
    (message: ChatMessage) => {
      if (summaryRequestedRef.current) {
        const scores = scoresRef.current
        const avg = scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        const topic = session?.requirements.split('\n').find((l) => l.trim()) ?? 'Interview'
        const now = new Date().toISOString()
        upsertHistoryEntry({
          id: entryIdRef.current,
          topic: topic.trim().slice(0, 60),
          mode: session!.mode,
          averageScore: avg,
          completedAt: now,
          startedAt: now,
          status: 'completed',
          questionCount: maxQuestions,
          currentQuestion: maxQuestions,
          timeLimitMinutes: session!.timeLimitMinutes,
          requirements: session!.requirements,
          messages: [], // clear messages on completion to save space
        })
        setSummaryContent(message.content)
        return
      }

      if (session?.mode === 'learn' && hasFeedback(message.content)) {
        const { score } = parseFeedback(message.content)
        if (score !== null) scoresRef.current.push(score)
      }

      setQuestionCount((prev) => {
        const next = prev + 1
        if (next >= maxQuestions || timeIsUp) setShowSummary(true)
        return next
      })
    },
    [session, maxQuestions, timeIsUp]
  )

  const { messages, setMessages, input, setInput, append, isLoading } = useStreamingChat({
    api: '/api/interview',
    requirements: session?.requirements ?? '',
    mode: session?.mode ?? 'learn',
    onFinish: handleFinish,
  })

  // Load session and restore resume data after mount.
  // setMessages is called here (not in useState) because useStreamingChat's
  // messages state is already initialized by the time useEffect runs.
  useEffect(() => {
    const s = loadSession()
    setSession(s)

    if (s?.continueFromId) {
      entryIdRef.current = s.continueFromId
      const history = loadHistory()
      const entry = history.find((e) => e.id === s.continueFromId)
      if (entry) {
        setMessages(entry.messages)       // restore full chat history
        setQuestionCount(entry.currentQuestion)
        startedRef.current = true          // skip __START_INTERVIEW__ sentinel
      }
    }

    setMounted(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist progress once per complete exchange (when streaming ends), not on every character
  useEffect(() => {
    if (isLoading || !session || messages.length === 0 || showSummary) return
    const topic = session.requirements.split('\n').find((l) => l.trim()) ?? 'Interview'
    const now = new Date().toISOString()
    upsertHistoryEntry({
      id: entryIdRef.current,
      topic: topic.trim().slice(0, 60),
      mode: session.mode,
      averageScore: null,
      completedAt: now,
      startedAt: now,
      status: 'in_progress',
      questionCount: maxQuestions,
      currentQuestion: questionCount,
      timeLimitMinutes: session.timeLimitMinutes,
      requirements: session.requirements,
      messages,
    })
  }, [isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if no session
  useEffect(() => {
    if (mounted && !session) router.replace('/')
  }, [mounted, session, router])

  // Start interview (skip if resuming)
  useEffect(() => {
    if (!session || startedRef.current) return
    startedRef.current = true
    append({ role: 'user', content: '__START_INTERVIEW__' })
  }, [session, append])

  // Request summary when showSummary becomes true
  useEffect(() => {
    if (!showSummary || summaryRequestedRef.current) return
    summaryRequestedRef.current = true
    append({ role: 'user', content: '__REQUEST_SUMMARY__' }, true)
  }, [showSummary, append])

  // When time is up and no response in flight, trigger summary
  useEffect(() => {
    if (timeIsUp && !isLoading && !showSummary && startedRef.current) {
      setShowSummary(true)
    }
  }, [timeIsUp, isLoading, showSummary])

  const handleTimeUp = useCallback(() => setTimeIsUp(true), [])

  const { secondsRemaining } = useInterviewTimer(
    session?.timeLimitMinutes ?? null,
    handleTimeUp
  )

  function handleSubmit() {
    if (!input.trim() || isLoading || (timeIsUp && !isLoading)) return
    append({ role: 'user', content: input })
    setInput('')
  }

  if (!mounted || !session) return null

  return (
    <div className="h-[calc(100vh-var(--header-height))] flex flex-col overflow-hidden bg-[var(--background)]">
      <ChatShell
        messages={messages}
        input={input}
        isLoading={isLoading}
        mode={session.mode}
        requirements={session.requirements}
        questionCount={Math.min(questionCount, maxQuestions)}
        maxQuestions={maxQuestions}
        showSummary={showSummary && summaryContent !== ''}
        summaryContent={summaryContent}
        secondsRemaining={secondsRemaining}
        timeIsUp={timeIsUp}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
