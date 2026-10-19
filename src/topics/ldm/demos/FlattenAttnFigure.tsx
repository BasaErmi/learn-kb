import type { ReactNode } from 'react'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { crossAttnSize, selfAttnSize, transformerParams } from '../lib/ldm'
import { wan } from '../lib/img'

const LEVELS = [
  { res: 64, C: 320 },
  { res: 32, C: 640 },
  { res: 16, C: 1280 },
]
const HEADS = 8

/** 展平示意 + SD 1.x 各层级注意力规模与参数量对照表 */
export function FlattenAttnFigure() {
  const g = 8
  const shade = (i: number) => `color-mix(in srgb, var(--c-cond) ${12 + ((i * 37) % 50)}%, var(--card))`
  const rows: { label: ReactNode; f: (l: (typeof LEVELS)[number]) => string }[] = [
    { label: <>token 数 <Tex>{'N = H\'W\''}</Tex></>, f: (l) => (l.res * l.res).toLocaleString('en-US') },
    { label: <>self-attention 矩阵 <Tex>{'N\\times N'}</Tex>（每个头）</>, f: (l) => wan(selfAttnSize(l.res ** 2)) },
    { label: <>cross-attention 矩阵 <Tex>{'N\\times 77'}</Tex></>, f: (l) => wan(crossAttnSize(l.res ** 2, 77)) },
    { label: <>self-attention 显存（8 头，fp16）</>, f: (l) => { const mb = (selfAttnSize(l.res ** 2) * HEADS * 2) / 2 ** 20; return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB` } },
    { label: <><code>proj_in</code> + <code>proj_out</code>：<Tex>{'2C^2'}</Tex></>, f: (l) => wan(transformerParams(l.C).proj) },
    { label: <>self-attention：<Tex>{'4C^2'}</Tex></>, f: (l) => wan(transformerParams(l.C).self) },
    { label: <>cross-attention：<Tex>{'2C^2 + 2\\cdot 768\\cdot C'}</Tex></>, f: (l) => wan(transformerParams(l.C).cross) },
    { label: <>FFN（GEGLU）：<Tex>{'12C^2'}</Tex></>, f: (l) => wan(transformerParams(l.C).ffn) },
  ]
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox="0 0 640 130" className="kb-chart" role="img" aria-label="特征图展平成 token 序列">
          {Array.from({ length: g * g }, (_, i) => <rect key={i} x={20 + (i % g) * 13} y={8 + Math.floor(i / g) * 13} width={11} height={11} rx={2} fill={shade(i)} />)}
          <SvgTex x={20} y={126} w={160} size={11} color="var(--ink-3)">特征图 <Tex>{"H'\\times W'\\times C"}</Tex></SvgTex>
          <line x1={140} x2={196} y1={60} y2={60} className="axis" />
          <text x={168} y={52} textAnchor="middle">展平</text>
          {Array.from({ length: 28 }, (_, i) => <rect key={i} x={208 + i * 14} y={48} width={12} height={22} rx={2} fill={shade(i)} />)}
          <text x={610} y={64} textAnchor="end">…</text>
          <SvgTex x={208} y={98} w={400} size={11} color="var(--ink-3)">每个空间位置是一个 token，向量维度是通道数 <Tex>C</Tex></SvgTex>
        </svg>
      </div>
      <div className="kb-table-scroll">
        <table className="kb-num-table kb-nowrap kb-label-col">
          <thead><tr><th>SD 1.x 生成 512×512</th>{LEVELS.map((l) => <th key={l.res}>{l.res}×{l.res}，<Tex>{`C = ${l.C}`}</Tex></th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}><td>{r.label}</td>{LEVELS.map((l) => <td key={l.res}>{r.f(l)}</td>)}</tr>)}
            <tr className="is-total"><td>一个 Transformer block 合计</td>{LEVELS.map((l) => <td key={l.res}>{wan(transformerParams(l.C).total)}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <figcaption>由层级和通道数直接算出。显存按 fp16、8 个头、batch 为 1、只存一层的注意力矩阵估算；实际实现会用 FlashAttention 等方法避免把整个矩阵存下来。SD 1.x 的 8×8 层级（1280 通道）没有注意力模块，表中略去。</figcaption>
    </figure>
  )
}
