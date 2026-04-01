'use client'

import { useState, useCallback, useRef } from 'react'
import type { InterviewMode } from './types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UseStreamingChatOptions {
  api: string
  requirements: string
  mode: InterviewMode
  onFinish?: (message: ChatMessage) => void
}

let msgCounter = 0
function newId() {
  return `msg-${++msgCounter}-${Date.now()}`
}

export function useStreamingChat({ api, requirements, mode, onFinish }: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string, requestSummary = false) => {
      if (!content.trim() || isLoading) return

      const userMsg: ChatMessage = { id: newId(), role: 'user', content }

      // Append user message immediately (except the sentinel start message which we hide)
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setIsLoading(true)

      const assistantId = newId()
      // Add empty assistant message as placeholder for streaming
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      abortRef.current = new AbortController()

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
            requirements,
            mode,
            requestSummary,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          const captured = fullContent
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: captured } : m))
          )
        }

        const finalMsg: ChatMessage = { id: assistantId, role: 'assistant', content: fullContent }
        onFinish?.(finalMsg)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Streaming error:', err)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, api, requirements, mode, onFinish]
  )

  const append = useCallback(
    (msg: { role: 'user' | 'assistant'; content: string }, requestSummary = false) => {
      sendMessage(msg.content, requestSummary)
    },
    [sendMessage]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { messages, input, setInput, sendMessage, append, isLoading, stop }
}
