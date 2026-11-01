import { useEffect, useState } from 'react'

// S3 전광판 시계 — 원본처럼 실제 시각(시:분)을 열 때 한 번, 이후 10초마다 읽는다.
// 날짜가 아니라 시각 표시라서 getBusinessToday()와는 무관.
const read = () => {
  const d = new Date()
  return { h: String(d.getHours()).padStart(2, '0'), m: String(d.getMinutes()).padStart(2, '0') }
}

export function useLandingClock(): { h: string; m: string } {
  const [clk, setClk] = useState(read)
  useEffect(() => {
    const id = setInterval(() => setClk(read()), 10000)
    return () => clearInterval(id)
  }, [])
  return clk
}
