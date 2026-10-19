import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { crossAttnSize, selfAttnSize, transformerParams } from '../lib/ldm'
import { wan } from '../lib/img'

const LEVELS = [
  { res: 64, C: 320, attn: true },
  { res: 32, C: 640, attn: true },
  { res: 16, C: 1280, attn: true },
  { res: 8, C: 1280, attn: false },
]
const HEADS = 8

export function FlattenAttnDemo() {
  const [li, setLi] = useState(0)
  const { res, C, attn } = LEVELS[li]
  const N = res * res
  const p = transformerParams(C)
  const g = 8 // 画 8×8 示意格子
  const mb = (selfAttnSize(N) * HEADS * 2) / 2 ** 20
  return (
    <Demo
      title="把特征图展平成 token 再做注意力"
      label="展平做 self-attention"
      hint="SD 1.x 生成 512×512 图时 UNet 各层级的特征图。每个空间位置是一个 token，向量维度就是通道数 $C$。"
      onReset={() => setLi(0)}
      note="显存按 fp16、8 个头、batch 为 1、只存一层的注意力矩阵估算；实际实现会用 FlashAttention 等方法避免把整个矩阵存下来。"
    >
      <Seg label="UNet 层级" value={li} onChange={setLi} options={LEVELS.map((l, i) => ({ value: i, label: `${l.res}×${l.res} · ${l.C}` }))} />
      <div className="kb-svg-scroll">
        <svg viewBox="0 0 640 150" className="kb-chart" role="img" aria-label={`${res}×${res} 特征图展平成 ${N} 个 token`}>
          {Array.from({ length: g * g }, (_, i) => (
            <rect key={i} x={20 + (i % g) * 14} y={14 + Math.floor(i / g) * 14} width={12} height={12} rx={2} fill={`color-mix(in srgb, var(--c-cond) ${12 + ((i * 37) % 50)}%, var(--card))`} />
          ))}
          <text x={20} y={142}>{`特征图 ${res}×${res}×${C}`}</text>
          <line x1={150} x2={200} y1={70} y2={70} className="axis" />
          <text x={175} y={62} textAnchor="middle">展平</text>
          {Array.from({ length: 28 }, (_, i) => (
            <rect key={i} x={210 + i * 14} y={60} width={12} height={22} rx={2} fill={`color-mix(in srgb, var(--c-cond) ${12 + ((i * 37) % 50)}%, var(--card))`} />
          ))}
          <text x={610} y={76} textAnchor="end">…</text>
          <text x={210} y={108}>{`N = ${res}×${res} = ${N.toLocaleString('en-US')} 个 token，每个 ${C} 维`}</text>
          <text x={210} y={128}>{attn ? '没有位置编码：前后的卷积（零填充）已经把位置信息编进特征' : '这一层级在 SD 1.x 中没有注意力模块'}</text>
        </svg>
      </div>
      <table className="kb-num-table">
        <thead><tr><th>量</th><th>大小</th></tr></thead>
        <tbody>
          <tr><td>self-attention 矩阵 <Tex>{'N\\times N'}</Tex>（每个头）</td><td>{attn ? wan(selfAttnSize(N)) : '—'}</td></tr>
          <tr><td>cross-attention 矩阵 <Tex>{'N\\times M'}</Tex>，<Tex>{'M = 77'}</Tex></td><td>{attn ? wan(crossAttnSize(N, 77)) : '—'}</td></tr>
          <tr><td>self-attention 显存（8 头，fp16）</td><td>{attn ? `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB` : '—'}</td></tr>
          <tr><td><code>proj_in</code> + <code>proj_out</code>（两个 <Tex>{'1\\times1'}</Tex> 卷积）<Tex>{'2C^2'}</Tex></td><td>{wan(p.proj)}</td></tr>
          <tr><td>self-attention <Tex>{'W_Q,W_K,W_V,W_O'}</Tex>：<Tex>{'4C^2'}</Tex></td><td>{wan(p.self)}</td></tr>
          <tr><td>cross-attention：<Tex>{'2C^2 + 2\\cdot 768\\cdot C'}</Tex></td><td>{wan(p.cross)}</td></tr>
          <tr><td>FFN（GEGLU）：<Tex>{'12C^2'}</Tex></td><td>{wan(p.ffn)}</td></tr>
          <tr className="is-total"><td>一个 Transformer block 合计</td><td>{wan(p.total)}</td></tr>
        </tbody>
      </table>
    </Demo>
  )
}
