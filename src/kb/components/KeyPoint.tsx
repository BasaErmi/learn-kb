import type { ReactNode } from 'react'

export function KeyPoint({ children }: { children: ReactNode }) {
  return (
    <aside className="kb-keypoint">
      <div className="kb-label">要点</div>
      {children}
    </aside>
  )
}
