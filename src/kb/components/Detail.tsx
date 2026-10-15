import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { REVEAL_EVENT } from '@/kb/jump'

export function Detail({ children }: { children: ReactNode }) {
  const { review } = useReviewMode()
  const [open, setOpen] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const collapsed = review && !open

  // 折叠时内容仍在 DOM 里（只是隐藏），这样交叉引用能找到里面的锚点并要求展开
  useEffect(() => {
    if (!collapsed) return
    const onReveal = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (body.current?.querySelector(`#${CSS.escape(id)}`)) setOpen(true)
    }
    window.addEventListener(REVEAL_EVENT, onReveal)
    return () => window.removeEventListener(REVEAL_EVENT, onReveal)
  }, [collapsed])

  return (
    <>
      {collapsed && (
        <button type="button" className="kb-detail-toggle" onClick={() => setOpen(true)}>
          展开讲解 ▾
        </button>
      )}
      <div className="kb-detail" ref={body} hidden={collapsed}>
        {children}
        {review && (
          <button type="button" className="kb-detail-toggle" onClick={() => setOpen(false)}>
            收起讲解 ▴
          </button>
        )}
      </div>
    </>
  )
}
