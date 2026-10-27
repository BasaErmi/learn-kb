import { useState, type KeyboardEvent } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex, TexText } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z3, jacobian, numericJacobian, softmax } from '../lib/softmax'
import { fix } from './common'

const W = 560, H = 196, CELL = 38, TOP = 44
// 按公式的顺序排：J（右边附行和）= diag(p) − pp^T，窄屏横向滚动时先看到 J
const MATS = [{ x: 6, tex: 'J' }, { x: 238, tex: '\\text{diag}(p)' }, { x: 410, tex: 'pp^\\top' }]
const OPS = [{ x: 213, s: '=' }, { x: 380, s: '−' }]
const SUM_X = MATS[0].x + CELL * 3 + 10
const CMAX = 0.5 // 色阶：|值| ≥ 0.5 时颜色最深

function color(v: number) {
  const a = Math.min(1, Math.abs(v) / CMAX)
  if (Math.abs(v) < 5e-4) return 'var(--paper-2)'
  return `color-mix(in srgb, ${v > 0 ? 'var(--c-prob)' : 'var(--c-grad)'} ${Math.round(12 + a * 70)}%, var(--card))`
}

export function JacobianDemo() {
  const [z, setZ] = useState(Z3)
  const [sel, setSel] = useState<[number, number]>([0, 0])
  const p = softmax(z)
  const J = jacobian(p)
  const N = numericJacobian(z)
  const diag = p.map((pi, i) => p.map((_, j) => (i === j ? pi : 0)))
  const outer = p.map((pi) => p.map((pj) => pi * pj))
  const [i, j] = sel
  const mats = [J, diag, outer]

  return (
    <Demo
      title="softmax 的 Jacobian：$J = \text{diag}(p) - pp^\top$"
      label="softmax 的 Jacobian"
      hint="拖动三个 logit，看 $J$ 怎么变；点 $J$ 里的任意一格，下面会写出这一格的代入过程，并和数值差分的结果对照。蓝色为正，橙色为负。"
      onReset={() => { setZ(Z3); setSel([0, 0]) }}
      note="默认 $z = (\log 7, \log 2, 0)$，对应 $p = (0.7, 0.2, 0.1)$，第 5 步用的也是这组数。数值差分是对 $z_j$ 做步长 $h = 10^{-5}$ 的中心差分。"
    >
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="group" aria-label="diag(p)、pp^T 和 J 三个矩阵">
          {MATS.map((m, k) => (
            <g key={k}>
              <SvgTex x={m.x + (CELL * 3) / 2} y={TOP - 14} w={120} align="middle" size={14}><Tex>{m.tex}</Tex></SvgTex>
              {mats[k].map((row, r) => row.map((v, c) => {
                const hot = k === 0 && r === i && c === j
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={m.x + c * CELL} y={TOP + r * CELL} width={CELL} height={CELL} fill={color(v)}
                      className={hot ? 'kb-mat-cell is-hot' : 'kb-mat-cell'}
                      {...(k === 0 ? { role: 'button', tabIndex: 0, 'aria-label': `J 第 ${r + 1} 行第 ${c + 1} 列`, onClick: () => setSel([r, c]), onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel([r, c]) } } } : {})}
                    />
                    <text x={m.x + c * CELL + CELL / 2} y={TOP + r * CELL + CELL / 2 + 4} textAnchor="middle" className="kb-mat-val">{fix(v, 2)}</text>
                  </g>
                )
              }))}
            </g>
          ))}
          {OPS.map((o) => <text key={o.x} x={o.x} y={TOP + CELL * 1.5 + 6} textAnchor="middle" style={{ fontSize: 20, fill: 'var(--ink-2)' }}>{o.s}</text>)}
          <text x={SUM_X} y={TOP - 6} className="kb-sm-val">行和</text>
          {J.map((row, r) => (
            <text key={r} x={SUM_X} y={TOP + r * CELL + CELL / 2 + 4} className="kb-sm-val">{fix(row.reduce((a, v) => a + v, 0), 3)}</text>
          ))}
          <SvgTex x={6} y={H - 4} w={420} size={11} color="var(--ink-3)"><TexText>{'第 $i$ 行是哪个输出概率，第 $j$ 列是对哪个 logit 求导'}</TexText></SvgTex>
        </svg>
      </div>
      <p className="kb-demo-note">
        <Tex>{`\\dfrac{\\partial p_${i + 1}}{\\partial z_${j + 1}} = p_${i + 1}(\\delta_{${i + 1}${j + 1}} - p_${j + 1}) = ${fix(p[i], 3)} \\times (${i === j ? 1 : 0} - ${fix(p[j], 3)}) = ${fix(J[i][j], 4)}`}</Tex>
        <span style={{ marginLeft: '1rem' }}>数值差分：<b style={{ fontFamily: 'var(--mono)' }}>{fix(N[i][j], 4)}</b></span>
      </p>
      {z.map((v, k) => (
        <Slider key={k} label={`$z_${k + 1}$`} value={v} min={-4} max={4} step={0.01} onChange={(nv) => setZ(z.map((x, m) => (m === k ? nv : x)))} />
      ))}
      <div className="kb-demo-readout">
        <span><Tex>{'p'}</Tex> = <b>({p.map((v) => v.toFixed(3)).join(', ')})</b></span>
      </div>
    </Demo>
  )
}
