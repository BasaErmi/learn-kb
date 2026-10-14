import { scrollToId } from '@/kb/scroll'

export interface RoadNode { id: string; label: string; sub: string; kind: 'goal' | 'basis' | 'pre' | 'core' }

const KIND: Record<RoadNode['kind'], string> = { goal: '动机', basis: '扩散基础', pre: '前身', core: 'CFG 本身' }

export function Roadmap({ nodes }: { nodes: RoadNode[] }) {
  return (
    <div className="kb-roadmap">
      <ol>
        {nodes.map((n, i) => (
          <li key={n.id} className={`kind-${n.kind}`}>
            <button type="button" onClick={() => scrollToId(n.id)}>
              <span className="kb-road-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="kb-road-label">{n.label}</span>
              <span className="kb-road-sub">{n.sub}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="kb-road-legend">
        {(Object.keys(KIND) as RoadNode['kind'][]).map((k) => (
          <span key={k} className={`kind-${k}`}><i aria-hidden />{KIND[k]}</span>
        ))}
      </div>
    </div>
  )
}
