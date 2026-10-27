import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { useReviewMode } from '@/kb/state/ReviewMode'
import type { ReactNode } from 'react'
import { Tex, TexText } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { logSumExp, softmax } from '../lib/softmax'

type P = [number, number]
const W = 560, H = 236, PW = 262, M = { l: 30, r: 8, t: 26, b: 40 }
const XS = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05)
// 两个 logit (x, 0)：左图 T·LSE((x, 0)/T) 对比 max(x, 0)，右图它对 x 的导数 softmax_1 = σ(x/T) 对比阶跃
const TS = [
  { T: 1, cls: 'stroke-exp', color: 'var(--c-exp)' },
  { T: 0.5, cls: 'stroke-prob', color: 'var(--c-prob)' },
  { T: 0.2, cls: 'stroke-grad', color: 'var(--c-grad)' },
]

function Panel({ ox, yMax, f, hard, ylabel, ticks }: { ox: number; yMax: number; f: (x: number, T: number) => number; hard: (x: number) => number; ylabel: ReactNode; ticks: number[] }) {
  const x = scaleLinear().domain([-4, 4]).range([ox + M.l, ox + PW - M.r])
  const y = scaleLinear().domain([0, yMax]).range([H - M.b, M.t])
  const path = (g: (v: number) => number) => line<P>().x((d) => x(d[0])).y((d) => y(d[1]))(XS.map((v) => [v, g(v)] as P)) ?? ''
  return (
    <g>
      <line className="axis" x1={x(-4)} x2={x(4)} y1={y(0)} y2={y(0)} />
      <line className="axis" x1={x(0)} x2={x(0)} y1={y(0)} y2={M.t - 6} />
      {[-4, -2, 0, 2, 4].map((v) => <text key={v} x={x(v)} y={y(0) + 14} textAnchor="middle">{v}</text>)}
      {ticks.map((v) => <text key={v} x={x(-4) - 5} y={y(v) + 4} textAnchor="end">{v}</text>)}
      <path d={path(hard)} className="stroke-ref" />
      {TS.map(({ T, cls }) => <path key={T} d={path((v) => f(v, T))} className={cls} />)}
      <SvgTex x={ox + PW / 2 + 10} y={H - 6} w={60} align="middle" size={12} color="var(--ink-3)"><Tex>{'x'}</Tex></SvgTex>
      <SvgTex x={ox + M.l} y={M.t - 8} w={PW - 20} size={12} color="var(--ink-2)">{ylabel}</SvgTex>
    </g>
  )
}

export function LseFigure() {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="log-sum-exp 与 max、softmax 与阶跃函数的对比">
          <Panel ox={0} yMax={4.2} ticks={[0, 2, 4]} f={(v, T) => T * logSumExp([v / T, 0])} hard={(v) => Math.max(v, 0)} ylabel={<><Tex>{'T \\cdot \\text{LSE}\\big(\\frac{(x, 0)}{T}\\big)'}</Tex> 与 <Tex>{'\\max(x, 0)'}</Tex></>} />
          <Panel ox={W - PW} yMax={1.05} ticks={[0, 0.5, 1]} f={(v, T) => softmax([v, 0], T)[0]} hard={(v) => (v > 0 ? 1 : v < 0 ? 0 : 0.5)} ylabel={<><Tex>{'p_1 = \\sigma\\big(\\frac{x}{T}\\big)'}</Tex> 与 argmax 的第 1 位</>} />
        </svg>
      </div>
      <div className="kb-legend">
        <span><i style={{ background: 'none', borderTop: '2px dashed var(--ink-3)', borderRadius: 0, height: 0, width: 14, verticalAlign: 3 }} />虚线：<Tex>{'\\max'}</Tex> / argmax（硬）</span>
        {TS.map(({ T, color }) => <span key={T}><i style={{ background: color }} /><Tex>{`T = ${T}`}</Tex></span>)}
      </div>
      <figcaption>
        <TexText>{'只有两个 logit $(x, 0)$ 时的精确计算。左：$T \\cdot \\text{LSE}$ 把 $\\max$ 的折角磨圆，$T$ 越小越贴近折线，两者之差最多是 $T \\log 2$。右：左图曲线对 $x$ 的导数，正是 softmax 的第一个分量 $\\sigma\\big(\\frac{x}{T}\\big)$；$T \\to 0$ 时它变成 argmax 的阶跃。'}</TexText>
      </figcaption>
    </figure>
  )
}
