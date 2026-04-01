import { buildInterviewStream } from '@/lib/chains'
import type { ApiRequestBody } from '@/lib/types'

export async function POST(request: Request) {
  const body: ApiRequestBody = await request.json()
  const { messages, requirements, mode, requestSummary = false } = body

  // All messages except the last are history; last is the current user message
  const history = messages.slice(0, -1)
  const userMessage = messages.at(-1)?.content ?? ''

  const stream = buildInterviewStream(mode, requestSummary, history, userMessage, requirements)

  // Convert Anthropic SSE events → ReadableStream<Uint8Array>
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
