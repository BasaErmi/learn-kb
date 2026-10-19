import type { ReactNode } from 'react'
import { TexText } from './Tex'

export function Step({ id, n, title, gist, children }: { id: string; n: number; title: string; gist: string; children: ReactNode }) {
  return (
    <section id={id} className="kb-step" style={{ counterReset: `kb-step ${n} kb-sec` }}>
      <header className="kb-step-head">
        <span className="kb-step-num" aria-hidden>{String(n).padStart(2, '0')}</span>
        <div>
          <span className="kb-step-kicker">第 {n} 步</span>
          <h2><TexText>{title}</TexText></h2>
          <p className="kb-step-gist"><TexText>{gist}</TexText></p>
        </div>
      </header>
      {children}
    </section>
  )
}
