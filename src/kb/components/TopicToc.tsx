import { useEffect, useState } from 'react'
import type { TopicStep } from '@/topics/registry'
import { scrollToId } from '@/kb/scroll'
import { usePersistentState } from '@/kb/state/usePersistentState'

export function TopicToc({ topic, steps }: { topic: string; steps: TopicStep[] }) {
  const [active, setActive] = useState(steps[0]?.id ?? '')
  const [visited, setVisited] = usePersistentState<string[]>(`kb:${topic}:visited`, [])

  useEffect(() => {
    const els = steps.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [steps])

  useEffect(() => {
    if (active && !visited.includes(active)) setVisited([...visited, active])
  }, [active, visited, setVisited])

  const readCount = steps.filter((s) => visited.includes(s.id)).length
  return (
    <nav className="kb-toc" aria-label="目录">
      <div className="kb-toc-title">目录</div>
      <ol>
        {steps.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={s.id === active ? 'is-active' : undefined}
              onClick={() => scrollToId(s.id)}
            >
              <span className={visited.includes(s.id) ? 'kb-toc-dot is-read' : 'kb-toc-dot'} aria-hidden />
              {s.title}
            </button>
          </li>
        ))}
      </ol>
      <div className="kb-toc-progress">
        已读 {readCount} / {steps.length}
        <div className="kb-meter"><div style={{ width: `${(readCount / steps.length) * 100}%` }} /></div>
      </div>
    </nav>
  )
}
