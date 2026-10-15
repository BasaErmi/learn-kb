import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { magnetEps, magnetLogDensity, magnetPosterior, magnetPull, magnetScore, type Pt } from '../lib/magnet2d'
import { alphaBar } from '../lib/schedule'

// 7 个数据点，分三簇：左上 A–C、右上 D–E、下方 F–G
const PTS: Pt[] = [[-1.8, 1.2], [-1.2, 1.7], [-1.5, 0.5], [1.3, 1.4], [2.0, 0.6], [0.7, -1.6], [-0.3, -1.9]]
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const XT0: Pt = [0.6, 0.3], T0 = 0.45
const R = 3, RES = 120
const PAPER = [255, 253, 248], INK = [185, 177, 162]
const sx = (v: number) => ((v + R) / (2 * R)) * 100
const sy = (v: number) => 100 - ((v + R) / (2 * R)) * 100
const clamp = (v: number) => Math.max(-R, Math.min(R, v))
const vec = (p: Pt, d = 2) => `(${p[0].toFixed(d)}, ${p[1].toFixed(d)})`

export function MagnetDemo() {
  const [xt, setXt] = useState<Pt>(XT0)
  const [t, setT] = useState(T0)
  const ab = alphaBar(t), r = Math.sqrt(ab)
  const uid = useId().replace(/:/g, '')
  const canvas = useRef<HTMLCanvasElement>(null)

  // 底色：加噪后的混合密度 pₜ，t 越大越“抹开”、越往原点收缩
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(RES, RES)
    const vals: number[] = []
    for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++)
      vals.push(Math.exp(magnetLogDensity([-R + (2 * R * (i + 0.5)) / RES, R - (2 * R * (j + 0.5)) / RES], PTS, ab)))
    const max = Math.max(...vals)
    vals.forEach((v, k) => {
      const a = Math.pow(v / max, 0.7) * 0.8
      for (let c = 0; c < 3; c++) img.data[k * 4 + c] = PAPER[c] + (INK[c] - PAPER[c]) * a
      img.data[k * 4 + 3] = 255
    })
    ctx.putImageData(img, 0, 0)
  }, [ab])

  const w = magnetPosterior(xt, PTS, ab)
  const pulls = PTS.map((p) => magnetPull(xt, p, ab))
  const eps = PTS.map((p) => magnetEps(xt, p, ab))
  const score = magnetScore(xt, PTS, ab)
  const epsBar = eps.reduce<Pt>((a, e, i) => [a[0] + w[i] * e[0], a[1] + w[i] * e[1]], [0, 0])
  // 加噪后每个来源的中心是 √ᾱₜ·x₀，磁铁画在这里
  const centers = PTS.map(([a, b]): Pt => [r * a, r * b])
  // 箭头统一乘 (1−ᾱₜ)：拉力正好指到 √ᾱₜ·x₀，score 正好指到它们的加权重心 √ᾱₜ·E[x₀|xₜ]
  const mean: Pt = [xt[0] + (1 - ab) * score[0], xt[1] + (1 - ab) * score[1]]

  const place = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setXt([clamp(-R + (2 * R * (e.clientX - r.left)) / r.width), clamp(R - (2 * R * (e.clientY - r.top)) / r.height)])
  }
  const onKey = (e: KeyboardEvent) => {
    const d: Record<string, Pt> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }
    if (!d[e.key]) return
    e.preventDefault()
    setXt(([a, b]) => [clamp(a + d[e.key][0]), clamp(b + d[e.key][1])])
  }

  return (
    <Demo
      title="score 是所有来源“拉力”的加权平均"
      hint="7 个数据点 A–G（空心圈），$x_t = \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\epsilon$，所以每个来源加噪后的中心是 $\sqrt{\bar\alpha_t}\,x_0$（实心点）。在图上拖动 $x_t$、调节噪声水平 $t$：线越粗的来源后验权重越大。所有箭头都乘了 $1-\bar\alpha_t$，于是每条拉力正好指到对应的实心点，橙色的 score 箭头正好指到它们的加权重心。"
      onReset={() => { setXt(XT0); setT(T0) }}
    >
      <div className="kb-demo-grid">
        <div className="kb-canvas-wrap">
          <canvas ref={canvas} width={RES} height={RES} />
          <svg
            viewBox="0 0 100 100"
            className="kb-magnet"
            role="img"
            aria-label="二维磁铁示意：拖动 xₜ"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); place(e) }}
            onPointerMove={(e) => { if (e.buttons) place(e) }}
          >
            <defs>
              <marker id={`${uid}-g`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--c-guided)" />
              </marker>
            </defs>
            {PTS.map((p, i) => (
              <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={1.1} fill="none" stroke="var(--ink-3)" strokeWidth={0.35} opacity={0.7} />
            ))}
            {centers.map((p, i) => (
              <line key={i} x1={sx(xt[0])} y1={sy(xt[1])} x2={sx(p[0])} y2={sy(p[1])}
                stroke="var(--c-cond)" strokeWidth={0.25 + 1.6 * w[i]} opacity={0.15 + 0.85 * w[i]} strokeLinecap="round" />
            ))}
            {centers.map((p, i) => (
              <g key={i}>
                <circle cx={sx(p[0])} cy={sy(p[1])} r={1.3 + 3.2 * Math.sqrt(w[i])} fill="var(--c-cond)" opacity={0.35 + 0.65 * Math.sqrt(w[i])} stroke="var(--card)" strokeWidth={0.5} />
                <text x={sx(p[0])} y={sy(p[1]) - 2.6 - 3.2 * Math.sqrt(w[i])} textAnchor="middle" className="kb-magnet-label">
                  {NAMES[i]}{w[i] >= 0.03 ? ` ${(w[i] * 100).toFixed(0)}%` : ''}
                </text>
              </g>
            ))}
            <line x1={sx(xt[0])} y1={sy(xt[1])} x2={sx(mean[0])} y2={sy(mean[1])}
              stroke="var(--c-guided)" strokeWidth={1.1} markerEnd={`url(#${uid}-g)`} strokeLinecap="round" />
            <circle cx={sx(mean[0])} cy={sy(mean[1])} r={1.4} fill="none" stroke="var(--c-guided)" strokeWidth={0.6} />
            <circle cx={sx(xt[0])} cy={sy(xt[1])} r={2.2} className="kb-magnet-handle" tabIndex={0}
              role="button" aria-label={`xₜ 位置 ${vec(xt)}，用方向键移动`} onKeyDown={onKey} />
            <text x={sx(xt[0]) + 3} y={sy(xt[1]) + 5.5} className="kb-magnet-label is-math">x<tspan dy={1} fontSize={2.6}>t</tspan></text>
          </svg>
        </div>
        <div className="kb-magnet-side">
          <p className="kb-demo-note">
            <Tex>x_t</Tex> = <b>{vec(xt)}</b>，<Tex>{'\\bar\\alpha_t'}</Tex> = <b>{ab.toFixed(3)}</b>
          </p>
          <p className="kb-demo-note">
            <span className="kb-swatch" style={{ background: 'var(--c-cond)' }} />各来源的拉力 × <Tex>{'(1-\\bar\\alpha_t)'}</Tex>：从 <Tex>x_t</Tex> 指向 <Tex>{'\\sqrt{\\bar\\alpha_t}\\,x_0'}</Tex>
          </p>
          <p className="kb-demo-note">
            <span className="kb-swatch" style={{ background: 'var(--c-guided)' }} />score × <Tex>{'(1-\\bar\\alpha_t)'}</Tex>：指向加权重心 <Tex>{'\\sqrt{\\bar\\alpha_t}\\,\\mathbb{E}[x_0 \\mid x_t]'}</Tex> = {vec(mean)}
          </p>
          <p className="kb-demo-note"><Tex>t</Tex> 小：几乎只剩最近的来源；<Tex>t</Tex> 大：各中心向原点收缩、权重趋于平均，score 指向整体重心。</p>
        </div>
      </div>
      <Slider label="噪声水平 $t$" value={t} min={0.05} max={0.95} step={0.01} onChange={setT} />
      <div className="kb-table-scroll">
      <table className="kb-num-table kb-nowrap">
        <thead><tr><th>来源</th><th>后验 <Tex>{'q(x_0 \\mid x_t)'}</Tex></th><th>噪声 <Tex>{'\\epsilon = \\dfrac{x_t - \\sqrt{\\bar\\alpha_t}\\,x_0}{\\sqrt{1-\\bar\\alpha_t}}'}</Tex></th><th>拉力 <Tex>{'\\nabla_{x_t} \\log q(x_t \\mid x_0) = -\\dfrac{\\epsilon}{\\sqrt{1-\\bar\\alpha_t}}'}</Tex></th></tr></thead>
        <tbody>
          {PTS.map((p, i) => (
            <tr key={i}><td>{NAMES[i]}</td><td>{(w[i] * 100).toFixed(1)}%</td><td>{vec(eps[i])}</td><td>{vec(pulls[i])}</td></tr>
          ))}
          <tr className="is-total"><td>加权平均</td><td>100%</td><td><Tex>{'\\mathbb{E}[\\epsilon \\mid x_t]'}</Tex><br />{vec(epsBar, 3)}</td><td><Tex>{'\\nabla_{x_t} \\log p_t(x_t)'}</Tex><br />{vec(score, 3)}</td></tr>
        </tbody>
      </table>
      </div>
      <p className="kb-demo-note">检验事实 2：<Tex>{'-\\frac{\\mathbb{E}[\\epsilon \\mid x_t]}{\\sqrt{1-\\bar\\alpha_t}}'}</Tex> = {vec([-epsBar[0] / Math.sqrt(1 - ab), -epsBar[1] / Math.sqrt(1 - ab)], 3)}，和 score 一致。</p>
    </Demo>
  )
}
