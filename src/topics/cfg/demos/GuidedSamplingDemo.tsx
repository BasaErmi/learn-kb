import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { sampleCFG, sampleStats } from '../lib/cfg'
import { classComps, sampleData, type Comp2D, type Vec2 } from '../lib/gmm2d'
import { mulberry32 } from '../lib/prng'
import { Tex } from '@/kb/components/Tex'

const mk = (label: number, pts: Vec2[]): Comp2D[] => pts.map((mean) => ({ mean, std: 0.28, weight: 1 / 9, label }))
const COMPS: Comp2D[] = [
  ...mk(0, [[-2.4, 1.6], [-1.6, 2.3], [-1.2, 1.2]]),
  ...mk(1, [[1.3, 1.9], [2.2, 2.2], [2.0, 1.1]]),
  ...mk(2, [[-0.6, -1.6], [0.4, -2.2], [1.2, -1.4]]),
]
const CLASSES = ['A', 'B', 'C']
const R = 4.5, SIZE = 520
const PRESETS = [0, 1, 3, 7.5, 12]

export function GuidedSamplingDemo() {
  const [label, setLabel] = useState(0)
  const [s, setS] = useState(1)
  const [showPaths, setShowPaths] = useState(false)
  const ds = useDeferredValue(s)
  const canvas = useRef<HTMLCanvasElement>(null)
  const data = useMemo(() => sampleData(COMPS, 900, mulberry32(11)), [])
  const res = useMemo(() => sampleCFG({ comps: COMPS, label, s: ds, n: 500, steps: 40, seed: 3, keepPaths: 24 }), [label, ds])
  const stats = useMemo(() => sampleStats(res.samples, classComps(COMPS, label)), [res, label])
  // “冲出数据范围”按全部数据判断：s = 0 时落到其他类别不算冲出
  const outside = useMemo(() => sampleStats(res.samples, COMPS).outsideFrac, [res])
  const base = useMemo(() => sampleStats(sampleCFG({ comps: COMPS, label, s: 1, n: 500, steps: 40, seed: 3 }).samples, classComps(COMPS, label)), [label])

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const css = getComputedStyle(document.documentElement)
    const col = (v: string) => css.getPropertyValue(v).trim()
    const px = (v: number) => ((v + R) / (2 * R)) * SIZE
    const py = (v: number) => SIZE - ((v + R) / (2 * R)) * SIZE
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = col('--card'); ctx.fillRect(0, 0, SIZE, SIZE)
    for (const d of data) {
      const own = d.label === label
      ctx.fillStyle = own ? col('--c-cond') : col('--c-data')
      ctx.globalAlpha = own ? 0.3 : 0.45
      ctx.beginPath(); ctx.arc(px(d.x[0]), py(d.x[1]), 2.4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (showPaths) {
      ctx.strokeStyle = col('--c-guided'); ctx.globalAlpha = 0.35; ctx.lineWidth = 1
      for (const path of res.paths) {
        ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo(px(p[0]), py(p[1])) : ctx.moveTo(px(p[0]), py(p[1])))); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = col('--c-guided'); ctx.strokeStyle = col('--card'); ctx.lineWidth = 1
    for (const p of res.samples) {
      if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue
      ctx.beginPath(); ctx.arc(px(p[0]), py(p[1]), 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    }
    ctx.font = '600 15px "IBM Plex Sans", sans-serif'; ctx.fillStyle = col('--ink-2'); ctx.textAlign = 'center'
    CLASSES.forEach((c, k) => {
      const cs = COMPS.filter((cc) => cc.label === k)
      const cx = cs.reduce((a, cc) => a + cc.mean[0], 0) / cs.length, cy = Math.max(...cs.map((cc) => cc.mean[1]))
      ctx.fillText(`类 ${c}`, px(cx), py(cy) - 22)
    })
  }, [res, data, label, showPaths])

  return (
    <Demo
      title="在二维数据上真实地跑一遍 CFG 采样"
      hint="三类数据，每类由三个小簇组成（浅色点）。用真实的 CFG 公式 + DDIM 采样 500 个点（橙色）。拖动 $s$：先变得更集中、更“典型”，再往后多样性丢失，样本冲出数据范围。"
      onReset={() => { setLabel(0); setS(1); setShowPaths(false) }}
    >
      <div className="kb-demo-grid">
        <div className="kb-canvas-wrap"><canvas ref={canvas} width={SIZE} height={SIZE} aria-label="采样结果" /></div>
        <div className="kb-demo-readout" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.7rem' }}>
          <span>目标类别</span>
          <div className="kb-presets">
            {CLASSES.map((c, i) => (
              <button key={c} type="button" className="kb-chip" aria-pressed={label === i} onClick={() => setLabel(i)}>类 {c}</button>
            ))}
          </div>
          <span>类内散度：<b>{stats.spread.toFixed(2)}</b>（<Tex>{'s = 1'}</Tex> 时 {base.spread.toFixed(2)}）</span>
          <span>冲出数据范围：<b>{(outside * 100).toFixed(1)}%</b></span>
          <label><input type="checkbox" checked={showPaths} onChange={(e) => setShowPaths(e.target.checked)} /> 显示 24 条采样轨迹</label>
        </div>
      </div>
      <Slider label="guidance $s$" value={s} min={0} max={12} step={0.5} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="kb-chip" aria-pressed={s === p} aria-label={`s = ${p}`} onClick={() => setS(p)}><Tex>{`s = ${p}`}</Tex></button>
        ))}
      </div>
      <div className="kb-legend">
        <span><i className="bg-cond" />目标类的真实数据</span>
        <span><i style={{ background: 'var(--c-data)' }} />其他类</span>
        <span><i className="bg-guided" />CFG 采样结果</span>
      </div>
    </Demo>
  )
}
