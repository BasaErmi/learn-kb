import { useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { noisedLogDensity, noisedScore, type Comp2D, type Vec2 } from '../lib/gmm2d'
import { alphaBar } from '../lib/schedule'

const COMPS: Comp2D[] = [
  { mean: [-1.6, 0.9], std: 0.35, weight: 0.4, label: 0 },
  { mean: [1.5, 1.1], std: 0.35, weight: 0.3, label: 1 },
  { mean: [0.2, -1.4], std: 0.35, weight: 0.3, label: 2 },
]
const R = 3, RES = 110, ARROWS = 15
const toWorld = (u: number) => -R + 2 * R * u
const PAPER = [255, 253, 248], INK = [36, 104, 184]

export function ScoreFieldDemo() {
  const [t, setT] = useState(0.3)
  const ab = alphaBar(t)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(RES, RES)
    const vals: number[] = []
    for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++)
      vals.push(Math.exp(noisedLogDensity([toWorld((i + 0.5) / RES), toWorld(1 - (j + 0.5) / RES)], COMPS, ab)))
    const max = Math.max(...vals)
    vals.forEach((v, k) => {
      const a = Math.pow(v / max, 0.6) * 0.75
      for (let c = 0; c < 3; c++) img.data[k * 4 + c] = PAPER[c] + (INK[c] - PAPER[c]) * a
      img.data[k * 4 + 3] = 255
    })
    ctx.putImageData(img, 0, 0)
  }, [ab])

  const arrows = useMemo(() => {
    const out: { p: Vec2; d: Vec2; len: number }[] = []
    for (let j = 0; j < ARROWS; j++) for (let i = 0; i < ARROWS; i++) {
      const p: Vec2 = [toWorld((i + 0.5) / ARROWS), toWorld((j + 0.5) / ARROWS)]
      const s = noisedScore(p, COMPS, ab)
      const n = Math.hypot(s[0], s[1]) || 1
      out.push({ p, d: [s[0] / n, s[1] / n], len: Math.min(1, 0.25 + Math.log1p(n) / 3) })
    }
    return out
  }, [ab])

  const cell = 100 / ARROWS
  const sx = (v: number) => ((v + R) / (2 * R)) * 100
  const sy = (v: number) => 100 - ((v + R) / (2 * R)) * 100

  return (
    <Demo
      title="score 向量场：每一点都指向密度更高的方向"
      hint="底色是加噪后的密度 pₜ，箭头是 score 的方向（长度按大小取对数）。t 越大分布被抹得越开，箭头越一致地指向中心，所以从纯噪声出发也有可靠的方向。"
      onReset={() => setT(0.3)}
    >
      <div className="kb-canvas-wrap">
        <canvas ref={canvas} width={RES} height={RES} />
        <svg viewBox="0 0 100 100" aria-label="score 箭头">
          {arrows.map(({ p, d, len }, k) => {
            const x1 = sx(p[0]), y1 = sy(p[1])
            const L = cell * 0.8 * len
            return (
              <g key={k}>
                <line x1={x1} y1={y1} x2={x1 + d[0] * L} y2={y1 - d[1] * L} stroke="var(--c-guided)" strokeWidth={0.5} strokeLinecap="round" />
                <circle cx={x1} cy={y1} r={0.5} fill="var(--c-guided)" />
              </g>
            )
          })}
        </svg>
      </div>
      <Slider label="噪声水平 t" value={t} min={0} max={1} step={0.01} onChange={setT} />
      <div className="kb-demo-readout"><span>ᾱₜ = <b>{ab.toFixed(3)}</b></span><span>t → 0：三个清晰的峰</span><span>t → 1：近似标准高斯</span></div>
    </Demo>
  )
}
