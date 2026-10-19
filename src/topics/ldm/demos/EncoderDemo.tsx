import { useState, type ReactNode } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { encoderStages } from '../lib/ldm'

interface Block { name: string; res: number; ch: number; kind: 'io' | 'level' | 'mid' | 'neck' | 'z'; text: ReactNode }

function blocks(H: number): Block[] {
  const st = encoderStages(H)
  const lv: Block[] = st.map((s) => ({
    name: `层级 ${s.level}`, res: s.res, ch: s.ch, kind: 'level',
    text: <>ResBlock × 2，{s.res}×{s.res}，{s.ch} 通道。{s.down ? <>结尾用步长 2 的卷积下采样一次，长宽各减半。</> : <>最后一级，<b>不再下采样</b>。</>}</>,
  }))
  const h = H / 8
  return [
    { name: '输入', res: H, ch: 3, kind: 'io', text: <>图像 <Tex>{`x \\in \\mathbb{R}^{${H}\\times${H}\\times 3}`}</Tex>，像素归一化到 <Tex>{'[-1, 1]'}</Tex>。</> },
    { name: 'conv_in', res: H, ch: 128, kind: 'level', text: <><Tex>{'3\\times3'}</Tex> 卷积，3 → 128 通道。</> },
    ...lv,
    { name: 'mid', res: h, ch: 512, kind: 'mid', text: <>ResBlock → self-attention → ResBlock，仍是 512 通道。注意力放在这里，因为分辨率最低、代价最小。</> },
    { name: 'conv_out', res: h, ch: 8, kind: 'neck', text: <>GroupNorm → SiLU → <Tex>{'3\\times3'}</Tex> 卷积，<b>512 → 8</b>。通道压缩只发生在这一个卷积上，这里才是真正的瓶颈。</> },
    { name: 'quant_conv', res: h, ch: 8, kind: 'neck', text: <><Tex>{'1\\times1'}</Tex> 卷积，8 → 8。名字沿用自 VQ 版本，KL 版本里没有量化，只是一个线性变换。</> },
    { name: 'z', res: h, ch: 4, kind: 'z', text: <>8 个通道切成两半：<Tex>{'\\mu'}</Tex>（4 个）和 <Tex>{'\\log\\sigma^2'}</Tex>（4 个），再做重参数化 <Tex>{'z = \\mu + \\sigma \\odot \\epsilon'}</Tex>，得到 <Tex>{`${h}\\times${h}\\times 4`}</Tex>。</> },
  ]
}

const COLOR: Record<Block['kind'], string> = { io: 'var(--c-data)', level: 'var(--c-cond)', mid: 'var(--c-uncond)', neck: 'var(--c-guided)', z: 'var(--accent)' }

export function EncoderDemo() {
  const [H, setH] = useState(256)
  const [k, setK] = useState(6)
  const bs = blocks(H)
  const W = 640, base = 170, colW = W / bs.length
  const bh = (ch: number) => 14 + (Math.log2(ch) / Math.log2(512)) * 110
  const bw = (res: number) => 10 + (Math.log2(res) / Math.log2(H)) * (colW - 22)
  return (
    <Demo title="SD VAE 的 encoder：一层层往下走" label="encoder 结构拆解" hint="方块的宽度表示空间分辨率（对数刻度），高度表示通道数。点击方块查看这一层做了什么。" onReset={() => { setH(256); setK(6) }}>
      <Seg label="输入分辨率" value={H} onChange={setH} options={[256, 512].map((v) => ({ value: v, label: `输入 ${v}×${v}` }))} />
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} 215`} className="kb-chart" role="img" aria-label="encoder 各层的分辨率和通道数">
          {bs.map((b, i) => {
            const cx = colW * i + colW / 2, w = bw(b.res), h = bh(b.ch)
            return (
              <g key={b.name} style={{ cursor: 'pointer' }} onClick={() => setK(i)} role="button" tabIndex={0} aria-label={`${b.name}：${b.res}×${b.res}×${b.ch}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setK(i) }}>
                <rect x={cx - w / 2} y={base - h} width={w} height={h} rx={3} fill={`color-mix(in srgb, ${COLOR[b.kind]} ${i === k ? 45 : 18}%, var(--card))`} stroke={COLOR[b.kind]} strokeWidth={i === k ? 2.2 : 1} />
                <text x={cx} y={base + 16} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 10.5 }}>{b.name}</text>
                <text x={cx} y={base + 30} textAnchor="middle" style={{ fontSize: 9.5, fontFamily: 'var(--mono)' }}>{b.res}×{b.res}</text>
                <text x={cx} y={base + 43} textAnchor="middle" style={{ fontSize: 9.5, fontFamily: 'var(--mono)' }}>{b.ch} 通道</text>
                {i < bs.length - 1 && <line x1={cx + w / 2 + 2} x2={colW * (i + 1) + colW / 2 - bw(bs[i + 1].res) / 2 - 2} y1={base - 7} y2={base - 7} className="axis" />}
              </g>
            )
          })}
        </svg>
      </div>
      <p className="kb-demo-readout"><span>下采样次数 <Tex>{'\\log_2 8 = 3'}</Tex>：{H} → {H / 2} → {H / 4} → {H / 8}</span></p>
      <p className="kb-demo-note"><b>{bs[k].name}</b>（{bs[k].res}×{bs[k].res}×{bs[k].ch}）：{bs[k].text}</p>
      <div className="kb-presets">
        <button type="button" className="kb-btn-ghost" onClick={() => setK((k + bs.length - 1) % bs.length)}>上一层</button>
        <button type="button" className="kb-btn" onClick={() => setK((k + 1) % bs.length)}>下一层</button>
      </div>
    </Demo>
  )
}
