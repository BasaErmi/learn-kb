import type { ReactNode } from 'react'
import { TexText } from './Tex'

/** 旁注：顺带一提、可以跳过的内容。视觉上弱于主线小标题，不参与小节编号 */
export function Aside({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="kb-aside">
      <p className="kb-aside-title"><span>旁注</span><TexText>{title}</TexText></p>
      {children}
    </aside>
  )
}
