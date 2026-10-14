import { isValidElement, useState, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'

export function Answer({ children }: { children: ReactNode }) {
  return <div className="kb-answer">{children}</div>
}

const isAnswer = (c: ReactNode) => isValidElement(c) && c.type === Answer

export function Quiz({ title = '检验一下', children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const items = meaningfulChildren(children)
  return (
    <aside className="kb-quiz">
      <div className="kb-label">{title}</div>
      {items.filter((c) => !isAnswer(c))}
      <button type="button" className="kb-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '收起答案' : '显示参考答案'}
      </button>
      {open && items.filter(isAnswer)}
    </aside>
  )
}
