import { useState, type ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Detail({ children }: { children: ReactNode }) {
  const { review } = useReviewMode()
  const [open, setOpen] = useState(false)
  if (review && !open)
    return (
      <button type="button" className="kb-detail-toggle" onClick={() => setOpen(true)}>
        展开讲解 ▾
      </button>
    )
  return (
    <div className="kb-detail">
      {children}
      {review && (
        <button type="button" className="kb-detail-toggle" onClick={() => setOpen(false)}>
          收起讲解 ▴
        </button>
      )}
    </div>
  )
}
