import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * 页内交叉引用：点 <Ref> 跳到 <Anchor>，同时记下跳转前的滚动位置，
 * 右下角出现“返回”按钮，免得来回滚动找读到哪里。
 */
interface JumpCtx {
  jump: (id: string) => void
  back: () => void
  clear: () => void
  depth: number
}

const Ctx = createContext<JumpCtx | null>(null)

/** 折叠的讲解块收到这个事件后，如果包含目标就自己展开 */
export const REVEAL_EVENT = 'kb:reveal'

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function flash(el: HTMLElement) {
  // 锚点本身不可见，高亮紧跟在它后面的那块内容；“引导句 + 公式”一起高亮
  const first = (el.classList.contains('kb-anchor') ? el.nextElementSibling : el) as HTMLElement | null
  if (!first) return
  const next = first.nextElementSibling as HTMLElement | null
  const targets = first.tagName === 'P' && next?.querySelector('.katex-display') ? [first, next] : [first]
  for (const t of targets) {
    t.classList.remove('kb-flash')
    void t.offsetWidth
    t.classList.add('kb-flash')
    setTimeout(() => t.classList.remove('kb-flash'), 2600)
  }
}

export function JumpProvider({ children }: { children: ReactNode }) {
  // 跳转前的滚动位置；ref 存数据，depth 只用来触发重渲染
  const stack = useRef<number[]>([])
  const [depth, setDepth] = useState(0)

  const jump = useCallback((id: string) => {
    stack.current.push(window.scrollY)
    setDepth(stack.current.length)
    window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: id }))
    // 等折叠块展开、渲染完成后再滚动
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
      flash(el)
    }))
  }, [])

  const back = useCallback(() => {
    const y = stack.current.pop()
    setDepth(stack.current.length)
    if (y !== undefined) window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' })
  }, [])

  const clear = useCallback(() => {
    stack.current = []
    setDepth(0)
  }, [])
  const value = useMemo(() => ({ jump, back, clear, depth }), [jump, back, clear, depth])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useJump(): JumpCtx | null {
  return useContext(Ctx)
}

/** 跳转目标：放在被引用的公式或段落前面 */
export function Anchor({ id }: { id: string }) {
  return <span id={id} className="kb-anchor" aria-hidden />
}

/** 正文里的交叉引用，例如 <Ref to="cg-bayes">第 3 步的贝叶斯公式</Ref> */
export function Ref({ to, children }: { to: string; children: ReactNode }) {
  const ctx = useJump()
  return (
    <button type="button" className="kb-ref" onClick={() => ctx?.jump(to)}>
      {children}
    </button>
  )
}

/** 跳转后出现在右下角的返回按钮 */
export function BackToReading() {
  const ctx = useJump()
  if (!ctx || ctx.depth === 0) return null
  return (
    <div className="kb-backjump" role="region" aria-label="返回阅读位置">
      <button type="button" className="kb-backjump-main" onClick={ctx.back}>
        ↩ 回到刚才读的位置{ctx.depth > 1 ? `（${ctx.depth}）` : ''}
      </button>
      <button type="button" className="kb-backjump-close" onClick={ctx.clear} aria-label="关闭返回按钮">×</button>
    </div>
  )
}
