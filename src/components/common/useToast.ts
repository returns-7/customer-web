import { useCallback, useEffect, useRef, useState } from 'react'

// 토스트 문구 + 자동 사라짐(기본 2초). 새 토스트가 오면 이전 타이머는 취소
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = useCallback((text: string, ms?: number) => {
    setMessage(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), ms || 2000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { message, showToast }
}
