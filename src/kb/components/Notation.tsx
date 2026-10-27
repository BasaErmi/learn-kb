import { useEffect, useRef, useState, type ReactNode } from 'react'
import { REVEAL_EVENT } from '@/kb/jump'

/** 总览里的“记号”：默认收起，点标题展开。交叉引用跳到里面的锚点时自动展开 */
export function Notation({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (open) return
    const onReveal = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (box.current?.querySelector(`#${CSS.escape(id)}`)) setOpen(true)
    }
    window.addEventListener(REVEAL_EVENT, onReveal)
    return () => window.removeEventListener(REVEAL_EVENT, onReveal)
  }, [open])

  return (
    <details className="kb-notation" ref={box} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><h3>记号</h3></summary>
      <div className="kb-notation-body">{children}</div>
    </details>
  )
}
