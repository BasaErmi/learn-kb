import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { area, line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { sharpenCurve, sharpenWeights } from '../lib/sharpen'

type P = [number, number]
const XS = Array.from({ length: 241 }, (_, i) => -4 + (i * 8) / 240)
// p(x)：同属“金毛”类的图片在“典型程度”轴上的分布——右边是典型正脸照，左边是远景、遮挡、模糊照
const PX = XS.map((x) => 0.65 * Math.exp(-((x - 0.8) ** 2) / 0.9) + 0.35 * Math.exp(-((x + 1.6) ** 2) / 1.4))
// p(y|x)：越靠右越“像金毛”
const PYX = XS.map((x) => 1 / (1 + Math.exp(-1.8 * x)))
const W = 560, H = 220, M = { l: 12, r: 12, t: 10, b: 34 }
const PRESETS = [0, 1, 2, 4, 8]
const S_MAX = 10
// 纵轴固定为 s 最大时的峰高：随 s 自动缩放会让虚线（s = 1）看起来也在变
const Y_MAX = Math.max(...sharpenCurve(XS, PX, PYX, S_MAX)) * 1.08

export function SharpenDemo() {
  const [s, setS] = useState(1)
  const curve = useMemo(() => sharpenCurve(XS, PX, PYX, s), [s])
  const ref = useMemo(() => sharpenCurve(XS, PX, PYX, 1), [])
  const [wA, wB] = sharpenWeights([0.9, 0.3], s)
  const x = scaleLinear().domain([-4, 4]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, Y_MAX]).range([H - M.b, M.t])
  const pts = (ys: number[]) => XS.map((v, i) => [v, ys[i]] as P)
  const areaPath = area<P>().x((d) => x(d[0])).y0(y(0)).y1((d) => y(d[1]))(pts(curve)) ?? ''
  const refPath = line<P>().x((d) => x(d[0])).y((d) => y(d[1]))(pts(ref)) ?? ''
  const ratio = 3 ** s

  return (
    <Demo
      title="锐化：从 $p(x)\,p(y \mid x)^s$ 采样"
      label="锐化：从 p(x)·p(y|x)^s 采样"
      hint="拖动 $s$：$s = 0$ 时忽略类别，$s = 1$ 是真实条件分布（虚线），$s > 1$ 时概率向“更像金毛”的一侧集中。"
      onReset={() => setS(1)}
    >
      <div className="kb-demo-grid">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="锐化后的分布">
          <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
          <path d={refPath} className="stroke-ref" />
          <path d={areaPath} className="fill-guided" />
          <text x={M.l} y={H - 10}>← 远景、遮挡、模糊（不太像）</text>
          <text x={W - M.r} y={H - 10} textAnchor="end">典型正脸照（很像）→</text>
        </svg>
        <div className="kb-bars" aria-label="两张图归一化后的概率">
          {([['A', '很像金毛', 0.9, wA, 'bg-cond'], ['B', '不太像', 0.3, wB, 'bg-uncond']] as const).map(([k, desc, p, w, cls]) => (
            <div className="kb-bar-row" key={k}>
              <span>图 {k} · {desc}<small><Tex>{`p(y \\mid x) = ${p}`}</Tex></small></span>
              <div className="kb-bar-track"><div className={cls} style={{ width: `${w * 100}%` }} /></div>
              <span className="kb-bar-val">{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
          <p className="kb-demo-note">
            A : B = <Tex>{`3^{${s.toFixed(1)}}`}</Tex> = {ratio < 1000 ? ratio.toFixed(1) : Math.round(ratio).toLocaleString()} : 1
          </p>
        </div>
      </div>
      <Slider label="guidance $s$" value={s} min={0} max={S_MAX} step={0.1} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="kb-chip" aria-pressed={s === p} aria-label={`s = ${p}`} onClick={() => setS(p)}><Tex>{`s = ${p}`}</Tex></button>
        ))}
      </div>
    </Demo>
  )
}
