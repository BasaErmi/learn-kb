import { Tex } from '@/kb/components/Tex'
import { encoderStages } from '../lib/ldm'

type Kind = 'io' | 'level' | 'mid' | 'neck' | 'z'
const COLOR: Record<Kind, string> = { io: 'var(--c-data)', level: 'var(--c-cond)', mid: 'var(--c-uncond)', neck: 'var(--c-guided)', z: 'var(--accent)' }
const H = 256

/** SD VAE encoder 各层的分辨率和通道数：宽度 ∝ log 分辨率，高度 ∝ log 通道数 */
export function EncoderFigure() {
  const h = H / 8
  const bs: { name: string; res: number; ch: number; kind: Kind }[] = [
    { name: '输入', res: H, ch: 3, kind: 'io' },
    { name: 'conv_in', res: H, ch: 128, kind: 'level' },
    ...encoderStages(H).map((s) => ({ name: `层级 ${s.level}`, res: s.res, ch: s.ch, kind: 'level' as Kind })),
    { name: 'mid', res: h, ch: 512, kind: 'mid' },
    { name: 'conv_out', res: h, ch: 8, kind: 'neck' },
    { name: 'quant_conv', res: h, ch: 8, kind: 'neck' },
    { name: 'z', res: h, ch: 4, kind: 'z' },
  ]
  const W = 640, base = 170, colW = W / bs.length
  const bh = (ch: number) => 14 + (Math.log2(ch) / Math.log2(512)) * 110
  const bw = (res: number) => 10 + (Math.log2(res) / Math.log2(H)) * (colW - 22)
  const neck = bs.findIndex((b) => b.name === 'conv_out')
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} 230`} className="kb-chart" role="img" aria-label="SD VAE encoder 各层的分辨率和通道数">
          {bs.map((b, i) => {
            const cx = colW * i + colW / 2, w = bw(b.res), hh = bh(b.ch)
            return (
              <g key={b.name}>
                <rect x={cx - w / 2} y={base - hh} width={w} height={hh} rx={3} fill={`color-mix(in srgb, ${COLOR[b.kind]} ${b.kind === 'neck' ? 40 : 18}%, var(--card))`} stroke={COLOR[b.kind]} strokeWidth={b.kind === 'neck' ? 1.8 : 1} />
                <text x={cx} y={base + 16} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 10.5 }}>{b.name}</text>
                <text x={cx} y={base + 30} textAnchor="middle" style={{ fontSize: 9.5, fontFamily: 'var(--mono)' }}>{b.res}×{b.res}</text>
                <text x={cx} y={base + 43} textAnchor="middle" style={{ fontSize: 9.5, fontFamily: 'var(--mono)' }}>{b.ch} 通道</text>
                {i < bs.length - 1 && <line x1={cx + w / 2 + 2} x2={colW * (i + 1) + colW / 2 - bw(bs[i + 1].res) / 2 - 2} y1={base - 7} y2={base - 7} className="axis" />}
              </g>
            )
          })}
          <text x={colW * neck + colW / 2} y={base - bh(8) - 34} textAnchor="middle" style={{ fill: 'var(--c-guided)', fontWeight: 600 }}>瓶颈：512 → 8</text>
          <line x1={colW * neck + colW / 2} x2={colW * neck + colW / 2} y1={base - bh(8) - 28} y2={base - bh(8) - 4} stroke="var(--c-guided)" />
        </svg>
      </div>
      <figcaption>
        SD VAE（<Tex>{'f = 8'}</Tex>）的 encoder，输入 256×256。方块宽度表示空间分辨率、高度表示通道数（都是对数刻度）。前三个层级结尾各下采样一次，共 <Tex>{'\\log_2 8 = 3'}</Tex> 次：256 → 128 → 64 → 32；通道一路增加到 512，直到 <code>conv_out</code> 一个卷积压到 8，再切成 <Tex>{'\\mu'}</Tex> 和 <Tex>{'\\log\\sigma^2'}</Tex> 各 4 个通道。
      </figcaption>
    </figure>
  )
}
