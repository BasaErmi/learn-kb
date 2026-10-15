import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { classifierGradStrength } from '../lib/toy1d'

type P = [number, number]
const W = 560, H = 210, M = { l: 40, r: 12, t: 16, b: 44 }

export function GradStrengthChart() {
  const { review } = useReviewMode()
  const pts = useMemo(() => Array.from({ length: 99 }, (_, i) => { const t = (i + 1) / 100; return [t, classifierGradStrength(t)] as P }), [])
  if (review) return null
  const peak = pts.reduce((a, b) => (b[1] > a[1] ? b : a))
  const x = scaleLinear().domain([0, 1]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, peak[1] * 1.2]).range([H - M.b, M.t])
  const d = line<P>().x((p) => x(p[0])).y((p) => y(p[1]))(pts) ?? ''
  return (
    <figure className="kb-figure">
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="分类器梯度强度随噪声水平的变化">
        <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
        <line className="axis" x1={M.l} x2={M.l} y1={M.t} y2={y(0)} />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={x(t)} y={y(0) + 14} textAnchor="middle">{t}</text>
        ))}
        <path d={d} className="stroke-cond" />
        <circle cx={x(peak[0])} cy={y(peak[1])} r={4} fill="var(--c-cond)" stroke="var(--card)" strokeWidth={2} />
        <SvgTex x={x(peak[0])} y={y(peak[1]) - 9} w={180} align="middle" size={12} color="var(--ink-2)">中段最强（<Tex>{`t \\approx ${peak[0].toFixed(2)}`}</Tex>）</SvgTex>
        <SvgTex x={M.l} y={H - 4} w={280} size={12} color="var(--ink-3)">← <Tex>{'t \\to 0'}</Tex>：图像清晰，分类器已确定，梯度 ≈ 0</SvgTex>
        <SvgTex x={W - M.r} y={H - 4} w={240} align="end" size={12} color="var(--ink-3)"><Tex>{'t \\to 1'}</Tex>：几乎纯噪声，看不出类别 →</SvgTex>
        <g transform={`rotate(-90 12 ${M.t})`}><SvgTex x={12} y={M.t + 4} w={150} align="end" size={12} color="var(--ink-3)"><Tex>{'\\mathbb{E}\\,\\lvert \\nabla \\log p_t(y \\mid x_t) \\rvert'}</Tex></SvgTex></g>
      </svg>
      <figcaption>一维双类玩具模型（类别 ±1、类内标准差 0.2）上的真实计算：guidance 主要在采样的中间阶段起作用。</figcaption>
    </figure>
  )
}
