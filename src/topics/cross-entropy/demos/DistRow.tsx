import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'

/** 一行可拖动的概率柱：拖第 i 根柱子改 P_i，其余各类按比例分掉剩下的概率（见 lib 的 setProb） */
interface DistRowProps {
  values: readonly number[]
  names: readonly string[]
  /** 这一行在 SVG 里的位置 */
  x0: number
  x1: number
  top: number
  h: number
  /** 纵轴满格对应的概率 */
  max?: number
  fill: string
  /** 无障碍名称前缀，如 "P" */
  prefix: string
  onSet: (i: number, v: number) => void
  svg: RefObject<SVGSVGElement | null>
  /** SVG viewBox 的高度，用来把指针位置换算成 SVG 坐标 */
  viewH: number
}

const BW = 40

export function DistRow({ values, names, x0, x1, top, h, max = 1, fill, prefix, onSet, svg, viewH }: DistRowProps) {
  const drag = useRef<number | null>(null)
  const colW = (x1 - x0) / values.length
  const cx = (i: number) => x0 + (i + 0.5) * colW
  const y = (v: number) => top + h - (v / max) * h
  const fromPointer = (ev: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    const sy = ((ev.clientY - r.top) / r.height) * viewH
    return ((top + h - sy) / h) * max
  }
  const onDown = (i: number) => (ev: PointerEvent<SVGElement>) => {
    drag.current = i
    ;(ev.currentTarget as Element).setPointerCapture(ev.pointerId)
    onSet(i, fromPointer(ev))
  }
  const onMove = (ev: PointerEvent<SVGElement>) => { if (drag.current !== null) onSet(drag.current, fromPointer(ev)) }
  const onUp = () => { drag.current = null }
  const onKey = (i: number) => (ev: KeyboardEvent) => {
    const d = { ArrowUp: 0.01, ArrowRight: 0.01, ArrowDown: -0.01, ArrowLeft: -0.01, PageUp: 0.1, PageDown: -0.1 }[ev.key]
    if (d === undefined) return
    ev.preventDefault()
    onSet(i, values[i] + d)
  }
  return (
    <g onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <line className="axis" x1={x0} x2={x1} y1={top + h} y2={top + h} />
      {values.map((v, i) => (
        <g key={i}>
          <rect className="kb-sm-hit" x={cx(i) - colW / 2} y={top} width={colW} height={h} onPointerDown={onDown(i)} onPointerMove={onMove} onPointerUp={onUp} />
          <rect x={cx(i) - BW / 2} y={y(v)} width={BW} height={top + h - y(v)} fill={fill} pointerEvents="none" />
          <circle
            cx={cx(i)} cy={y(v)} r={6.5} className="kb-sm-handle" tabIndex={0} role="slider"
            aria-label={`${prefix}（${names[i]}）`} aria-valuemin={0} aria-valuemax={1} aria-valuenow={v} aria-valuetext={v.toFixed(2)}
            onPointerDown={onDown(i)} onPointerMove={onMove} onPointerUp={onUp} onKeyDown={onKey(i)}
          />
          <text x={cx(i) + 10} y={y(v) - 5} className="kb-sm-val">{v.toFixed(2)}</text>
        </g>
      ))}
    </g>
  )
}
