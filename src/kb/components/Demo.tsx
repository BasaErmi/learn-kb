import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Demo({ title, hint, onReset, children }: { title: string; hint?: ReactNode; onReset?: () => void; children: ReactNode }) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <section className="kb-demo" aria-label={title}>
      <header className="kb-demo-head">
        <span className="kb-demo-tag">交互</span>
        <strong>{title}</strong>
        {onReset && <button type="button" className="kb-btn-ghost" onClick={onReset}>重置</button>}
      </header>
      {hint && <p className="kb-demo-hint">{hint}</p>}
      <div className="kb-demo-body">{children}</div>
    </section>
  )
}
