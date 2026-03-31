'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStreamingChat, type ChatMessage } from '@/lib/useStreamingChat'
import { loadSession } from '@/lib/session'
import type { InterviewSession } from '@/lib/types'
import { ChatShell } from '@/components/interview/ChatShell'
import { hasFeedback, parseFeedback } from '@/components/interview/FeedbackCard'
import { saveHistoryEntry } from '@/lib/history'

const MAX_QUESTIONS = 10

export default function InterviewPage() {
  const router = useRouter()
  const [session] = useState<InterviewSession | null>(() => loadSession())
  const [showSummary, setShowSummary] = useState(false)
  const [summaryContent, setSummaryContent] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const startedRef = useRef(false)
  const summaryRequestedRef = useRef(false)
  const scoresRef = useRef<number[]>([])

  const handleFinish = useCallback(
    (message: ChatMessage) => {
      if (summaryRequestedRef.current) {
        const scores = scoresRef.current
        const avg = scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        const topic = session?.requirements.split('\n').find(l => l.trim()) ?? 'Interview'
        saveHistoryEntry({ topic: topic.trim().slice(0, 60), mode: session!.mode, averageScore: avg })
        setSummaryContent(message.content)
        return
      }
      if (session?.mode === 'learn' && hasFeedback(message.content)) {
        const { score } = parseFeedback(message.content)
        if (score !== null) scoresRef.current.push(score)
      }
      setQuestionCount(prev => {
        if (prev + 1 >= MAX_QUESTIONS) setShowSummary(true)
        return prev + 1
      })
    },
    [session]
  )

  const { messages, input, setInput, append, isLoading } = useStreamingChat({
    api: '/api/interview',
    requirements: session?.requirements ?? '',
    mode: session?.mode ?? 'learn',
    onFinish: handleFinish,
  })

  // Redirect if no session
  useEffect(() => {
    if (!session) router.replace('/')
  }, [session, router])

  // Trigger the first AI question once session is loaded
  useEffect(() => {
    if (!session || startedRef.current) return
    startedRef.current = true
    append({ role: 'user', content: '__START_INTERVIEW__' })
  }, [session, append])

  // After showSummary becomes true, request the summary
  useEffect(() => {
    if (!showSummary || summaryRequestedRef.current) return
    summaryRequestedRef.current = true
    append({ role: 'user', content: '__REQUEST_SUMMARY__' }, true)
  }, [showSummary, append])

  function handleSubmit() {
    if (!input.trim() || isLoading) return
    append({ role: 'user', content: input })
    setInput('')
  }

  if (!session) return null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--background)]">
      <ChatShell
        messages={messages}
        input={input}
        isLoading={isLoading}
        mode={session.mode}
        requirements={session.requirements}
        questionCount={Math.min(questionCount, MAX_QUESTIONS)}
        maxQuestions={MAX_QUESTIONS}
        showSummary={showSummary && summaryContent !== ''}
        summaryContent={summaryContent}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
