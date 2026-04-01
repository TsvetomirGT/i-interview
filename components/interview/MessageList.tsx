'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/useStreamingChat'
import type { InterviewMode } from '@/lib/types'
import { ChatBubble } from './ChatBubble'
import { TypingIndicator } from './TypingIndicator'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  mode: InterviewMode
}

export function MessageList({ messages, isLoading, mode }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Filter out the sentinel start/summary messages from display
  const displayMessages = messages.filter(
    (m) =>
      m.content !== '__START_INTERVIEW__' &&
      m.content !== '__REQUEST_SUMMARY__'
  )

  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
      {displayMessages.map((message, i) => {
        const isLastAssistant =
          message.role === 'assistant' &&
          i === displayMessages.length - 1 &&
          isLoading

        return (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            isStreaming={isLastAssistant}
            mode={mode}
          />
        )
      })}
      {isLoading && displayMessages.at(-1)?.role === 'user' && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
