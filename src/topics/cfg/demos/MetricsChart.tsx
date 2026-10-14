import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { useReviewMode } from '@/kb/state/ReviewMode'

type P = [number, number]
const S = Array.from({ length: 91 }, (_, i) => 1 + i * 0.1)
// 只表示形状，不是真实数据
const IS = (s: number) => 1 - 0.85 * Math.exp(-(s - 1) / 2.2)
const FID = (s: number) => 0.18 + (s - 2.2) ** 2 / 85
const PREC = (s: number) => 1 - 0.65 * Math.exp(-(s - 1) / 2)
const REC = (s: number) => 0.92 * Math.exp(-(s - 1) / 4.5)
const W = 290, H = 200, M = { l: 12, r: 12, t: 22, b: 30 }
const SWATCH: Record<string, string> = { 'stroke-cond': 'bg-cond', 'stroke-guided': 'bg-guided', 'stroke-uncond': 'bg-uncond' }

function Panel({ title, series }: { title: string; series: { name: string; f: (s: number) => number; cls: string }[] }) {
  const x = scaleLinear().domain([1, 10]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, 1.1]).range([H - M.b, M.t])
  return (
    <div>
    <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label={title}>
      <text x={M.l} y={12} style={{ fill: 'var(--ink-2)', fontWeight: 600 }}>{title}</text>
      <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
      <line x1={x(2.2)} x2={x(2.2)} y1={M.t} y2={y(0)} className="stroke-ref" />
      <text x={x(2.2) + 4} y={M.t + 10}>FID 最优点附近</text>
      {series.map((sr) => (
        <g key={sr.name}>
          <path d={line<P>().x((p) => x(p[0])).y((p) => y(p[1]))(S.map((s) => [s, sr.f(s)] as P)) ?? ''} className={sr.cls} />
        </g>
      ))}
      <text x={M.l} y={H - 8}>s = 1</text>
      <text x={W - M.r} y={H - 8} textAnchor="end">s 增大 →</text>
    </svg>
    <div className="kb-legend">
      {series.map((sr) => <span key={sr.name}><i className={SWATCH[sr.cls]} />{sr.name}</span>)}
    </div>
    </div>
  )
}

export function MetricsChart() {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className="kb-figure">
      <div className="kb-demo-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <Panel title="IS 与 FID" series={[{ name: 'IS（越高越好）', f: IS, cls: 'stroke-cond' }, { name: 'FID（越低越好）', f: FID, cls: 'stroke-guided' }]} />
        <Panel title="Precision 与 Recall" series={[{ name: 'Precision', f: PREC, cls: 'stroke-cond' }, { name: 'Recall', f: REC, cls: 'stroke-uncond' }]} />
      </div>
      <figcaption><span className="kb-badge">示意</span>只表示趋势的形状，不是真实实验数据。IS 随 s 基本单调上升；FID 呈 U 形；precision 上升、recall 下降。</figcaption>
    </figure>
  )
}
