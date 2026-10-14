import type { ReactNode } from 'react'

export function Pitfall({ title = '容易混淆', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="kb-pitfall">
      <div className="kb-label">{title}</div>
      {children}
    </aside>
  )
}
