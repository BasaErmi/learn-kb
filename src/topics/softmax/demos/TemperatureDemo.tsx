import { useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z5, entropy, sampleCounts, softmax } from '../lib/softmax'
import { CLASSES, pct } from './common'

// 温度用对数刻度：u = log10 T ∈ [-1.3, 1.3]，即 T 约从 0.05 到 20
const U_MIN = -1.3, U_MAX = 1.3
const PRESETS = [0.1, 0.5, 1, 2, 10]
const N_SAMPLES = 100
const fmtT = (T: number) => (T < 1 ? T.toFixed(2) : T < 10 ? T.toFixed(1) : T.toFixed(0))
const REF = softmax(Z5) // T = 1，柱状图里的虚线框

const BW = 300, BH = 228, BM = { l: 8, r: 8, t: 14, b: 44 }
const CW = 300, CH = 228, CM = { l: 34, r: 10, t: 14, b: 44 }
const H_MAX = 1.75
const US = Array.from({ length: 161 }, (_, i) => U_MIN + ((U_MAX - U_MIN) * i) / 160)
const H_CURVE = US.map((u) => [u, entropy(softmax(Z5, 10 ** u))] as [number, number])

export function TemperatureDemo() {
  const [u, setU] = useState(0)
  const [seed, setSeed] = useState(1)
  const T = 10 ** u
  const p = softmax(Z5, T)
  const H = entropy(p)
  const counts = sampleCounts(p, N_SAMPLES, seed)

  const colW = (BW - BM.l - BM.r) / Z5.length
  const by = scaleLinear().domain([0, 1]).range([BH - BM.b, BM.t])
  const cx = scaleLinear().domain([U_MIN, U_MAX]).range([CM.l, CW - CM.r])
  const cy = scaleLinear().domain([0, H_MAX]).range([CH - CM.b, CM.t])
  const path = line<[number, number]>().x((d) => cx(d[0])).y((d) => cy(d[1]))(H_CURVE) ?? ''

  return (
    <Demo
      title="温度 $T$：在 argmax 和均匀分布之间"
      label="温度 T 的影响"
      hint="拖动温度：$T$ 越小，分布越集中到最大的 logit；$T$ 越大，越接近均匀。虚线框是 $T = 1$ 的标准 softmax。柱子下方是按当前分布抽 100 次的结果，LLM 采样就是这样从分布里抽下一个 token。"
      onReset={() => { setU(0); setSeed(1) }}
      note="logits 固定为第 1 步的 $z = (2, 1, 0.5, -0.5, -1.5)$；抽样用固定种子的伪随机数，拖动 $T$ 时用的是同一串随机数，所以次数的变化只来自分布的变化。熵以 nats 为单位。"
    >
      <div className="kb-demo-grid is-even">
        <svg viewBox={`0 0 ${BW} ${BH}`} className="kb-chart" role="img" aria-label={`T = ${fmtT(T)} 时的概率分布`}>
          <line className="axis" x1={BM.l} x2={BW - BM.r} y1={by(0)} y2={by(0)} />
          {p.map((v, i) => {
            const x = BM.l + i * colW + colW * 0.18, w = colW * 0.64
            return (
              <g key={i}>
                <rect x={x} y={by(v)} width={w} height={by(0) - by(v)} className="kb-sm-prob" />
                <rect x={x} y={by(REF[i])} width={w} height={by(0) - by(REF[i])} className="kb-sm-ref" />
                <text x={x + w / 2} y={by(v) - 5} textAnchor="middle" className="kb-sm-val">{pct(v, 0)}</text>
                <text x={x + w / 2} y={BH - BM.b + 15} textAnchor="middle" className="kb-sm-class">{CLASSES[i]}</text>
                <text x={x + w / 2} y={BH - BM.b + 32} textAnchor="middle" className="kb-sm-val">{counts[i]} 次</text>
              </g>
            )
          })}
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="kb-chart" role="img" aria-label="熵随温度的变化">
          <line className="axis" x1={CM.l} x2={CW - CM.r} y1={cy(0)} y2={cy(0)} />
          <line className="grid" x1={CM.l} x2={CW - CM.r} y1={cy(Math.log(5))} y2={cy(Math.log(5))} strokeDasharray="4 3" />
          <SvgTex x={CM.l + 2} y={cy(Math.log(5)) - 4} w={150} size={11} color="var(--ink-3)">均匀分布 <Tex>{'H = \\log 5'}</Tex></SvgTex>
          <text x={CW - CM.r} y={cy(0) - 5} textAnchor="end">one-hot（argmax）</text>
          {[0, 0.5, 1, 1.5].map((h) => <text key={h} x={CM.l - 5} y={cy(h) + 4} textAnchor="end">{h}</text>)}
          {PRESETS.map((t) => <text key={t} x={cx(Math.log10(t))} y={CH - CM.b + 15} textAnchor="middle">{t}</text>)}
          <path d={path} className="stroke-prob" />
          <line x1={cx(u)} x2={cx(u)} y1={cy(0)} y2={cy(H)} className="axis" strokeDasharray="2 3" />
          <circle cx={cx(u)} cy={cy(H)} r={5} fill="var(--c-prob)" stroke="var(--card)" strokeWidth={2} />
          <SvgTex x={(CM.l + CW - CM.r) / 2} y={CH - 6} w={200} align="middle" size={11} color="var(--ink-3)">温度 <Tex>{'T'}</Tex>（对数刻度）</SvgTex>
          <SvgTex x={4} y={CM.t + 4} w={60} size={11} color="var(--ink-3)"><Tex>{'H(p)'}</Tex></SvgTex>
        </svg>
      </div>
      <Slider label="温度 $T$" value={u} min={U_MIN} max={U_MAX} step={0.01} onChange={setU} format={(v) => fmtT(10 ** v)} />
      <div className="kb-controls">
        <div className="kb-presets">
          {PRESETS.map((t) => (
            <button key={t} type="button" className="kb-chip" aria-pressed={Math.abs(T - t) < 1e-9} aria-label={`T = ${t}`} onClick={() => setU(Math.log10(t))}>
              <Tex>{`T = ${t}`}</Tex>
            </button>
          ))}
        </div>
        <button type="button" className="kb-btn-ghost" onClick={() => setSeed((s) => s + 1)}>换一串随机数</button>
      </div>
      <div className="kb-demo-readout">
        <span><Tex>{'p_{\\text{猫}}'}</Tex> = <b>{pct(p[0])}</b></span>
        <span>熵 <Tex>{'H(p)'}</Tex> = <b>{H.toFixed(3)}</b></span>
      </div>
    </Demo>
  )
}
