import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { DEC_LIP, decLoss, meanGap, steGap } from '../lib/vq'

const W = 560, L = 44, Rr = 14
const TOP = { y: 16, h: 170 }, BOT = { y: 226, h: 80 }, H = 336
const Z0 = 0, Z1 = 3, LY0 = -0.3, LY1 = 2.8, EY = 0.55
const px = (v: number) => L + ((v - Z0) / (Z1 - Z0)) * (W - L - Rr)
const pyT = (v: number) => TOP.y + (1 - (v - LY0) / (LY1 - LY0)) * TOP.h
const pyB = (v: number) => BOT.y + (1 - (v + EY) / (2 * EY)) * BOT.h
const DELTAS = [1, 0.5, 0.25]
const ZE0 = 1.3
const curve = Array.from({ length: 241 }, (_, i) => Z0 + (i * (Z1 - Z0)) / 240)

/** 斜线（理想）梯度和 STE 梯度只差在“在哪里求导”：差别来自量化误差 ε，ε 越小差别越小 */
export function NoiseDemo() {
  const [ze, setZe] = useState(ZE0)
  const [delta, setDelta] = useState(1)
  const g = steGap(ze, delta)
  const codes = Array.from({ length: Math.floor(Z1 / delta) + 1 }, (_, i) => i * delta)
  const tangent = (p: number, slope: number, half = 0.45) =>
    `M${px(p - half)},${pyT(decLoss(p) - slope * half)} L${px(p + half)},${pyT(decLoss(p) + slope * half)}`
  // 锯齿：每个码字的区域内 ε = e_k − z_e 是斜率 −1 的线段
  const saw = codes.map((c) => {
    const a = Math.max(Z0, c - delta / 2), b = Math.min(Z1, c + delta / 2)
    return `M${px(a)},${pyB(c - a)} L${px(b)},${pyB(c - b)}`
  }).join(' ')

  return (
    <Demo
      title="把量化误差看成噪声：直线梯度与 STE 梯度差在哪"
      label="量化误差当噪声"
      hint="上图是解码器损失 $\mathcal{L}(z)$（一维示意）。如果没有量化，$z_q = z_e$（走直线），编码器应该收到 $\mathcal{L}'(z_e)$（灰色切线）；STE 实际交给它的是 $\mathcal{L}'(z_q)$（橙色切线），也就是在被噪声 $\varepsilon$ 推开的位置求导。拖动 $z_e$、换码字间距，看两条切线的差别怎么随 $\varepsilon$ 变化。下图是 $\varepsilon$ 随 $z_e$ 的变化：它其实是锯齿，STE 只是假装它与 $z_e$ 无关。"
      onReset={() => { setZe(ZE0); setDelta(1) }}
      note="$\mathcal{L}(z) = (z - 1.6)^2 + 0.25\sin 4z$ 只是示意，它的导数满足 $|\mathcal{L}''| \le 6$，所以两种梯度之差不超过 $6|\varepsilon|$。“平均差”是 $z_e$ 在 $[0, 3]$ 上均匀取点时 $|\mathcal{L}'(z_q) - \mathcal{L}'(z_e)|$ 的平均。"
    >
      <div className="kb-controls">
        <Seg label="码字间距" value={delta} onChange={setDelta} options={DELTAS.map((d) => ({ value: d, label: `码字间距 ${d}` }))} />
      </div>
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label={`z_e = ${ze.toFixed(2)}，量化到 ${g.zq.toFixed(2)}`}>
          {/* 上：损失曲线与两条切线 */}
          <line className="axis" x1={L} x2={W - Rr} y1={pyT(LY0)} y2={pyT(LY0)} />
          <path d={curve.map((z, i) => `${i ? 'L' : 'M'}${px(z)},${pyT(decLoss(z))}`).join(' ')} fill="none" stroke="var(--c-fdm)" strokeWidth={1.8} />
          {codes.map((c) => <line key={c} x1={px(c)} x2={px(c)} y1={pyT(LY0) - 6} y2={pyT(LY0) + 6} stroke="var(--c-latent)" strokeWidth={2} />)}
          <path d={tangent(ze, g.ideal)} stroke="var(--ink-2)" strokeWidth={2.2} strokeDasharray="6 3" />
          <path d={tangent(g.zq, g.ste)} stroke="var(--c-latent)" strokeWidth={2.4} />
          <line x1={px(ze)} x2={px(ze)} y1={pyT(decLoss(ze))} y2={pyT(LY0)} stroke="var(--ink-3)" strokeDasharray="2 2" />
          <line x1={px(g.zq)} x2={px(g.zq)} y1={pyT(decLoss(g.zq))} y2={pyT(LY0)} stroke="var(--c-latent)" strokeDasharray="2 2" />
          <circle cx={px(ze)} cy={pyT(decLoss(ze))} r={4.5} fill="var(--ink)" />
          <circle cx={px(g.zq)} cy={pyT(decLoss(g.zq))} r={5} fill="var(--c-latent)" stroke="var(--card)" strokeWidth={1.2} />
          {/* ε：从 z_e 指向 z_q 的“噪声” */}
          {Math.abs(g.eps) > 0.02 && (
            <g>
              <line x1={px(ze)} x2={px(g.zq)} y1={pyT(LY0) + 16} y2={pyT(LY0) + 16} stroke="var(--accent)" strokeWidth={1.6} />
              <path d={`M${px(g.zq)},${pyT(LY0) + 16} l${g.eps > 0 ? -6 : 6},-4 v8 z`} fill="var(--accent)" />
            </g>
          )}
          <SvgTex x={(px(ze) + px(g.zq)) / 2} y={pyT(LY0) + 30} w={60} align="middle" size={12} color="var(--accent)"><Tex>{'\\varepsilon'}</Tex></SvgTex>
          <SvgTex x={L + 4} y={TOP.y + 10} w={220} size={11} color="var(--c-fdm)"><Tex>{'\\mathcal{L}(z)'}</Tex></SvgTex>
          <SvgTex x={W - Rr} y={pyT(LY0) + 18} w={40} align="end" size={11}><Tex>{'z'}</Tex></SvgTex>
          <text x={W - Rr} y={TOP.y + 14} textAnchor="end" className="kb-sm-val" fill="var(--c-latent)">橙色刻度：码字</text>
          {/* 下：ε 随 z_e 的锯齿 */}
          <line className="axis" x1={L} x2={W - Rr} y1={pyB(0)} y2={pyB(0)} />
          <path d={saw} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
          <circle cx={px(ze)} cy={pyB(g.eps)} r={4} fill="var(--ink)" />
          <SvgTex x={L - 6} y={pyB(0) + 4} w={36} align="end" size={11}><Tex>{'0'}</Tex></SvgTex>
          <SvgTex x={L + 4} y={BOT.y + 2} w={260} size={11} color="var(--accent)"><Tex>{'\\varepsilon(z_e) = e_k - z_e'}</Tex></SvgTex>
          {[0, 1, 2, 3].map((v) => <text key={v} x={px(v)} y={H - 6} textAnchor="middle" className="kb-sm-val">{v}</text>)}
          <SvgTex x={W - Rr} y={pyB(0) - 8} w={40} align="end" size={11}><Tex>{'z_e'}</Tex></SvgTex>
        </svg>
      </div>
      <Slider label="编码器输出 $z_e$" value={ze} min={0} max={3} step={0.01} onChange={setZe} />
      <div className="kb-table-scroll">
        <table className="kb-num-table kb-nowrap">
          <thead><tr>
            <th><Tex>{'z_q'}</Tex></th><th><Tex>{'\\varepsilon'}</Tex></th>
            <th>直线梯度 <Tex>{"\\mathcal{L}'(z_e)"}</Tex></th><th>STE 梯度 <Tex>{"\\mathcal{L}'(z_q)"}</Tex></th>
            <th>差</th><th>上界 <Tex>{'6|\\varepsilon|'}</Tex></th><th>平均差</th>
          </tr></thead>
          <tbody><tr>
            <td>{g.zq.toFixed(2)}</td><td>{g.eps.toFixed(2)}</td><td>{g.ideal.toFixed(3)}</td><td>{g.ste.toFixed(3)}</td>
            <td>{g.gap.toFixed(3)}</td><td>{(DEC_LIP * Math.abs(g.eps)).toFixed(3)}</td><td>{meanGap(delta).toFixed(3)}</td>
          </tr></tbody>
        </table>
      </div>
    </Demo>
  )
}

