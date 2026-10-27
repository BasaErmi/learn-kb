import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { jacobian, softmax } from '../lib/softmax'
import { fix } from './common'

const PANELS = [
  { z: [1002, 980], zTex: 'z = (1002,\\ 980)', diff: '22', jTex: 'p_1(1 - p_1) \\approx 2.8 \\times 10^{-10}' },
  { z: [1.002, 0.98], zTex: 'z = (1.002,\\ 0.980)', diff: '0.022', jTex: 'p_1(1 - p_1) \\approx 0.25' },
]
const PW = 300, H = 200, BASE = 140, BH = 76, BW = 46

/** 相对差相同、绝对差差 1000 倍的两组 logits：前者几乎 one-hot、J 几乎为 0，后者几乎均匀 */
export function ScaleFigure() {
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${PW * 2 + 20} ${H}`} className="kb-chart" role="img" aria-label="两组相对差相同的 logits 经过 softmax 的结果对比">
          {PANELS.map((pn, k) => {
            const ox = k * (PW + 20), p = softmax(pn.z), j = jacobian(p)[0][0]
            return (
              <g key={k}>
                <SvgTex x={ox + PW / 2} y={20} w={PW} align="middle" size={13} color="var(--ink)"><Tex>{pn.zTex}</Tex></SvgTex>
                <text x={ox + PW / 2} y={38} textAnchor="middle" style={{ fontSize: 11.5 }}>绝对差 {pn.diff}</text>
                <line x1={ox + 60} x2={ox + PW - 60} y1={BASE} y2={BASE} className="axis" />
                {p.map((v, i) => {
                  const x = ox + PW / 2 + (i === 0 ? -BW - 14 : 14)
                  return (
                    <g key={i}>
                      <rect x={x} y={BASE - v * BH} width={BW} height={Math.max(v * BH, 0.5)} className="kb-sm-prob" />
                      <text x={x + BW / 2} y={BASE - v * BH - 5} textAnchor="middle" className="kb-sm-val">{fix(v, 3)}</text>
                      <SvgTex x={x + BW / 2} y={BASE + 18} w={40} align="middle" size={12} color="var(--ink-3)"><Tex>{`p_${i + 1}`}</Tex></SvgTex>
                    </g>
                  )
                })}
                <SvgTex x={ox + PW / 2} y={H - 8} w={PW} align="middle" size={12} color={j < 0.01 ? 'var(--c-grad)' : 'var(--ink-2)'}><Tex>{pn.jTex}</Tex></SvgTex>
              </g>
            )
          })}
          <line x1={PW + 10} x2={PW + 10} y1={10} y2={H - 10} stroke="var(--rule)" />
        </svg>
      </div>
      <figcaption>
        两组 logits 的相对差都是 2.2% 左右，但绝对差差了 1000 倍。左边几乎是 one-hot，Jacobian 的对角元只剩 <Tex>{'10^{-10}'}</Tex> 量级；右边几乎均匀，对角元接近最大值 0.25。
      </figcaption>
    </figure>
  )
}
