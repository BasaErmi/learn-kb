import type { ReactNode } from 'react'

/** SVG 文字里的下标：先下移再复位（Chrome 不支持 tspan 的 baseline-shift 复位） */
export function Sub({ children }: { children: ReactNode }) {
  return (
    <>
      <tspan dy={4} fontSize="0.74em">{children}</tspan>
      <tspan dy={-4}>{'​'}</tspan>
    </>
  )
}

/** SVG 里放一段 KaTeX 公式（组合重音符号如 ε̂、ᾱ 在 SVG 文本里会错位） */
export function SvgTex({ x, y, w = 160, h = 26, color, align = 'start', children }: { x: number; y: number; w?: number; h?: number; color?: string; align?: 'start' | 'middle' | 'end'; children: ReactNode }) {
  const left = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x
  return (
    <foreignObject x={left} y={y - h + 6} width={w} height={h} style={{ overflow: 'visible' }}>
      <div style={{ color, textAlign: align === 'middle' ? 'center' : align === 'end' ? 'right' : 'left', fontSize: 13, lineHeight: `${h}px`, whiteSpace: 'nowrap' }}>{children}</div>
    </foreignObject>
  )
}
