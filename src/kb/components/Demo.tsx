import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { TexText } from './Tex'

/** title 里可以用 `$...$` 写公式；这时用 label 给读屏软件一个可读的名称 */
/** schematic：标“示意”角标；note：底部说明（数据是怎么算的、哪些是近似） */
export function Demo({ title, label, hint, onReset, schematic, note, children }: { title: string; label?: string; hint?: ReactNode; onReset?: () => void; schematic?: boolean; note?: ReactNode; children: ReactNode }) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <section className="kb-demo" aria-label={label ?? title}>
      <header className="kb-demo-head">
        <span className="kb-demo-tag">交互</span>
        <strong><TexText>{title}</TexText>{schematic && <span className="kb-schematic">示意</span>}</strong>
        {onReset && <button type="button" className="kb-btn-ghost" onClick={onReset}>重置</button>}
      </header>
      {hint && <p className="kb-demo-hint">{typeof hint === 'string' ? <TexText>{hint}</TexText> : hint}</p>}
      <div className="kb-demo-body">{children}</div>
      {note && <p className="kb-demo-foot"><b>NOTE</b>{typeof note === 'string' ? <TexText>{note}</TexText> : note}</p>}
    </section>
  )
}
