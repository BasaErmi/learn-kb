import { useId, useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { area } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { mixtureLogDensity, mixturePosterior, mixtureScore } from '../lib/mixture1d'

type P = [number, number]
const CENTERS = [1, -1]
const W = 560, H = 250, M = { l: 16, r: 16 }
const XS = Array.from({ length: 201 }, (_, i) => -4 + (i * 8) / 200)
const ROLE = ['cond', 'uncond', 'guided'] as const

export function MagnetDemo() {
  const [xt, setXt] = useState(1.5)
  const [sigma, setSigma] = useState(1)
  const uid = useId().replace(/:/g, '')
  const post = mixturePosterior(xt, CENTERS, sigma)
  const pulls = CENTERS.map((c) => -(xt - c) / sigma ** 2)
  const eps = CENTERS.map((c) => (xt - c) / sigma)
  const score = mixtureScore(xt, CENTERS, sigma)
  const epsBar = post[0] * eps[0] + post[1] * eps[1]

  const x = scaleLinear().domain([-4, 4]).range([M.l, W - M.r]).clamp(true)
  const dens = useMemo(() => XS.map((v) => Math.exp(mixtureLogDensity(v, CENTERS, sigma))), [sigma])
  const y = scaleLinear().domain([0, Math.max(...dens) * 1.1]).range([110, 14])
  const densPath = area<P>().x((d) => x(d[0])).y0(110).y1((d) => y(d[1]))(XS.map((v, i) => [v, dens[i]] as P)) ?? ''
  // 箭头长度：每单位 score 画 0.5 个数据单位
  const tip = (d: number) => x(xt + d * 0.5)

  const rows = [
    { label: 'x₀ = +1 的拉力', d: pulls[0], y: 152, op: 0.25 + 0.75 * post[0] },
    { label: 'x₀ = −1 的拉力', d: pulls[1], y: 180, op: 0.25 + 0.75 * post[1] },
    { label: '加权平均 = score', d: score, y: 216, op: 1 },
  ]

  return (
    <Demo
      title="score 是所有来源“拉力”的加权平均"
      hint="数据只有 ±1 两个点，xₜ = x₀ + σ·ε。拖动 xₜ 和噪声 σ：离 xₜ 越近的来源后验权重越大，最终 score 由它主导。"
      onReset={() => { setXt(1.5); setSigma(1) }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="磁铁示意">
        <defs>
          {ROLE.map((k) => (
            <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={`var(--c-${k})`} />
            </marker>
          ))}
        </defs>
        <path d={densPath} className="fill-data" />
        <line className="axis" x1={M.l} x2={W - M.r} y1={110} y2={110} />
        <text x={M.l} y={14}>pₜ(x)：两个点被噪声“抹开”后的混合密度</text>
        {CENTERS.map((c, i) => (
          <g key={c}>
            <circle cx={x(c)} cy={110} r={5 + 10 * Math.sqrt(post[i])} fill={`var(--c-${ROLE[i]})`} opacity={0.85} stroke="var(--card)" strokeWidth={2} />
            <text x={x(c)} y={136} textAnchor="middle">x₀ = {c > 0 ? '+1' : '−1'} · 权重 {(post[i] * 100).toFixed(1)}%</text>
          </g>
        ))}
        <line x1={x(xt)} x2={x(xt)} y1={30} y2={232} stroke="var(--ink)" strokeDasharray="2 3" />
        <text x={x(xt) + 5} y={42} style={{ fill: 'var(--ink)' }}>xₜ = {xt.toFixed(2)}</text>
        {rows.map((r, i) => (
          <g key={r.label} opacity={r.op}>
            <line x1={x(xt)} x2={tip(r.d)} y1={r.y} y2={r.y} className={`stroke-${ROLE[i]}`} markerEnd={`url(#${uid}-${ROLE[i]})`} />
            <text x={W - M.r} y={r.y + 4} textAnchor="end">{r.label} {r.d.toFixed(3)}</text>
          </g>
        ))}
      </svg>
      <Slider label="xₜ" value={xt} min={-3.5} max={3.5} step={0.05} onChange={setXt} />
      <Slider label="噪声 σ" value={sigma} min={0.3} max={2} step={0.05} onChange={setSigma} />
      <table className="kb-num-table">
        <thead><tr><th>来源 x₀</th><th>后验权重</th><th>拉力 −(xₜ−x₀)/σ²</th><th>对应噪声 ε</th></tr></thead>
        <tbody>
          {CENTERS.map((c, i) => (
            <tr key={c}><td>{c > 0 ? '+1' : '−1'}</td><td>{(post[i] * 100).toFixed(1)}%</td><td>{pulls[i].toFixed(3)}</td><td>{eps[i].toFixed(3)}</td></tr>
          ))}
          <tr className="is-total"><td>加权平均</td><td>—</td><td>score = {score.toFixed(3)}</td><td>E[ε|xₜ] = {epsBar.toFixed(3)}</td></tr>
        </tbody>
      </table>
      <p className="kb-demo-note">检验“词典”：−E[ε|xₜ] / σ = {(-epsBar / sigma).toFixed(3)}，和 score 一致。</p>
    </Demo>
  )
}
