import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex } from '@/kb/components/Tex'
import { dist2, nearest, type Pt } from '../lib/vq'
import { voronoiCells } from '../lib/voronoi'
import { QUANT_CODES, QUANT_Z0 } from '../lib/data'

const R = 3
export const CODE_COLORS = ['var(--c-cond)', 'var(--c-uncond)', 'var(--c-guided)', 'var(--c-act)', 'var(--c-pi)', 'var(--c-new)']
const sx = (v: number) => ((v + R) / (2 * R)) * 100
const sy = (v: number) => 100 - ((v + R) / (2 * R)) * 100
const clamp = (v: number) => Math.max(-R, Math.min(R, v))
const vec = (p: Pt) => `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`
const CELLS = voronoiCells(QUANT_CODES, R)

/** 拖动编码器输出 z_e，看它落进哪个 Voronoi 区域、被换成哪个码字 */
export function QuantizeDemo() {
  const [z, setZ] = useState<Pt>(QUANT_Z0)
  const uid = useId().replace(/:/g, '')
  const k = nearest(z, QUANT_CODES)
  const e = QUANT_CODES[k]
  const eps: Pt = [e[0] - z[0], e[1] - z[1]]
  const d = QUANT_CODES.map((c) => Math.sqrt(dist2(z, c)))

  const place = (ev: PointerEvent<SVGSVGElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    setZ([clamp(-R + (2 * R * (ev.clientX - r.left)) / r.width), clamp(R - (2 * R * (ev.clientY - r.top)) / r.height)])
  }
  const onKey = (ev: KeyboardEvent) => {
    const dd: Record<string, Pt> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }
    if (!dd[ev.key]) return
    ev.preventDefault()
    setZ(([a, b]) => [clamp(a + dd[ev.key][0]), clamp(b + dd[ev.key][1])])
  }

  return (
    <Demo
      title="最近邻量化：空间被码字划成 Voronoi 区域"
      label="最近邻量化"
      hint="6 个码字 $e_1, \dots, e_6$（方块）把平面分成 6 个区域，每个区域里的点离自己的码字最近。拖动编码器输出 $z_e$（或点选后用方向键）：只要还在同一个区域里，量化结果 $z_q = e_k$ 就不变；越过边界，才换成另一个码字。虚线箭头是量化误差 $\varepsilon = e_k - z_e$。"
      onReset={() => setZ(QUANT_Z0)}
      note="码字维度 $D = 2$，只为了能画出来；实际的 $D$ 通常是几十到几百维，道理相同。区域边界是两个码字连线的垂直平分线。"
    >
      <div className="kb-demo-grid">
        <div className="kb-canvas-wrap">
          <svg viewBox="0 0 100 100" className="kb-vq-plane" role="img" aria-label="二维码本的 Voronoi 区域，拖动 z_e"
            onPointerDown={(ev) => { ev.currentTarget.setPointerCapture(ev.pointerId); place(ev) }}
            onPointerMove={(ev) => { if (ev.buttons) place(ev) }}>
            <defs>
              <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
              </marker>
            </defs>
            {CELLS.map((poly, i) => (
              <polygon key={i} points={poly.map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ')}
                fill={CODE_COLORS[i]} fillOpacity={i === k ? 0.26 : 0.09} stroke="var(--card)" strokeWidth={0.6} />
            ))}
            {QUANT_CODES.map((c, i) => (
              <g key={i}>
                <rect x={sx(c[0]) - 1.8} y={sy(c[1]) - 1.8} width={3.6} height={3.6} rx={0.6} fill={CODE_COLORS[i]} stroke="var(--card)" strokeWidth={0.5} />
                <text x={sx(c[0]) + 2.6} y={sy(c[1]) - 2.2} className="kb-vq-label">e{i + 1}</text>
              </g>
            ))}
            <line x1={sx(z[0])} y1={sy(z[1])} x2={sx(e[0])} y2={sy(e[1])} stroke="var(--ink)" strokeWidth={0.6} strokeDasharray="1.6 1.2" markerEnd={`url(#${uid}-a)`} />
            <circle cx={sx(z[0])} cy={sy(z[1])} r={2.2} className="kb-vq-handle" tabIndex={0}
              role="button" aria-label={`z_e 位置 ${vec(z)}，用方向键移动`} onKeyDown={onKey} />
          </svg>
        </div>
        <div>
          <div className="kb-demo-readout" style={{ marginBottom: '0.6rem' }}>
            <span><Tex>{'z_e'}</Tex> = <b>{vec(z)}</b></span>
            <span><Tex>{'k'}</Tex> = <b>{k + 1}</b></span>
            <span><Tex>{'z_q = e_k'}</Tex> = <b>{vec(e)}</b></span>
            <span><Tex>{'\\|\\varepsilon\\|'}</Tex> = <b>{Math.hypot(eps[0], eps[1]).toFixed(2)}</b></span>
          </div>
          <div className="kb-table-scroll">
            <table className="kb-num-table kb-nowrap">
              <thead><tr><th>码字</th><th><Tex>{'\\|z_e - e_j\\|'}</Tex></th></tr></thead>
              <tbody>
                {d.map((v, j) => (
                  <tr key={j} className={j === k ? 'is-hit' : undefined}>
                    <td><span className="kb-swatch" style={{ background: CODE_COLORS[j] }} />e{j + 1}{j === k ? '（最近）' : ''}</td>
                    <td>{v.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Demo>
  )
}
