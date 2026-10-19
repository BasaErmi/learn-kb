import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { patchify } from '../lib/ldm'

const I = 32, C = 4

export function PatchifyDemo() {
  const [p, setP] = useState(2)
  const [hot, setHot] = useState(0)
  const { tokens, patchDim } = patchify(I, C, p)
  const n = I / p, S = 256, cell = S / I
  const hx = hot % n, hy = Math.floor(hot / n)
  return (
    <Demo
      title="DiT 的 patchify：$p$ 决定 token 数"
      label="patchify：p 决定 token 数"
      hint="把 $32\times32\times4$ 的 latent 切成 $p\times p$ 的小块，每块展平后线性映射成一个 token。点击任意 patch 高亮它。"
      onReset={() => { setP(2); setHot(0) }}
    >
      <Seg label="patch 大小" value={p} onChange={(v) => { setP(v); setHot(0) }} options={[2, 4, 8].map((v) => ({ value: v, label: <Tex>{`p = ${v}`}</Tex>, aria: `p = ${v}` }))} />
      <div className="kb-demo-grid">
        <svg viewBox={`0 0 ${S + 2} ${S + 2}`} className="kb-chart" role="img" aria-label={`切成 ${tokens} 个 patch`} style={{ maxWidth: 300 }}>
          {Array.from({ length: I * I }, (_, i) => (
            <rect key={i} x={1 + (i % I) * cell} y={1 + Math.floor(i / I) * cell} width={cell - 0.6} height={cell - 0.6} fill="color-mix(in srgb, var(--c-data) 30%, var(--card))" />
          ))}
          {Array.from({ length: tokens }, (_, i) => (
            <rect key={i} x={1 + (i % n) * p * cell} y={1 + Math.floor(i / n) * p * cell} width={p * cell} height={p * cell} fill={i === hot ? 'color-mix(in srgb, var(--c-guided) 45%, transparent)' : 'transparent'} stroke="var(--c-cond)" strokeWidth={1.2} onClick={() => setHot(i)} style={{ cursor: 'pointer' }} />
          ))}
        </svg>
        <div className="kb-demo-readout" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span>token 数 <Tex>{'T = \\left(\\frac{I}{p}\\right)^2'}</Tex> = <b>{tokens}</b></span>
          <span>每个 patch 的原始维度 <Tex>{'p^2 C'}</Tex> = <b>{patchDim}</b></span>
          <span>高亮的 patch：第 {hy + 1} 行第 {hx + 1} 列，展平成 {patchDim} 维再映射到 <Tex>d</Tex> 维</span>
          <span>等价于 <code>{`Conv2d(4, d, kernel_size=${p}, stride=${p})`}</code></span>
          <span>注意力矩阵 <Tex>{'T^2'}</Tex> = <b>{(tokens * tokens).toLocaleString('en-US')}</b>；<Tex>p</Tex> 减半，token 数变 4 倍</span>
        </div>
      </div>
    </Demo>
  )
}
