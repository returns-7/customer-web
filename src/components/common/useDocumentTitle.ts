import { useLayoutEffect } from 'react'

// 페이지가 떠 있는 동안 탭 제목(document.title)을 바꾸고, 나갈 때 이전 제목으로 되돌린다
export function useDocumentTitle(title: string): void {
  useLayoutEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
}
