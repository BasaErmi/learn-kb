import { useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { P0, Q0, WEATHER, crossEntropy, entropy, kl, setProb } from '../lib/crossEntropy'
import { DistRow } from './DistRow'

const W = 560, H = 392, L = 78, R = 10
const ROW_P = { top: 22, h: 100 }, ROW_Q = { top: 162, h: 100 }
const BAR = { top: 318, h: 26 }
const LO = 0.02 // 每类概率的下限：Q_i → 0 时交叉熵趋于无穷
const X_MAX = 4 // 堆叠条的横轴 [0, 4] nat；LO = 0.02 时交叉熵最大约 3.91
const r2 = (v: number) => Math.round(v * 100) / 100

export function CrossEntropyKLDemo() {
  const [P, setP] = useState(P0)
  const [Q, setQ] = useState(Q0)
  const svg = useRef<SVGSVGElement>(null)
  const Hp = entropy(P)
  const ce = crossEntropy(P, Q)
  const d = kl(P, Q)
  const ceRev = crossEntropy(Q, P)
  const bx = (v: number) => L + (Math.min(v, X_MAX) / X_MAX) * (W - R - L)

  return (
    <Demo
      title="交叉熵 = 熵 + KL 散度"
      label="交叉熵与 KL 散度"
      hint="拖动两行柱子分别修改真实分布 $P$ 和模型分布 $Q$。下方的条是 $H(P, Q)$：灰色一段是熵 $H(P)$，只由 $P$ 决定，改 $Q$ 时纹丝不动；橙色一段是 $D_{\text{KL}}(P \,\|\, Q)$，把 $Q$ 拖成和 $P$ 一样，它就缩到 0。点“交换 $P$、$Q$”看交叉熵为什么不对称。"
      onReset={() => { setP(P0); setQ(Q0) }}
      note="单位是 nat。每类概率不低于 0.02：$Q_i \to 0$ 而 $P_i > 0$ 时 $-P_i \ln Q_i \to \infty$。KL 散度直接按 $\sum_i P_i \ln \frac{P_i}{Q_i}$ 计算，和 $H(P, Q) - H(P)$ 一致。"
    >
      <div className="kb-controls">
        <button type="button" className="kb-btn-ghost" aria-label="交换 P 和 Q" onClick={() => { setP(Q); setQ(P) }}>
          交换 <Tex>{'P'}</Tex>、<Tex>{'Q'}</Tex>
        </button>
        <button type="button" className="kb-btn-ghost" aria-label="令 Q 等于 P" onClick={() => setQ(P)}>
          令 <Tex>{'Q = P'}</Tex>
        </button>
      </div>
      <div className="kb-svg-scroll">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="kb-chart kb-sm-bars" role="group" aria-label="真实分布 P、模型分布 Q 和交叉熵的分解">
          <SvgTex x={4} y={ROW_P.top + ROW_P.h / 2 + 6} w={70} size={13}>真实 <Tex>{'P'}</Tex></SvgTex>
          <DistRow values={P} names={WEATHER} x0={L} x1={W - R} top={ROW_P.top} h={ROW_P.h} fill="var(--c-data)" prefix="P"
            onSet={(i, v) => setP((old) => setProb(old, i, r2(v), LO))} svg={svg} viewH={H} />
          <SvgTex x={4} y={ROW_Q.top + ROW_Q.h / 2 + 6} w={70} size={13}>模型 <Tex>{'Q'}</Tex></SvgTex>
          <DistRow values={Q} names={WEATHER} x0={L} x1={W - R} top={ROW_Q.top} h={ROW_Q.h} fill="var(--c-prob)" prefix="Q"
            onSet={(i, v) => setQ((old) => setProb(old, i, r2(v), LO))} svg={svg} viewH={H} />
          {WEATHER.map((c, i) => (
            <text key={c} x={L + (i + 0.5) * ((W - R - L) / WEATHER.length)} y={ROW_Q.top + ROW_Q.h + 18} textAnchor="middle" className="kb-sm-class">{c}</text>
          ))}

          {/* 堆叠条：H(P) + KL = H(P,Q) */}
          <SvgTex x={4} y={BAR.top + BAR.h / 2 + 6} w={70} size={13}><Tex>{'H(P,Q)'}</Tex></SvgTex>
          <rect x={L} y={BAR.top} width={bx(Hp) - L} height={BAR.h} fill="var(--c-data)" />
          <rect x={bx(Hp)} y={BAR.top} width={Math.max(0, bx(ce) - bx(Hp))} height={BAR.h} fill="var(--c-grad)" />
          <SvgTex x={(L + bx(Hp)) / 2} y={BAR.top + BAR.h / 2 + 5} w={90} align="middle" size={11} color="var(--ink)"><Tex>{'H(P)'}</Tex></SvgTex>
          {bx(ce) - bx(Hp) > 46 && (
            <SvgTex x={(bx(Hp) + bx(ce)) / 2} y={BAR.top + BAR.h / 2 + 5} w={90} align="middle" size={11} color="var(--card)"><Tex>{'D_{\\text{KL}}'}</Tex></SvgTex>
          )}
          <line className="axis" x1={L} x2={W - R} y1={BAR.top + BAR.h + 4} y2={BAR.top + BAR.h + 4} />
          {[0, 1, 2, 3, 4].map((v) => <text key={v} x={bx(v)} y={BAR.top + BAR.h + 18} textAnchor="middle">{v}</text>)}
        </svg>
      </div>
      <div className="kb-demo-readout">
        <span><Tex>{'H(P)'}</Tex> = <b>{Hp.toFixed(3)}</b></span>
        <span><Tex>{'D_{\\text{KL}}(P \\,\\|\\, Q)'}</Tex> = <b>{d.toFixed(3)}</b></span>
        <span><Tex>{'H(P, Q)'}</Tex> = <b>{ce.toFixed(3)}</b></span>
        <span>交换后 <Tex>{'H(Q, P)'}</Tex> = <b>{ceRev.toFixed(3)}</b></span>
      </div>
    </Demo>
  )
}
