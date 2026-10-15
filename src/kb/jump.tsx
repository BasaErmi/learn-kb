import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { findTopic } from '@/topics/registry'

/**
 * 交叉引用：点 <Ref> 跳到 <Anchor>，同时记下跳转前的位置，右下角出现“返回”按钮，
 * 免得来回滚动找读到哪里。
 * - 页内：<Ref to="cg-bayes">…</Ref>
 * - 跨专题：<Ref topic="cfg" to="step-2">…</Ref>，打开目标专题并定位；返回按钮回到原专题的原位置
 * - 深链接：#/t/<slug>?at=<锚点 id>
 */
interface JumpCtx {
  jump: (id: string) => void
  back: () => void
  clear: () => void
  depth: number
}

/** 跨专题跳转时随路由带上的来源信息 */
interface FromState { from?: { slug: string; y: number } }

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

/** 展开包含目标的折叠块，等渲染完成后滚动过去并高亮 */
function revealAndScroll(id: string, smooth = true) {
  window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: id }))
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: smooth && !reduceMotion() ? 'smooth' : 'auto', block: 'start' })
    flash(el)
  }))
}

export function JumpProvider({ children }: { children: ReactNode }) {
  // 页内跳转前的滚动位置；ref 存数据，depth 只用来触发重渲染
  const stack = useRef<number[]>([])
  const [depth, setDepth] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  // 处理 ?at=<id>（跨专题跳转 / 深链接）和 ?y=<px>（从别的专题返回），处理完把参数从地址栏去掉
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const at = q.get('at'), y = q.get('y')
    if (at === null && y === null) return
    if (at) revealAndScroll(at, false)
    else requestAnimationFrame(() => window.scrollTo({ top: Number(y) || 0 }))
    navigate(location.pathname, { replace: true, state: location.state })
  }, [location.search, location.pathname, location.state, navigate])

  const jump = useCallback((id: string) => {
    stack.current.push(window.scrollY)
    setDepth(stack.current.length)
    revealAndScroll(id)
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

/** 交叉引用。不写 topic 是页内跳转；写 topic 则跳到另一个专题的锚点（或 step-N） */
export function Ref({ to, topic, children }: { to: string; topic?: string; children: ReactNode }) {
  const ctx = useJump()
  const navigate = useNavigate()
  const { slug } = useParams()
  const external = topic !== undefined && topic !== slug
  const onClick = () => {
    if (!external) return ctx?.jump(to)
    const state: FromState = { from: slug ? { slug, y: window.scrollY } : undefined }
    navigate(`/t/${topic}?at=${encodeURIComponent(to)}`, { state })
  }
  return (
    <button type="button" className={external ? 'kb-ref is-external' : 'kb-ref'} onClick={onClick}>
      {children}
    </button>
  )
}

/** 跳转后出现在右下角的返回按钮：先退页内跳转，再回到来源专题 */
export function BackToReading() {
  const ctx = useJump()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as FromState | null)?.from
  if (!ctx) return null
  if (ctx.depth > 0)
    return (
      <div className="kb-backjump" role="region" aria-label="返回阅读位置">
        <button type="button" className="kb-backjump-main" onClick={ctx.back}>
          ↩ 回到刚才读的位置{ctx.depth > 1 ? `（${ctx.depth}）` : ''}
        </button>
        <button type="button" className="kb-backjump-close" onClick={ctx.clear} aria-label="关闭返回按钮">×</button>
      </div>
    )
  if (!from) return null
  const title = findTopic(from.slug)?.title ?? from.slug
  return (
    <div className="kb-backjump" role="region" aria-label="返回阅读位置">
      <button type="button" className="kb-backjump-main" onClick={() => navigate(`/t/${from.slug}?y=${Math.round(from.y)}`)}>
        ↩ 回到《{title}》
      </button>
      <button type="button" className="kb-backjump-close" onClick={() => navigate(location.pathname, { replace: true, state: null })} aria-label="关闭返回按钮">×</button>
    </div>
  )
}
