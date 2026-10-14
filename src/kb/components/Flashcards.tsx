import { isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'
import { usePersistentState } from '@/kb/state/usePersistentState'

export function Front({ children }: { children: ReactNode }) { return <>{children}</> }
export function Back({ children }: { children: ReactNode }) { return <>{children}</> }
/** 数据载体，由 Flashcards 负责渲染 */
export function Card(_: { id: string; children: ReactNode }) { return null }

type CardEl = ReactElement<{ id: string; children: ReactNode }>
const pick = (kids: ReactNode, type: unknown) => meaningfulChildren(kids).find((c) => isValidElement(c) && c.type === type)

export function Flashcards({ topic, children }: { topic: string; children: ReactNode }) {
  const cards = meaningfulChildren(children).filter((c): c is CardEl => isValidElement(c) && c.type === Card)
  const [mastered, setMastered] = usePersistentState<string[]>(`kb:${topic}:mastered`, [])
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [onlyTodo, setOnlyTodo] = useState(false)
  const ids = cards.map((c) => c.props.id)
  const done = mastered.filter((id) => ids.includes(id)).length
  const visible = cards.filter((c) => !onlyTodo || !mastered.includes(c.props.id))
  const flip = (id: string) => setFlipped({ ...flipped, [id]: !flipped[id] })
  const toggleMastered = (id: string) =>
    setMastered(mastered.includes(id) ? mastered.filter((x) => x !== id) : [...mastered, id])

  return (
    <div className="kb-cards">
      <div className="kb-cards-bar">
        <span>已掌握 <strong>{done}</strong> / {cards.length}</span>
        <div className="kb-meter"><div style={{ width: `${(done / Math.max(cards.length, 1)) * 100}%` }} /></div>
        <label><input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} /> 只看未掌握</label>
        <button type="button" className="kb-btn-ghost" onClick={() => setMastered([])}>清空记录</button>
      </div>
      {visible.length === 0 && <p className="kb-muted">全部掌握了。</p>}
      <div className="kb-cards-grid">
        {visible.map((c) => {
          const id = c.props.id
          const isFlipped = !!flipped[id]
          return (
            <article key={id} className={isFlipped ? 'kb-card is-flipped' : 'kb-card'} data-card={id}>
              <div
                className="kb-card-face"
                role="button"
                tabIndex={0}
                aria-expanded={isFlipped}
                onClick={() => flip(id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(id) } }}
              >
                <span className="kb-card-side">{isFlipped ? '答案' : '问题'}</span>
                {isFlipped ? pick(c.props.children, Back) : pick(c.props.children, Front)}
              </div>
              <label className="kb-card-check">
                <input type="checkbox" checked={mastered.includes(id)} onChange={() => toggleMastered(id)} /> 已掌握
              </label>
            </article>
          )
        })}
      </div>
    </div>
  )
}
