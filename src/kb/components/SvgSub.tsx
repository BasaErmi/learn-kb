import type { ReactNode } from 'react'

/** SVG 里放一段 KaTeX 公式（组合重音符号如 ε̂、ᾱ 在 SVG 文本里会错位） */
export function SvgTex({ x, y, w = 160, h = 26, size = 13, color, align = 'start', children }: { x: number; y: number; w?: number; h?: number; size?: number; color?: string; align?: 'start' | 'middle' | 'end'; children: ReactNode }) {
  const left = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x
  return (
    <foreignObject x={left} y={y - h + 6} width={w} height={h} style={{ overflow: 'visible' }}>
      <div style={{ color, textAlign: align === 'middle' ? 'center' : align === 'end' ? 'right' : 'left', fontFamily: 'var(--sans)', fontSize: size, lineHeight: `${h}px`, whiteSpace: 'nowrap' }}>{children}</div>
    </foreignObject>
  )
}
