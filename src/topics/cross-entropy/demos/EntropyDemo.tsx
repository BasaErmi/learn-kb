import { useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { P0, WEATHER, entropy, info, setProb } from '../lib/crossEntropy'
import { DistRow } from './DistRow'

const W = 560, H = 330, L = 78, R = 10
const ROW_P = { top: 22, h: 120 }, ROW_T = { top: 196, h: 90 }
const T_MAX = 0.4 // 第二行 P_i·(−ln P_i) 的纵轴上限；单项最大是 1/e ≈ 0.368
const colW = (W - L - R) / WEATHER.length
const cx = (i: number) => L + (i + 0.5) * colW
const BW = 40
const LN4 = Math.log(4)

const PRESETS: { label: string; P: number[] }[] = [
  { label: '均匀', P: [0.25, 0.25, 0.25, 0.25] },
  { label: '偏斜', P: P0 },
  { label: 'one-hot', P: [1, 0, 0, 0] },
]

export function EntropyDemo() {
  const [P, setP] = useState(P0)
  const svg = useRef<SVGSVGElement>(null)
  const terms = P.map((p) => (p > 0 ? p * info(p) : 0))
  const Hp = entropy(P)
  const ty = (v: number) => ROW_T.top + ROW_T.h - (v / T_MAX) * ROW_T.h

  return (
    <Demo
      title="熵：信息量按概率加权平均"
      label="熵"
      hint="上下拖动第一行的柱子（或点选后按 ↑ ↓）修改某一天气的概率，其余几类按原比例分掉剩下的部分。第二行是每一类对熵的贡献 $P_i \cdot (-\ln P_i)$，加起来就是 $H(P)$。分布越平，熵越大；全部压到一类上，熵为 0。"
      onReset={() => setP(P0)}
      note="单位是 nat（自然对数）。第二行纵轴固定在 $[0, 0.4]$：单项 $P_i \cdot (-\ln P_i)$ 在 $P_i = \frac{1}{e}$ 时最大，约 0.368。四类时熵的上限是 $\ln 4 \approx 1.386$。"
    >
      <div className="kb-controls">
        {PRESETS.map((s) => (
          <button key={s.label} type="button" className="kb-btn-ghost" onClick={() => setP(s.P)}>{s.label}</button>
        ))}
      </div>
      <div className="kb-svg-scroll">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="kb-chart kb-sm-bars" role="group" aria-label="分布 P 和每一类对熵的贡献">
          <SvgTex x={4} y={ROW_P.top + ROW_P.h / 2 + 6} w={66} size={14}><Tex>{'P_i'}</Tex></SvgTex>
          <text x={L - 6} y={ROW_P.top + 4} textAnchor="end">1</text>
          <DistRow values={P} names={WEATHER} x0={L} x1={W - R} top={ROW_P.top} h={ROW_P.h} fill="var(--c-prob)" prefix="P"
            onSet={(i, v) => setP((old) => setProb(old, i, Math.round(v * 100) / 100))} svg={svg} viewH={H} />

          <SvgTex x={4} y={ROW_T.top + ROW_T.h / 2 + 6} w={72} size={13}><Tex>{'-P_i \\ln P_i'}</Tex></SvgTex>
          <line className="axis" x1={L} x2={W - R} y1={ty(0)} y2={ty(0)} />
          <line className="grid" x1={L} x2={W - R} y1={ty(1 / Math.E)} y2={ty(1 / Math.E)} strokeDasharray="3 3" />
          <SvgTex x={L - 6} y={ty(1 / Math.E) + 4} w={30} align="end" size={10} color="var(--ink-3)"><Tex>{'\\tfrac{1}{e}'}</Tex></SvgTex>
          {terms.map((v, i) => (
            <g key={i}>
              <rect x={cx(i) - BW / 2} y={ty(v)} width={BW} height={ty(0) - ty(v)} fill="var(--c-exp)" opacity={0.8} />
              <text x={cx(i)} y={ty(v) - 5} textAnchor="middle" className="kb-sm-val">{v.toFixed(3)}</text>
            </g>
          ))}
          {WEATHER.map((c, i) => <text key={c} x={cx(i)} y={H - 6} textAnchor="middle" className="kb-sm-class">{c}</text>)}
        </svg>
      </div>
      <div className="kb-demo-readout">
        <span><Tex>{'H(P) = -\\sum_i P_i \\ln P_i'}</Tex> = <b>{Hp.toFixed(3)}</b></span>
        <span>上限 <Tex>{'\\ln 4'}</Tex> = <b>{LN4.toFixed(3)}</b></span>
        <span>相当于上限的 <b>{((Hp / LN4) * 100).toFixed(0)}%</b></span>
      </div>
    </Demo>
  )
}
