import { useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z3, ceGrad, crossEntropy, gdStep, softmax } from '../lib/softmax'
import { fix } from './common'

const ETA = 1, MAX_STEPS = 30
const STARTS = [
  { key: 'text', z: Z3, tex: 'z = (\\log 7, \\log 2, 0)', aria: '正文的例子' },
  { key: 'a', z: [6, 0, 0], tex: 'z = (6, 0, 0)', aria: 'z = (6, 0, 0)' },
  { key: 'b', z: [0, 6, 0], tex: 'z = (0, 6, 0)', aria: 'z = (0, 6, 0)' },
] as const
type StartKey = (typeof STARTS)[number]['key']

const BW = 300, BH = 268, BM = { l: 30, r: 8 }
const P_TOP = 18, P_H = 92, G_MID = 182, G_H = 52 // 上：p 与 y；下：p − y（纵轴 ±1）
const CW = 300, CH = 268, CM = { l: 34, r: 12, t: 18, b: 40 }
const L_MAX = 6.5

export function CrossEntropyDemo() {
  const [y, setY] = useState(1)
  const [start, setStart] = useState<StartKey>('text')
  const [hist, setHist] = useState<number[][]>([Z3])
  const z = hist[hist.length - 1]
  const p = softmax(z)
  const g = ceGrad(z, y)
  const losses = hist.map((v) => crossEntropy(v, y))

  const restart = (nextY: number, nextStart: StartKey) => {
    setY(nextY); setStart(nextStart)
    setHist([[...STARTS.find((s) => s.key === nextStart)!.z]])
  }
  const step = (n: number) => setHist((h) => {
    const out = [...h]
    for (let k = 0; k < n && out.length <= MAX_STEPS; k++) out.push(gdStep(out[out.length - 1], y, ETA))
    return out
  })

  const colW = (BW - BM.l - BM.r) / 3
  const py = scaleLinear().domain([0, 1]).range([P_TOP + P_H, P_TOP])
  const gy = scaleLinear().domain([-1, 1]).range([G_MID + G_H, G_MID - G_H])
  const cx = scaleLinear().domain([0, MAX_STEPS]).range([CM.l, CW - CM.r])
  const cy = scaleLinear().domain([0, L_MAX]).range([CH - CM.b, CM.t])
  const lossPath = line<number>().x((_, k) => cx(k)).y((v) => cy(Math.min(v, L_MAX)))(losses) ?? ''

  return (
    <Demo
      title="交叉熵的梯度：$\nabla_z L = p - y$"
      label="交叉熵的梯度"
      hint="橙色柱子是梯度 $p - y$。按“走一步”做一次梯度下降 $z \leftarrow z - \eta\,(p - y)$：真实类别的 logit 被往上推，其余被往下压，$p$ 越大的错误类别被压得越狠。也可以换一个初始 logits，比较“自信地错了”和“自信地对了”。"
      onReset={() => restart(1, 'text')}
      note="学习率 $\eta = 1$。默认 $z = (\log 7, \log 2, 0)$，$p = (0.7, 0.2, 0.1)$，真实类别是第 2 类；损失曲线的纵轴固定为 $[0, 6.5]$。"
    >
      <div className="kb-controls">
        <Seg label="真实类别" value={y} onChange={(v) => restart(v, start)} options={[0, 1, 2].map((k) => ({ value: k, label: `真实类别 ${k + 1}` }))} />
        <Seg<StartKey> label="初始 logits" value={start} onChange={(v) => restart(y, v)} options={STARTS.map((s) => ({ value: s.key, label: <Tex>{s.tex}</Tex>, aria: s.aria }))} />
      </div>
      <div className="kb-demo-grid is-even">
        <svg viewBox={`0 0 ${BW} ${BH}`} className="kb-chart" role="img" aria-label="p、y 和 p − y 的柱状图">
          <SvgTex x={0} y={P_TOP + 10} w={40} size={12} color="var(--ink-2)"><Tex>{'p, y'}</Tex></SvgTex>
          <line className="axis" x1={BM.l} x2={BW - BM.r} y1={py(0)} y2={py(0)} />
          <SvgTex x={0} y={G_MID - G_H + 12} w={40} size={12} color="var(--ink-2)"><Tex>{'p - y'}</Tex></SvgTex>
          <line className="axis" x1={BM.l} x2={BW - BM.r} y1={gy(0)} y2={gy(0)} />
          {p.map((v, k) => {
            const x = BM.l + k * colW + colW * 0.22, w = colW * 0.56
            return (
              <g key={k}>
                <rect x={x} y={py(v)} width={w} height={py(0) - py(v)} className="kb-sm-prob" />
                {k === y && <rect x={x - 3} y={py(1)} width={w + 6} height={py(0) - py(1)} className="kb-sm-ref" />}
                <text x={x + w / 2} y={py(v) - 5} textAnchor="middle" className="kb-sm-val">{fix(v, 3)}</text>
                <rect x={x} y={Math.min(gy(0), gy(g[k]))} width={w} height={Math.abs(gy(g[k]) - gy(0))} className="kb-sm-grad" />
                <text x={x + w / 2} y={g[k] >= 0 ? gy(g[k]) - 5 : gy(g[k]) + 13} textAnchor="middle" className="kb-sm-val">{fix(g[k], 3)}</text>
                <text x={x + w / 2} y={BH - 4} textAnchor="middle" className="kb-sm-class">{k === y ? `类 ${k + 1}（真实）` : `类 ${k + 1}`}</text>
              </g>
            )
          })}
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="kb-chart" role="img" aria-label="损失随步数的变化">
          <line className="axis" x1={CM.l} x2={CW - CM.r} y1={cy(0)} y2={cy(0)} />
          <line className="axis" x1={CM.l} x2={CM.l} y1={cy(0)} y2={CM.t} />
          {[0, 2, 4, 6].map((v) => <text key={v} x={CM.l - 5} y={cy(v) + 4} textAnchor="end">{v}</text>)}
          {[0, 10, 20, 30].map((v) => <text key={v} x={cx(v)} y={cy(0) + 14} textAnchor="middle">{v}</text>)}
          <path d={lossPath} className="stroke-grad" />
          {losses.map((v, k) => <circle key={k} cx={cx(k)} cy={cy(Math.min(v, L_MAX))} r={k === losses.length - 1 ? 4.5 : 2.2} fill="var(--c-grad)" />)}
          <text x={(CM.l + CW - CM.r) / 2} y={CH - 8} textAnchor="middle">梯度下降步数</text>
          <SvgTex x={CM.l + 6} y={CM.t + 8} w={200} size={12} color="var(--ink-2)">损失 <Tex>{`L = -\\log p_${y + 1}`}</Tex></SvgTex>
        </svg>
      </div>
      <div className="kb-controls">
        <button type="button" className="kb-btn" disabled={hist.length > MAX_STEPS} onClick={() => step(1)}>走一步</button>
        <button type="button" className="kb-btn-ghost" disabled={hist.length > MAX_STEPS} onClick={() => step(10)}>走 10 步</button>
        <span className="kb-muted">已走 {hist.length - 1} 步</span>
      </div>
      <div className="kb-demo-readout">
        <span><Tex>{'z'}</Tex> = <b>({z.map((v) => fix(v, 3)).join(', ')})</b></span>
        <span><Tex>{'L'}</Tex> = <b>{losses[losses.length - 1].toFixed(3)}</b></span>
      </div>
    </Demo>
  )
}
