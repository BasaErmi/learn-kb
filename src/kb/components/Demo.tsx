import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { TexText } from './Tex'

/** title 里可以用 `$...$` 写公式；这时用 label 给读屏软件一个可读的名称 */
export function Demo({ title, label, hint, onReset, children }: { title: string; label?: string; hint?: ReactNode; onReset?: () => void; children: ReactNode }) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <section className="kb-demo" aria-label={label ?? title}>
      <header className="kb-demo-head">
        <span className="kb-demo-tag">交互</span>
        <strong><TexText>{title}</TexText></strong>
        {onReset && <button type="button" className="kb-btn-ghost" onClick={onReset}>重置</button>}
      </header>
      {hint && <p className="kb-demo-hint">{typeof hint === 'string' ? <TexText>{hint}</TexText> : hint}</p>}
      <div className="kb-demo-body">{children}</div>
    </section>
  )
}
