import { C, T } from '@/kb/components/Diagram'

/** UniVLA 各图共用的颜色：两套潜动作、语言、观测特征 */
export const U = {
  ti: 'var(--c-rand)',
  tc: 'var(--c-new)',
  lang: 'var(--c-act)',
  obs: C.obs,
}

/** 一个 token 片段：带色底的小圆角矩形，里面一行文字（可写公式） */
export function Chip({ x, y, w, h = 24, color, label, size = 11, dashed }: { x: number; y: number; w: number; h?: number; color: string; label: string; size?: number; dashed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={`color-mix(in srgb, ${color} 18%, var(--card))`} stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? '4 3' : undefined} />
      <T x={x + w / 2} y={y + h / 2} w={w + 16} size={size} weight={600}>{label}</T>
    </g>
  )
}

/** 一排 n 个小方块，表示一串 token */
export function Squares({ x, y, n, color, s = 11, gap = 3 }: { x: number; y: number; n: number; color: string; s?: number; gap?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * (s + gap)} y={y} width={s} height={s} rx={2} fill={`color-mix(in srgb, ${color} 35%, var(--card))`} stroke={color} strokeWidth={1} />
      ))}
    </g>
  )
}

export const squaresWidth = (n: number, s = 11, gap = 3) => n * s + (n - 1) * gap
