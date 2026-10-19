import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { img } from '../lib/img'
import measured from '../lib/measured.json'

const S = 0.18215
const L = measured.latent

/** 原始 latent 的直方图（10 张图汇总）与缩放后对照 N(0, 1) */
export function LatentStats() {
  const [scaled, setScaled] = useState(false)
  const W = 620, H = 220, x0 = 40, x1 = 600, yb = 180, yt = 20
  const range = 20 // 两种尺度共用同一个坐标轴
  const X = (v: number) => x0 + ((v + range) / (2 * range)) * (x1 - x0)
  const total = L.hist.reduce((a, b) => a + b, 0)
  const bw = L.edges[1] - L.edges[0]
  // 密度：count / (total · 宽度)；缩放后宽度乘 s，密度除以 s
  const bars = L.hist.map((c, i) => {
    const lo = L.edges[i] * (scaled ? S : 1), hi = L.edges[i + 1] * (scaled ? S : 1)
    return { lo, hi, d: c / total / (bw * (scaled ? S : 1)) }
  })
  const yMax = 0.45
  const Y = (d: number) => yb - Math.min(1, d / yMax) * (yb - yt)
  const gauss = Array.from({ length: 161 }, (_, i) => -range + (i * 2 * range) / 160).map((v) => [v, Math.exp(-v * v / 2) / Math.sqrt(2 * Math.PI)])
  const std = scaled ? L.std_raw * S : L.std_raw
  return (
    <Demo
      title="latent 的数值尺度：缩放前后"
      label="latent 直方图与缩放"
      hint="上面是一张人像编码后的 4 个通道；下面是 10 张测试图全部 latent 数值的分布。切换到“乘以 $s$”，看它和标准正态的尺度是否对上。"
      onReset={() => setScaled(false)}
      note={`统计用的是 encoder 输出的均值 $\\mu$，在 ${L.n_images} 张公开测试图上算出 $\\operatorname{std}(z) = ${L.std_raw.toFixed(2)}$；SD 官方在训练数据上算出 5.49，于是 $s = 0.18215$。`}
    >
      <div className="kb-strip" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <figure><img src={img('rec-astronaut-orig.jpg')} alt="原图" /><span className="kb-tag">原图</span></figure>
        {[0, 1, 2, 3].map((c) => (
          <figure key={c}><img src={img(`latent-ch${c}.png`)} alt={`第 ${c + 1} 个通道`} style={{ imageRendering: 'pixelated' }} /><span className="kb-tag">通道 {c + 1}</span></figure>
        ))}
      </div>
      <Seg label="尺度" value={scaled ? 1 : 0} onChange={(v) => setScaled(v === 1)} options={[{ value: 0, label: '原始 latent' }, { value: 1, label: <>乘以 <Tex>s = 0.18215</Tex></>, aria: '乘以 s' }]} />
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="latent 数值直方图">
        <line x1={x0} x2={x1} y1={yb} y2={yb} className="axis" />
        {bars.filter((b) => b.hi > -range && b.lo < range).map((b, i) => (
          <rect key={i} x={X(Math.max(b.lo, -range)) + 0.5} width={Math.max(0.5, X(Math.min(b.hi, range)) - X(Math.max(b.lo, -range)) - 1)} y={Y(b.d)} height={yb - Y(b.d)} className="fill-data" />
        ))}
        <path d={gauss.map(([v, d], i) => `${i ? 'L' : 'M'}${X(v).toFixed(1)},${Y(d).toFixed(1)}`).join('')} className="stroke-uncond" />
        {[-range, -range / 2, 0, range / 2, range].map((v) => <text key={v} x={X(v)} y={yb + 16} textAnchor="middle">{v}</text>)}
        <SvgTex x={X(1.4)} y={yt + 24} w={160} size={12} color="var(--c-uncond)"><Tex>{'\\mathcal{N}(0, 1)'}</Tex></SvgTex>
      </svg>
      <p className="kb-demo-readout">
        <span>标准差 = <b>{std.toFixed(2)}</b></span>
        <span>{scaled ? '和绿色的标准正态尺度相当，但形状仍然不是正态' : '比标准正态宽 5 倍以上'}</span>
      </p>
    </Demo>
  )
}
