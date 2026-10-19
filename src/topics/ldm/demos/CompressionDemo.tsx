import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { compression } from '../lib/ldm'

const FS = [1, 2, 4, 8, 16, 32]
const CS = [3, 4, 8, 16]

/** 左：局部 32×32 像素，蓝框是一个 latent 位置覆盖的 f×f 像素；右：同一块区域在 latent 里的样子，c 个通道叠在一起 */
function Grids({ f, c }: { f: number; c: number }) {
  const side = 200, px = side / 32
  const lat = Math.max(1, 32 / f) // 这块区域对应的 latent 边长（f = 32 时只有 1 个位置）
  const layers = Math.min(c, 16), sz = 150, gap = 4
  return (
    <div className="kb-svg-scroll">
      <svg viewBox="0 0 600 250" className="kb-chart" role="img" aria-label={`像素与 latent 网格对比，f=${f}，c=${c}`}>
        <g transform="translate(20,10)">
          {Array.from({ length: 33 }, (_, i) => (
            <g key={i}>
              <line x1={i * px} x2={i * px} y1={0} y2={side} stroke="var(--rule)" />
              <line y1={i * px} y2={i * px} x1={0} x2={side} stroke="var(--rule)" />
            </g>
          ))}
          {Array.from({ length: lat + 1 }, (_, i) => (
            <g key={i}>
              <line x1={(i * side) / lat} x2={(i * side) / lat} y1={0} y2={side} stroke="var(--c-cond)" strokeWidth={1.6} />
              <line y1={(i * side) / lat} y2={(i * side) / lat} x1={0} x2={side} stroke="var(--c-cond)" strokeWidth={1.6} />
            </g>
          ))}
          <text x={0} y={side + 22}>{`像素：32×32×3 的一块`}</text>
        </g>
        <line x1={245} x2={300} y1={110} y2={110} className="axis" />
        <SvgTex x={272} y={104} w={40} align="middle" size={14}><Tex>{'\\mathcal{E}'}</Tex></SvgTex>
        <g transform={`translate(${330 + (layers - 1) * gap},${10 + (side - sz) / 2})`}>
          {Array.from({ length: layers }, (_, k) => {
            const o = -(layers - 1 - k) * gap
            const front = k === layers - 1
            return (
              <g key={k} transform={`translate(${o},${o})`}>
                <rect width={sz} height={sz} fill={front ? 'color-mix(in srgb, var(--c-cond) 14%, var(--card))' : 'var(--card)'} stroke="var(--c-cond)" strokeWidth={1} />
                {front && Array.from({ length: lat - 1 }, (_, i) => (
                  <g key={i}>
                    <line x1={((i + 1) * sz) / lat} x2={((i + 1) * sz) / lat} y1={0} y2={sz} stroke="var(--c-cond)" strokeOpacity={0.45} />
                    <line y1={((i + 1) * sz) / lat} y2={((i + 1) * sz) / lat} x1={0} x2={sz} stroke="var(--c-cond)" strokeOpacity={0.45} />
                  </g>
                ))}
              </g>
            )
          })}
        </g>
        <text x={330 - 20} y={side + 32}>{`latent：${lat}×${lat}×${c}${c > 16 ? '（只画 16 层）' : ''}`}</text>
      </svg>
    </div>
  )
}

export function CompressionDemo() {
  const [f, setF] = useState(8)
  const [c, setC] = useState(4)
  const r = compression(256, f, c)
  return (
    <Demo
      title="第一阶段压缩了多少：调 $f$ 和 $c$"
      label="压缩计算器：调 f 和 c"
      hint="$f$ 是边长缩小的倍数，$c$ 是 latent 的通道数。左边是图像里 32×32 的一块，蓝框是一个 latent 位置覆盖的像素范围；右边是这块区域对应的 latent。"
      onReset={() => { setF(8); setC(4) }}
    >
      <div className="kb-controls kb-controls-row">
        <Seg label="下采样倍率 f" value={f} onChange={setF} options={FS.map((v) => ({ value: v, label: <Tex>{`f = ${v}`}</Tex>, aria: `f = ${v}` }))} />
        <Seg label="通道数 c" value={c} onChange={setC} options={CS.map((v) => ({ value: v, label: <Tex>{`c = ${v}`}</Tex>, aria: `c = ${v}` }))} />
      </div>
      <Grids f={f} c={c} />
      <p className="kb-demo-readout">
        <span>下采样次数 <Tex>{`\\log_2 f = ${r.downsamples}`}</Tex></span>
        <span>压缩率 <Tex>{'\\frac{3f^2}{c}'}</Tex> = <b>{r.ratio >= 10 ? r.ratio.toFixed(0) : r.ratio.toFixed(2)}</b></span>
      </p>
    </Demo>
  )
}
