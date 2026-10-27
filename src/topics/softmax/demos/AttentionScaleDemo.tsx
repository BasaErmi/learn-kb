import { useEffect, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { attentionSim } from '../lib/softmax'
import { fix, pct } from './common'

const DKS = [4, 8, 16, 32, 64, 128, 256, 512, 1024]
const CHOICES = [4, 16, 64, 256, 1024]
const N_KEYS = 16
type Mode = 'raw' | 'scaled'

// 模拟结果按 d_k 缓存；曲线上的点在空闲时逐个补算，不阻塞首屏
const cache = new Map<number, ReturnType<typeof attentionSim>>()
const sim = (dk: number) => {
  let r = cache.get(dk)
  if (!r) cache.set(dk, (r = attentionSim(dk, N_KEYS)))
  return r
}

const BW = 300, BH = 220, BM = { l: 30, r: 6, t: 16, b: 36 }
const CW = 300, CH = 220, CM = { l: 34, r: 12, t: 16, b: 40 }
const J_MAX = 0.4

export function AttentionScaleDemo() {
  const [dk, setDk] = useState(64)
  const [mode, setMode] = useState<Mode>('raw')
  const [, setDone] = useState(0)
  const cur = sim(dk)
  const m = cur[mode]

  useEffect(() => {
    const todo = DKS.filter((d) => !cache.has(d))
    if (todo.length === 0) return
    const id = window.setTimeout(() => { sim(todo[0]); setDone((n) => n + 1) }, 30)
    return () => window.clearTimeout(id)
  })

  const by = scaleLinear().domain([0, 1]).range([BH - BM.b, BM.t])
  const colW = (BW - BM.l - BM.r) / N_KEYS
  const cx = scaleLinear().domain([2, 10]).range([CM.l, CW - CM.r])
  const cy = scaleLinear().domain([0, J_MAX]).range([CH - CM.b, CM.t])
  const curve = (md: Mode) => line<number>().x((d) => cx(Math.log2(d))).y((d) => cy(cache.get(d)![md].meanJ))(DKS.filter((d) => cache.has(d))) ?? ''

  return (
    <Demo
      title="注意力里的 $\sqrt{d_k}$"
      label="注意力里的 sqrt(d_k)"
      hint="$q$ 和 16 个 $k$ 的每个分量都取自 $\mathcal N(0, 1)$。不缩放时，$d_k$ 越大，点积 $q^\top k_j$ 的方差越大，softmax 越接近 one-hot，$\|J\|_F$ 一路降到接近 0；除以 $\sqrt{d_k}$ 后方差回到 1，各个 $d_k$ 下的表现几乎一样。"
      onReset={() => { setDk(64); setMode('raw') }}
      note="每个 $d_k$ 用固定种子抽 64 个 query、各配 16 个 key；左图是第一个 query 的注意力权重，右图和下方读数是 64 个 query 的平均。两种模式用的是同一批向量。"
    >
      <div className="kb-controls">
        <Seg label="d_k" value={dk} onChange={setDk} options={CHOICES.map((d) => ({ value: d, label: <Tex>{`d_k = ${d}`}</Tex>, aria: `d_k = ${d}` }))} />
        <Seg<Mode> label="是否缩放" value={mode} onChange={setMode} options={[
          { value: 'raw', label: <Tex>{'\\text{softmax}(q^\\top k_j)'}</Tex>, aria: '不缩放' },
          { value: 'scaled', label: <Tex>{'\\text{softmax}\\big(\\frac{q^\\top k_j}{\\sqrt{d_k}}\\big)'}</Tex>, aria: '除以根号 d_k' },
        ]} />
      </div>
      <div className="kb-demo-grid is-even">
        <svg viewBox={`0 0 ${BW} ${BH}`} className="kb-chart" role="img" aria-label="第一个 query 的注意力权重">
          <line className="axis" x1={BM.l} x2={BW - BM.r} y1={by(0)} y2={by(0)} />
          {[0, 0.5, 1].map((v) => <text key={v} x={BM.l - 5} y={by(v) + 4} textAnchor="end">{v}</text>)}
          {m.first.map((v, j) => (
            <rect key={j} x={BM.l + j * colW + colW * 0.15} y={by(v)} width={colW * 0.7} height={by(0) - by(v)} className="kb-sm-prob" />
          ))}
          <SvgTex x={(BM.l + BW - BM.r) / 2} y={BH - 6} w={220} align="middle" size={12} color="var(--ink-3)">16 个 key 上的注意力权重</SvgTex>
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="kb-chart" role="img" aria-label="平均 Jacobian 范数随 d_k 的变化">
          <line className="axis" x1={CM.l} x2={CW - CM.r} y1={cy(0)} y2={cy(0)} />
          <line className="axis" x1={CM.l} x2={CM.l} y1={cy(0)} y2={CM.t} />
          {[0, 0.1, 0.2, 0.3, 0.4].map((v) => <text key={v} x={CM.l - 5} y={cy(v) + 4} textAnchor="end">{v}</text>)}
          {[4, 16, 64, 256, 1024].map((d) => <text key={d} x={cx(Math.log2(d))} y={cy(0) + 14} textAnchor="middle">{d}</text>)}
          <path d={curve('raw')} className="stroke-grad" />
          <path d={curve('scaled')} className="stroke-prob" />
          <circle cx={cx(Math.log2(dk))} cy={cy(m.meanJ)} r={5} fill={mode === 'raw' ? 'var(--c-grad)' : 'var(--c-prob)'} stroke="var(--card)" strokeWidth={2} />
          <SvgTex x={(CM.l + CW - CM.r) / 2} y={CH - 6} w={200} align="middle" size={12} color="var(--ink-3)"><Tex>{'d_k'}</Tex>（对数刻度）</SvgTex>
          <SvgTex x={CM.l + 6} y={CM.t + 6} w={200} size={12} color="var(--ink-2)">平均 <Tex>{'\\|J\\|_F'}</Tex></SvgTex>
        </svg>
      </div>
      <div className="kb-legend">
        <span><i style={{ background: 'var(--c-grad)' }} />不缩放</span>
        <span><i style={{ background: 'var(--c-prob)' }} />除以 <Tex>{'\\sqrt{d_k}'}</Tex></span>
      </div>
      <div className="kb-demo-readout">
        <span>点积方差 <b>{fix(mode === 'raw' ? cur.scoreVar : cur.scoreVar / dk, 2)}</b>（{mode === 'raw' ? <>理论值 <Tex>{`d_k = ${dk}`}</Tex></> : '理论值 1'}）</span>
        <span>第一个 query 的最大权重 <b>{pct(Math.max(...m.first))}</b></span>
        <span>平均最大权重 <b>{pct(m.meanMaxW)}</b></span>
        <span>平均 <Tex>{'\\|J\\|_F'}</Tex> <b>{fix(m.meanJ, 3)}</b></span>
      </div>
    </Demo>
  )
}
