import { useId, type ReactNode } from 'react'
import { TexText } from '@/kb/components/Tex'

/** LAPO 各架构图共用的 SVG 积木：文字（可夹公式）、方框、箭头、观测帧 */

export const C = {
  obs: 'var(--c-obs)',
  idm: 'var(--c-idm)',
  fdm: 'var(--c-fdm)',
  z: 'var(--c-latent)',
  act: 'var(--c-act)',
  pi: 'var(--c-pi)',
  ink: 'var(--ink)',
  ink2: 'var(--ink-2)',
  ink3: 'var(--ink-3)',
  accent: 'var(--accent)',
}

/** 每种颜色一个箭头 marker；id 带 useId 前缀，页面上多张图不会互相串 */
export function useArrows(colors: Record<string, string>) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const defs = (
    <defs>
      {Object.entries(colors).map(([k, c]) => (
        <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill={c} />
        </marker>
      ))}
    </defs>
  )
  return { defs, end: (k: string) => `url(#${uid}-${k})` }
}

/** 以 (x, y) 为中心（align=middle 时）或左/右端点放一行文字，里面可以写 $...$ */
export function T({ x, y, children, w = 220, size = 12, color = C.ink, align = 'middle', weight }: { x: number; y: number; children: string; w?: number; size?: number; color?: string; align?: 'start' | 'middle' | 'end'; weight?: number }) {
  const lh = Math.round(size * 1.7)
  const left = align === 'middle' ? x - w / 2 : align === 'end' ? x - w : x
  return (
    <foreignObject x={left} y={y - lh / 2} width={w} height={lh} style={{ overflow: 'visible' }}>
      <div className="kb-dg-text" style={{ color, fontSize: size, lineHeight: `${lh}px`, textAlign: align === 'middle' ? 'center' : align === 'end' ? 'right' : 'left', fontWeight: weight }}>
        <TexText>{children}</TexText>
      </div>
    </foreignObject>
  )
}

/** 带浅色底的方框，title 一行、sub 一行（都可写公式）；frozen 用虚线边表示参数冻结 */
export function Box({ x, y, w, h, color, title, sub, frozen, tint = 12, titleSize = 13, subSize = 10.5 }: { x: number; y: number; w: number; h: number; color: string; title: string; sub?: string; frozen?: boolean; tint?: number; titleSize?: number; subSize?: number }) {
  const cx = x + w / 2, cy = y + h / 2
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={`color-mix(in srgb, ${frozen ? C.ink3 : color} ${frozen ? 8 : tint}%, var(--card))`} stroke={color} strokeWidth={1.4} strokeDasharray={frozen ? '5 3' : undefined} />
      {sub ? (
        <>
          <T x={cx} y={cy - 8} w={w + 30} size={titleSize} weight={600}>{title}</T>
          <T x={cx} y={cy + 11} w={w + 30} size={subSize} color={C.ink2}>{sub}</T>
        </>
      ) : (
        <T x={cx} y={cy} w={w + 30} size={titleSize} weight={600}>{title}</T>
      )}
    </g>
  )
}

/** 一条折线箭头；dashed 用于“只在训练时 / 反向传播 / 提供标签”这类辅助路径 */
export function Arrow({ d, color, marker, dashed, width = 1.5 }: { d: string; color: string; marker?: string; dashed?: boolean; width?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? '5 4' : undefined} markerEnd={marker} strokeLinejoin="round" />
}

/** 一帧游戏画面的示意：灰底方块 + 几个像素块，label 写在帧里 */
export function Frame({ x, y, s = 46, w = s, label, color = C.obs, hot, size = 13 }: { x: number; y: number; s?: number; w?: number; label: string; color?: string; hot?: boolean; size?: number }) {
  const p = s / 6
  return (
    <g>
      <rect x={x} y={y} width={w} height={s} rx={4} fill={`color-mix(in srgb, ${color} 16%, var(--card))`} stroke={hot ? C.accent : color} strokeWidth={hot ? 2 : 1.2} />
      <rect x={x + p} y={y + s - 2 * p} width={w - 2 * p} height={p * 0.8} fill={color} opacity={0.35} />
      <rect x={x + w - 2.4 * p} y={y + p} width={p * 1.2} height={p * 1.2} fill={color} opacity={0.4} />
      <T x={x + w / 2} y={y + s / 2 - 2} w={w + 20} size={size} weight={600}>{label}</T>
    </g>
  )
}

/** 图外框：可选的控件（如分段按钮）+ 可横向滚动的 SVG + 图注（图注是字符串时按 `$...$` 渲染公式）；四周留 PAD 的边，贴边的线和字不会被裁掉 */
const PAD = 8
export function DiagramFigure({ w, h, label, children, caption, schematic, controls }: { w: number; h: number; label: string; children: ReactNode; caption: ReactNode; schematic?: boolean; controls?: ReactNode }) {
  return (
    <figure className="kb-figure kb-diagram">
      {controls && <div className="kb-controls kb-paperfig-ctl">{controls}</div>}
      <div className="kb-svg-scroll">
        <svg viewBox={`${-PAD} ${-PAD} ${w + 2 * PAD} ${h + 2 * PAD}`} className="kb-chart" role="img" aria-label={label}>
          {children}
        </svg>
      </div>
      <figcaption>
        {schematic && <span className="kb-badge">示意</span>}
        {typeof caption === 'string' ? <TexText>{caption}</TexText> : caption}
      </figcaption>
    </figure>
  )
}
