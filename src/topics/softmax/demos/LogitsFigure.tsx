import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z5 } from '../lib/softmax'
import { CLASSES } from './common'

const W = 640, H = 230
const ROW0 = 46, ROW_H = 30 // logits 每类一行
const ZERO = 520, UNIT = 34 // 柱状图的 0 位置和每单位的像素

function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke="var(--ink-3)" strokeWidth={1.3} fill="none">
      <line x1={x1} x2={x2} y1={y} y2={y} />
      <polyline points={`${x2 - 6},${y - 4} ${x2},${y} ${x2 - 6},${y + 4}`} />
    </g>
  )
}

/** 示意：图片 → 特征 → 线性层 → 每类一个 logit（第 1 步的 z，可正可负、和不为 1） */
export function LogitsFigure() {
  const mid = ROW0 + ROW_H * 2
  const feat = [0.8, 0.3, 0.55, 0.15, 0.9, 0.4, 0.65, 0.25]
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="分类网络的最后一层输出每类一个 logit">
          {/* 输入图片 */}
          <defs><clipPath id="kb-logits-img"><rect x={8} y={mid - 34} width={68} height={68} rx={4} /></clipPath></defs>
          <image href={`${import.meta.env.BASE_URL}images/softmax/cat.jpg`} x={8} y={mid - 34} width={68} height={68} clipPath="url(#kb-logits-img)" preserveAspectRatio="xMidYMid slice" />
          <rect x={8} y={mid - 34} width={68} height={68} rx={4} fill="none" stroke="var(--rule)" />
          <text x={42} y={mid + 56} textAnchor="middle" style={{ fontSize: 11 }}>输入图片</text>
          <Arrow x1={82} x2={112} y={mid} />

          {/* 特征向量 h */}
          {feat.map((v, i) => (
            <rect key={i} x={120} y={mid - 48 + i * 12} width={16} height={11} fill={`color-mix(in srgb, var(--ink-2) ${Math.round(15 + v * 60)}%, var(--card))`} />
          ))}
          <SvgTex x={128} y={mid + 64} w={80} align="middle" size={11} color="var(--ink-3)">特征 <Tex>{'h'}</Tex></SvgTex>
          <Arrow x1={144} x2={174} y={mid} />

          {/* 线性层 */}
          <rect x={180} y={mid - 30} width={116} height={60} rx={6} fill="var(--key-soft)" stroke="var(--key)" />
          <text x={238} y={mid - 8} textAnchor="middle" style={{ fill: 'var(--key)', fontSize: 12, fontWeight: 600 }}>线性层</text>
          <SvgTex x={238} y={mid + 16} w={110} align="middle" size={13} color="var(--ink)"><Tex>{'z = Wh + b'}</Tex></SvgTex>
          <text x={238} y={mid + 56} textAnchor="middle" style={{ fontSize: 11 }}>网络最后一层</text>
          <Arrow x1={302} x2={332} y={mid} />

          {/* logits：每类一个任意实数 */}
          <SvgTex x={ZERO} y={ROW0 - 22} w={200} align="middle" size={12} color="var(--ink-2)">logits <Tex>{'z_i'}</Tex>（每类一个）</SvgTex>
          <line x1={ZERO} x2={ZERO} y1={ROW0 - 12} y2={ROW0 + ROW_H * 5 - 14} className="axis" />
          {Z5.map((z, i) => {
            const y = ROW0 + i * ROW_H
            const x0 = Math.min(ZERO, ZERO + z * UNIT), w = Math.abs(z) * UNIT
            return (
              <g key={i}>
                <text x={348} y={y + 4} style={{ fill: 'var(--ink)', fontSize: 12 }}>{CLASSES[i]}</text>
                <SvgTex x={410} y={y + 9} w={50} size={12} color="var(--ink-3)"><Tex>{`z_${i + 1}`}</Tex></SvgTex>
                <rect x={x0} y={y - 8} width={w} height={16} rx={2} fill={z < 0 ? 'var(--c-grad)' : 'var(--ink-2)'} opacity={0.85} />
                <text x={z < 0 ? x0 - 5 : x0 + w + 5} y={y + 4} textAnchor={z < 0 ? 'end' : 'start'} style={{ fill: z < 0 ? 'var(--c-grad)' : 'var(--ink)', fontSize: 12, fontFamily: 'var(--mono)' }}>{z}</text>
              </g>
            )
          })}
          <SvgTex x={ZERO} y={ROW0 + ROW_H * 5 + 14} w={260} align="middle" size={12} color="var(--c-grad)">有负数，<Tex>{'\\sum_i z_i = 1.5 \\ne 1'}</Tex>：还不是概率</SvgTex>
        </svg>
      </div>
      <figcaption>
        示意：网络对一张猫的图片给出 5 个 logits，就是下面例子里的 <Tex>{'z = (2, 1, 0.5, -0.5, -1.5)'}</Tex>。它们是任意实数，橙色的两个是负数，加起来是 1.5。
      </figcaption>
    </figure>
  )
}
