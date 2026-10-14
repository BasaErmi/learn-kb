import { useState, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Derivation({ children }: { children: ReactNode }) {
  const { review } = useReviewMode()
  const items = meaningfulChildren(children)
  const [shown, setShown] = useState(1)
  if (review) return <div className="kb-deriv is-final">{items[items.length - 1]}</div>
  return (
    <div className="kb-deriv">
      <ol>
        {items.slice(0, shown).map((c, i) => (
          <li key={i} className={i === shown - 1 ? 'is-new' : undefined}>{c}</li>
        ))}
      </ol>
      <div className="kb-deriv-ctrl">
        {shown < items.length ? (
          <>
            <button type="button" className="kb-btn" onClick={() => setShown(shown + 1)}>
              下一步（{shown}/{items.length}）
            </button>
            <button type="button" className="kb-btn-ghost" onClick={() => setShown(items.length)}>全部展开</button>
          </>
        ) : (
          <span className="kb-muted">推导完成</span>
        )}
        {shown > 1 && <button type="button" className="kb-btn-ghost" onClick={() => setShown(1)}>重来</button>}
      </div>
    </div>
  )
}
