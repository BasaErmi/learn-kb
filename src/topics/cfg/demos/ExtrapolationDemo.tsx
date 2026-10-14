import { useId, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { Sub, SvgTex } from '@/kb/components/SvgSub'
import { cfgCombine } from '../lib/cfg'
import type { Vec2 } from '../lib/gmm2d'

const EU: Vec2 = [1.2, 0.6], EC: Vec2 = [2.0, 1.4]
const W = 520, H = 380, PAD = 28
const ROLES = ['uncond', 'cond', 'guided'] as const

export function ExtrapolationDemo() {
  const [s, setS] = useState(3)
  const id = useId().replace(/:/g, '')
  const eh = cfgCombine(EU, EC, s)
  const x = scaleLinear().domain([-0.3, 5.6]).range([PAD, W - PAD])
  const y = scaleLinear().domain([-0.3, 5]).range([H - PAD, PAD])
  const [l0, l1] = [cfgCombine(EU, EC, -0.6), cfgCombine(EU, EC, 5.2)]
  const vec = (v: Vec2, role: (typeof ROLES)[number]) => (
    <line x1={x(0)} y1={y(0)} x2={x(v[0])} y2={y(v[1])} className={`stroke-${role}`} markerEnd={`url(#${id}-${role})`} />
  )
  const zone = s < 1 ? <>插值：落在 <Tex>{'\\epsilon_\\varnothing'}</Tex> 与 <Tex>{'\\epsilon_y'}</Tex> 之间</> : s === 1 ? <>正好等于 <Tex>{'\\epsilon_y'}</Tex>：普通条件生成</> : <>外推：越过 <Tex>{'\\epsilon_y'}</Tex> 继续往前</>

  return (
    <Demo
      title="CFG 是沿“条件方向”外推"
      hint={<><Tex>{'\\epsilon_y - \\epsilon_\\varnothing'}</Tex> 就是“加上条件 y 后预测变了多少”。<Tex>{'\\hat\\epsilon'}</Tex> 从 <Tex>{'\\epsilon_\\varnothing'}</Tex> 出发，沿这个方向走 s 倍。</>}
      onReset={() => setS(3)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="外推示意">
        <defs>
          {ROLES.map((k) => (
            <marker key={k} id={`${id}-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={`var(--c-${k})`} /></marker>
          ))}
        </defs>
        <line x1={x(l0[0])} y1={y(l0[1])} x2={x(l1[0])} y2={y(l1[1])} className="stroke-ref" />
        <text x={x(l1[0]) - 4} y={y(l1[1]) + 16} textAnchor="end">条件方向</text>
        <circle cx={x(0)} cy={y(0)} r={3} fill="var(--ink-3)" />
        <text x={x(0) + 6} y={y(0) + 16}>原点</text>
        {vec(EU, 'uncond')}
        {vec(EC, 'cond')}
        {vec(eh, 'guided')}
        <line x1={x(EU[0])} y1={y(EU[1])} x2={x(eh[0])} y2={y(eh[1])} stroke="var(--c-guided)" strokeWidth={8} opacity={0.13} strokeLinecap="round" />
        <circle cx={x(EU[0])} cy={y(EU[1])} r={5} fill="var(--c-uncond)" stroke="var(--card)" strokeWidth={2} />
        <text x={x(EU[0]) + 10} y={y(EU[1]) + 16}><tspan className="mathy">ε</tspan><Sub>∅</Sub> 无条件（s = 0）</text>
        <circle cx={x(EC[0])} cy={y(EC[1])} r={5} fill="var(--c-cond)" stroke="var(--card)" strokeWidth={2} />
        <text x={x(EC[0]) + 10} y={y(EC[1]) + 14}><tspan className="mathy">ε</tspan><Sub>y</Sub> 有条件（s = 1）</text>
        <circle cx={x(eh[0])} cy={y(eh[1])} r={6} fill="var(--c-guided)" stroke="var(--card)" strokeWidth={2} />
        <SvgTex x={x(eh[0]) - 10} y={y(eh[1]) - 8} w={130} align="end" color="var(--ink)"><Tex>{`\\hat\\epsilon\\;(s = ${s.toFixed(1)})`}</Tex></SvgTex>
      </svg>
      <div className="kb-legend">
        <span><i className="bg-uncond" />无条件预测 <Tex>{'\\epsilon_\\varnothing'}</Tex></span>
        <span><i className="bg-cond" />有条件预测 <Tex>{'\\epsilon_y'}</Tex></span>
        <span><i className="bg-guided" />CFG 结果 <Tex>{'\\hat\\epsilon'}</Tex></span>
      </div>
      <Slider label="guidance s" value={s} min={0} max={5} step={0.1} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-demo-readout">
        <span><b>{zone}</b></span>
        <Tex>{`\\hat\\epsilon = (1-s)\\,\\epsilon_\\varnothing + s\\,\\epsilon_y = (${(1 - s).toFixed(1)})\\,\\epsilon_\\varnothing + ${s.toFixed(1)}\\,\\epsilon_y`}</Tex>
      </div>
      {s > 1 && <p className="kb-demo-note">无条件那一项的系数变成负数，相当于在“推开”无条件预测。</p>}
    </Demo>
  )
}
