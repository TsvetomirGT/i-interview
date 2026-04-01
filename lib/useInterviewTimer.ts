'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Countdown timer for interview sessions.
 * Returns secondsRemaining (null if no limit) and calls onTimeUp when it reaches 0.
 */
export function useInterviewTimer(
  timeLimitMinutes: number | null,
  onTimeUp: () => void
): { secondsRemaining: number | null } {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    timeLimitMinutes !== null ? timeLimitMinutes * 60 : null
  )
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    if (timeLimitMinutes === null) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 0) return prev
        if (prev === 1) {
          onTimeUpRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimitMinutes])

  return { secondsRemaining }
}
