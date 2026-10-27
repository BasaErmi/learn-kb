import { useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z5, ceGrad, frobenius, jacobian, norm, softmax } from '../lib/softmax'
import { CLASSES, fix, pct } from './common'

const A_MAX = 8
const AS = Array.from({ length: 161 }, (_, i) => (A_MAX * i) / 160)
const zAt = (a: number) => Z5.map((v) => a * v)
const J_CURVE = AS.map((a) => [a, frobenius(jacobian(softmax(zAt(a))))] as [number, number])
const G_CURVE = [0, 2].map((y) => AS.map((a) => [a, norm(ceGrad(zAt(a), y))] as [number, number]))

const LW = 300, LH = 260, CELL = 26, MX = 100, MY = 118 // 左：p 柱状图 + 5×5 的 J 热力图
const CW = 300, CH = 260, CM = { l: 34, r: 12, t: 18, b: 40 }
const Y_MAX = 1.5
const CMAX = 0.25

function jColor(v: number) {
  if (Math.abs(v) < 5e-4) return 'var(--paper-2)'
  const a = Math.min(1, Math.abs(v) / CMAX)
  return `color-mix(in srgb, ${v > 0 ? 'var(--c-prob)' : 'var(--c-grad)'} ${Math.round(12 + a * 70)}%, var(--card))`
}

export function SaturationDemo() {
  const [a, setA] = useState(1)
  const [y, setY] = useState(0)
  const p = softmax(zAt(a))
  const J = jacobian(p)
  const jn = frobenius(J)
  const gn = norm(ceGrad(zAt(a), y))
  const cx = scaleLinear().domain([0, A_MAX]).range([CM.l, CW - CM.r])
  const cy = scaleLinear().domain([0, Y_MAX]).range([CH - CM.b, CM.t])
  const path = (pts: [number, number][]) => line<[number, number]>().x((d) => cx(d[0])).y((d) => cy(d[1]))(pts) ?? ''
  const colW = LW / 5

  return (
    <Demo
      title="饱和：logits 拉开后 $J \to 0$"
      label="softmax 饱和"
      hint="把第 1 步的 logits 整体乘上 $a$：$a$ 越大，差距越大，分布越接近 one-hot，Jacobian 的每一格都褪成 0，经过 softmax 往回传的梯度也就没了。对照的橙线是交叉熵的梯度 $p - y$：真实类别是“猫”时它跟着变小，换成“狐狸”时反而稳定在 $\sqrt 2$ 附近。"
      onReset={() => { setA(1); setY(0) }}
      note="$z = a \cdot (2, 1, 0.5, -0.5, -1.5)$；$a = 0$ 时 $p$ 是均匀分布。$\|J\|_F$ 是 Jacobian 所有元素平方和的平方根；热力图色阶在 $\pm 0.25$ 处饱和。"
    >
      <Seg label="真实类别" value={y} onChange={setY} options={[
        { value: 0, label: '真实类别：猫（预测对了）' },
        { value: 2, label: '真实类别：狐狸（预测错了）' },
      ]} />
      <div className="kb-demo-grid is-even">
        <svg viewBox={`0 0 ${LW} ${LH}`} className="kb-chart" role="img" aria-label={`a = ${a.toFixed(2)} 时的概率和 Jacobian`}>
          <line className="axis" x1={0} x2={LW} y1={86} y2={86} />
          {p.map((v, i) => (
            <g key={i}>
              <rect x={i * colW + colW * 0.22} y={86 - v * 66} width={colW * 0.56} height={v * 66} className="kb-sm-prob" />
              <text x={i * colW + colW / 2} y={86 - v * 66 - 4} textAnchor="middle" className="kb-sm-val">{pct(v, 0)}</text>
              <text x={i * colW + colW / 2} y={100} textAnchor="middle" className="kb-sm-class">{CLASSES[i]}</text>
            </g>
          ))}
          <SvgTex x={MX - 8} y={MY + CELL * 2.5 + 6} w={40} align="end" size={14}><Tex>{'J ='}</Tex></SvgTex>
          {J.map((row, r) => row.map((v, c) => (
            <rect key={`${r}-${c}`} x={MX + c * CELL} y={MY + r * CELL} width={CELL} height={CELL} fill={jColor(v)} stroke="var(--card)" strokeWidth={1.5} />
          )))}
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="kb-chart" role="img" aria-label="‖J‖ 和 ‖p − y‖ 随 a 的变化">
          <line className="axis" x1={CM.l} x2={CW - CM.r} y1={cy(0)} y2={cy(0)} />
          <line className="axis" x1={CM.l} x2={CM.l} y1={cy(0)} y2={CM.t} />
          {[0, 0.5, 1, 1.5].map((v) => <text key={v} x={CM.l - 5} y={cy(v) + 4} textAnchor="end">{v}</text>)}
          {[0, 2, 4, 6, 8].map((v) => <text key={v} x={cx(v)} y={cy(0) + 14} textAnchor="middle">{v}</text>)}
          <line className="grid" x1={CM.l} x2={CW - CM.r} y1={cy(Math.SQRT2)} y2={cy(Math.SQRT2)} strokeDasharray="4 3" />
          <path d={path(J_CURVE)} className="stroke-prob" />
          <path d={path(G_CURVE[y === 0 ? 0 : 1])} className="stroke-grad" />
          <line x1={cx(a)} x2={cx(a)} y1={cy(0)} y2={CM.t} className="axis" strokeDasharray="2 3" />
          <circle cx={cx(a)} cy={cy(jn)} r={4.5} fill="var(--c-prob)" stroke="var(--card)" strokeWidth={2} />
          <circle cx={cx(a)} cy={cy(gn)} r={4.5} fill="var(--c-grad)" stroke="var(--card)" strokeWidth={2} />
          <SvgTex x={CW - CM.r} y={cy(Math.SQRT2) - 4} w={60} align="end" size={11} color="var(--ink-3)"><Tex>{'\\sqrt 2'}</Tex></SvgTex>
          <SvgTex x={(CM.l + CW - CM.r) / 2} y={CH - 6} w={160} align="middle" size={12} color="var(--ink-3)">logit 尺度 <Tex>{'a'}</Tex></SvgTex>
        </svg>
      </div>
      <div className="kb-legend">
        <span><i style={{ background: 'var(--c-prob)' }} /><Tex>{'\\|J\\|_F'}</Tex>：经过 softmax 回传的梯度能有多大</span>
        <span><i style={{ background: 'var(--c-grad)' }} /><Tex>{'\\|p - y\\|'}</Tex>：交叉熵对 logits 的梯度</span>
      </div>
      <Slider label="logit 尺度 $a$" value={a} min={0} max={A_MAX} step={0.05} onChange={setA} />
      <div className="kb-demo-readout">
        <span><Tex>{'\\max_i p_i'}</Tex> = <b>{pct(Math.max(...p), 2)}</b></span>
        <span><Tex>{'\\|J\\|_F'}</Tex> = <b>{fix(jn, 4)}</b></span>
        <span><Tex>{'\\|p - y\\|'}</Tex> = <b>{fix(gn, 3)}</b></span>
      </div>
    </Demo>
  )
}
