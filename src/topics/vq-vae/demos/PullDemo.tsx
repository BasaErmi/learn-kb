import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { assign, clusterMean, pullStep, quantError, type Pt, type PullState } from '../lib/vq'
import { PULL_CODES, PULL_ZS } from '../lib/data'
import { CODE_COLORS } from './QuantizeDemo'

const R = 3, LR = 0.15
const sx = (v: number) => ((v + R) / (2 * R)) * 100
const sy = (v: number) => 100 - ((v + R) / (2 * R)) * 100
type Mode = 'both' | 'codebook' | 'commit'
const S0: PullState = { codes: PULL_CODES, zs: PULL_ZS }

/** 码本损失让码字追编码器输出，commitment 让编码器输出向码字靠拢；逐步看谁动、动多少 */
export function PullDemo() {
  const [mode, setMode] = useState<Mode>('both')
  const [beta, setBeta] = useState(0.25)
  const [hist, setHist] = useState<PullState[]>([S0])
  const s = hist[hist.length - 1]
  const a = assign(s)
  const opts = { lr: LR, beta, codebook: mode !== 'commit', commit: mode !== 'codebook', anchor: PULL_ZS }
  const step = (k: number) => setHist((h) => {
    const out = [...h]
    for (let i = 0; i < k; i++) out.push(pullStep(out[out.length - 1], opts))
    return out
  })
  const reset = () => setHist([S0])
  const counts = s.codes.map((_, k) => a.filter((x) => x === k).length)

  return (
    <Demo
      title="码本损失与 commitment：谁拉谁"
      label="码本损失与 commitment"
      hint="12 个编码器输出 $z_e$（圆点，颜色表示分给哪个码字；空心圈是它们的起点）和 4 个码字（方块）。每走一步先重新分配最近码字，再各走一步梯度：码本损失只移动码字，commitment 只移动 $z_e$。叉号是分给每个码字的 $z_e$ 的均值。多走几步看看：码字一路追到均值，$z_e$ 只向码字挪了一小段。右下角那个码字离数据太远，从未被选中。"
      onReset={reset}
      note="学习率 0.15。演示里码本损失按每个码字分到的样本取平均，commitment 按每个样本计，所以两者的步长之比正好是 $1 : \beta$。真实训练里 $z_e$ 还受重建损失约束，这里用一个把 $z_e$ 拉回起点的二次项 $\|z_e - z_e^{(0)}\|^2$ 代替它；两者平衡时 $z_e$ 停在起点向码字挪 $\frac{\beta}{1+\beta}$ 的位置（$\beta = 0.25$ 时是 20%）。没有这一项，commitment 会把 $z_e$ 一路拉到码字上。"
    >
      <div className="kb-controls">
        <Seg label="启用哪几项" value={mode} onChange={(v) => { setMode(v); reset() }} options={[
          { value: 'both', label: '② + ③' },
          { value: 'codebook', label: '只用 ② 码本损失' },
          { value: 'commit', label: '只用 ③ commitment' },
        ]} />
        <button type="button" className="kb-btn-ghost" onClick={() => step(1)}>走一步</button>
        <button type="button" className="kb-btn-ghost" onClick={() => step(10)}>走 10 步</button>
      </div>
      <div className="kb-demo-grid">
        <div className="kb-canvas-wrap">
          <svg viewBox="0 0 100 100" className="kb-vq-plane is-static" role="img" aria-label={`第 ${hist.length - 1} 步的码字和编码器输出`}>
            <rect x={0} y={0} width={100} height={100} fill="var(--card)" />
            {s.codes.map((_, k) => (
              <polyline key={k} points={hist.map((h) => `${sx(h.codes[k][0])},${sy(h.codes[k][1])}`).join(' ')} fill="none" stroke={CODE_COLORS[k]} strokeWidth={0.5} opacity={0.6} />
            ))}
            {PULL_ZS.map((z, i) => <circle key={`o${i}`} cx={sx(z[0])} cy={sy(z[1])} r={1.5} fill="none" stroke="var(--ink-3)" strokeWidth={0.35} />)}
            {s.zs.map((z, i) => (
              <g key={i}>
                <line x1={sx(z[0])} y1={sy(z[1])} x2={sx(s.codes[a[i]][0])} y2={sy(s.codes[a[i]][1])} stroke={CODE_COLORS[a[i]]} strokeWidth={0.3} opacity={0.45} />
                <circle cx={sx(z[0])} cy={sy(z[1])} r={1.5} fill={CODE_COLORS[a[i]]} stroke="var(--card)" strokeWidth={0.4} />
              </g>
            ))}
            {s.codes.map((_, k) => {
              const m = clusterMean(s, k)
              if (!m) return null
              const [x, y] = [sx(m[0]), sy(m[1])]
              return <path key={k} d={`M${x - 1.3},${y - 1.3} L${x + 1.3},${y + 1.3} M${x - 1.3},${y + 1.3} L${x + 1.3},${y - 1.3}`} stroke="var(--ink)" strokeWidth={0.5} />
            })}
            {s.codes.map((c: Pt, k) => (
              <g key={k}>
                <rect x={sx(c[0]) - 2} y={sy(c[1]) - 2} width={4} height={4} rx={0.6} fill={CODE_COLORS[k]} stroke="var(--ink)" strokeWidth={0.4} />
                <text x={c[0] > 1.5 ? sx(c[0]) - 2.8 : sx(c[0]) + 2.8} y={sy(c[1]) - 2.4} textAnchor={c[0] > 1.5 ? 'end' : 'start'} className="kb-vq-label">e{k + 1}{counts[k] === 0 ? '（死码字）' : ''}</text>
              </g>
            ))}
          </svg>
        </div>
        <div>
          <div className="kb-demo-readout" style={{ marginBottom: '0.6rem' }}>
            <span>第 <b>{hist.length - 1}</b> 步</span>
            <span>平均 <Tex>{'\\|z_e - e_k\\|^2'}</Tex> = <b>{quantError(s).toFixed(3)}</b></span>
          </div>
          <div className="kb-table-scroll">
            <table className="kb-num-table kb-nowrap">
              <thead><tr><th>码字</th><th>分到的 <Tex>{'z_e'}</Tex></th><th>到均值的距离</th></tr></thead>
              <tbody>
                {s.codes.map((c, k) => {
                  const m = clusterMean(s, k)
                  return (
                    <tr key={k}>
                      <td><span className="kb-swatch" style={{ background: CODE_COLORS[k] }} />e{k + 1}</td>
                      <td>{counts[k]}</td>
                      <td>{m ? Math.hypot(c[0] - m[0], c[1] - m[1]).toFixed(3) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Slider label="commitment 权重 $\beta$" value={beta} min={0.1} max={2} step={0.05} onChange={(v) => { setBeta(v); reset() }} />
    </Demo>
  )
}
