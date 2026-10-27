import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { Z5, softmax } from '../lib/softmax'
import { CLASSES, fix, pct } from './common'

const W = 560, H = 412, L = 70, R = 10
const ZMAX = 3, EMAX = Math.exp(ZMAX)
// 三行：logits、指数、输出；纵轴都固定，拖动时不会自动缩放
const ROW_Z = { top: 16, h: 124 }, ROW_E = { top: 178, h: 78 }, ROW_P = { top: 296, h: 78 }
const QMAX = 1.5 // “直接除以总和”时第三行的纵轴范围 ±1.5
const colW = (W - L - R) / Z5.length
const cx = (i: number) => L + (i + 0.5) * colW
const BW = 38
const zY = (v: number) => ROW_Z.top + ROW_Z.h / 2 - (v / ZMAX) * (ROW_Z.h / 2)
const clampZ = (v: number) => Math.max(-ZMAX, Math.min(ZMAX, Math.round(v * 20) / 20))

type Mode = 'softmax' | 'direct'

export function SoftmaxDemo() {
  const [z, setZ] = useState(Z5)
  const [mode, setMode] = useState<Mode>('softmax')
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<number | null>(null)
  const e = z.map(Math.exp)
  const S = e.reduce((a, v) => a + v, 0)
  const p = softmax(z)
  const zSum = z.reduce((a, v) => a + v, 0)
  const q = z.map((v) => v / zSum)
  const top = p.indexOf(Math.max(...p))

  const set = (i: number, v: number) => setZ((old) => old.map((x, k) => (k === i ? clampZ(v) : x)))
  const fromPointer = (ev: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    const y = ((ev.clientY - r.top) / r.height) * H
    return ((ROW_Z.top + ROW_Z.h / 2 - y) / (ROW_Z.h / 2)) * ZMAX
  }
  const onDown = (i: number) => (ev: PointerEvent<SVGElement>) => {
    drag.current = i
    ;(ev.currentTarget as Element).setPointerCapture(ev.pointerId)
    set(i, fromPointer(ev))
  }
  const onMove = (ev: PointerEvent<SVGElement>) => { if (drag.current !== null) set(drag.current, fromPointer(ev)) }
  const onUp = () => { drag.current = null }
  const onKey = (i: number) => (ev: KeyboardEvent) => {
    const d = { ArrowUp: 0.1, ArrowRight: 0.1, ArrowDown: -0.1, ArrowLeft: -0.1, PageUp: 1, PageDown: -1 }[ev.key]
    if (d === undefined) return
    ev.preventDefault()
    set(i, z[i] + d)
  }

  const qBad = (v: number) => v < 0 || v > 1
  const qY0 = ROW_P.top + ROW_P.h / 2
  const qY = (v: number) => qY0 - (Math.max(-QMAX, Math.min(QMAX, v)) / QMAX) * (ROW_P.h / 2)

  return (
    <Demo
      title="从 logits 到概率：$z \to e^{z} \to p$"
      label="从 logits 到概率"
      hint="上下拖动第一行的柱子（或点选后按 ↑ ↓）修改 logits。取指数把每一项变成正数，并把差距拉开；除以总和后加起来为 1。切到“直接除以总和”，看看不取指数会怎样。"
      onReset={() => { setZ(Z5); setMode('softmax') }}
      note="三行的纵轴都固定：$z \in [-3, 3]$；$e^{z}$ 的上限是 $e^{3} \approx 20.1$；$p$ 的范围是 $[0, 1]$，“直接除以总和”时为 $[-1.5, 1.5]$，超出的部分截断并标出数值。"
    >
      <Seg<Mode> label="归一化方式" value={mode} onChange={setMode} options={[
        { value: 'softmax', label: 'softmax：先取指数' },
        { value: 'direct', label: '直接除以总和', aria: '直接除以总和 z_i / Σ z_j' },
      ]} />
      <div className="kb-svg-scroll">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="kb-chart kb-sm-bars" role="group" aria-label="logits、指数和输出概率的柱状图" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {/* 第一行：logits，柱子从 0 出发，可拖动 */}
          <SvgTex x={4} y={ROW_Z.top + ROW_Z.h / 2 + 6} w={60} size={14}><Tex>{'z_i'}</Tex></SvgTex>
          <line className="axis" x1={L} x2={W - R} y1={zY(0)} y2={zY(0)} />
          <text x={L - 6} y={zY(ZMAX) + 4} textAnchor="end">3</text>
          <text x={L - 6} y={zY(-ZMAX) + 4} textAnchor="end">−3</text>
          {z.map((v, i) => (
            <g key={i}>
              <rect className="kb-sm-hit" x={cx(i) - colW / 2} y={ROW_Z.top} width={colW} height={ROW_Z.h} onPointerDown={onDown(i)} />
              <rect x={cx(i) - BW / 2} y={Math.min(zY(0), zY(v))} width={BW} height={Math.abs(zY(v) - zY(0))} className="kb-sm-logit" pointerEvents="none" />
              <circle
                cx={cx(i)} cy={zY(v)} r={7} className="kb-sm-handle" tabIndex={0} role="slider"
                aria-label={`z${i + 1}（${CLASSES[i]}）`} aria-valuemin={-ZMAX} aria-valuemax={ZMAX} aria-valuenow={v} aria-valuetext={fix(v, 2)}
                onPointerDown={onDown(i)} onKeyDown={onKey(i)}
              />
              <text x={cx(i) + 11} y={zY(v) + (v >= 0 ? -6 : 14)} className="kb-sm-val">{fix(v, 2)}</text>
            </g>
          ))}

          {/* 第二行：e^{z_i}，纵轴固定到 e^3 */}
          <SvgTex x={4} y={ROW_E.top + ROW_E.h / 2 + 6} w={60} size={14}><Tex>{'e^{z_i}'}</Tex></SvgTex>
          <g opacity={mode === 'direct' ? 0.25 : 1}>
            <line className="axis" x1={L} x2={W - R} y1={ROW_E.top + ROW_E.h} y2={ROW_E.top + ROW_E.h} />
            {e.map((v, i) => {
              const h = (v / EMAX) * ROW_E.h
              return (
                <g key={i}>
                  <rect x={cx(i) - BW / 2} y={ROW_E.top + ROW_E.h - h} width={BW} height={h} className="kb-sm-exp" />
                  <text x={cx(i)} y={ROW_E.top + ROW_E.h - h - 5} textAnchor="middle" className="kb-sm-val">{v.toFixed(3)}</text>
                </g>
              )
            })}
          </g>
          {mode === 'direct' && <text x={L + 6} y={ROW_E.top + 14} className="kb-sm-val">跳过这一步</text>}

          {/* 第三行：输出 */}
          <SvgTex x={4} y={ROW_P.top + ROW_P.h / 2 + 6} w={64} size={14}>
            <Tex>{mode === 'softmax' ? 'p_i' : '\\frac{z_i}{\\sum_j z_j}'}</Tex>
          </SvgTex>
          {mode === 'softmax' ? (
            <>
              <line className="axis" x1={L} x2={W - R} y1={ROW_P.top + ROW_P.h} y2={ROW_P.top + ROW_P.h} />
              {p.map((v, i) => {
                const h = v * ROW_P.h
                return (
                  <g key={i}>
                    <rect x={cx(i) - BW / 2} y={ROW_P.top + ROW_P.h - h} width={BW} height={h} className="kb-sm-prob" />
                    <text x={cx(i)} y={ROW_P.top + ROW_P.h - h - 5} textAnchor="middle" className="kb-sm-val">{v.toFixed(3)}</text>
                  </g>
                )
              })}
            </>
          ) : (
            <>
              <line className="axis" x1={L} x2={W - R} y1={qY0} y2={qY0} />
              <line className="grid" x1={L} x2={W - R} y1={qY(1)} y2={qY(1)} strokeDasharray="3 3" />
              <text x={L - 6} y={qY(1) + 4} textAnchor="end">1</text>
              <text x={L - 6} y={qY0 + 4} textAnchor="end">0</text>
              {Math.abs(zSum) < 1e-9 ? (
                <text x={(L + W) / 2} y={qY0 - 8} textAnchor="middle" className="kb-sm-val is-bad">分母 Σz = 0，无法计算</text>
              ) : q.map((v, i) => (
                <g key={i}>
                  <rect x={cx(i) - BW / 2} y={Math.min(qY0, qY(v))} width={BW} height={Math.abs(qY(v) - qY0)} className={qBad(v) ? 'kb-sm-bad' : 'kb-sm-prob'} />
                  <text x={cx(i)} y={v >= 0 ? qY(v) - 5 : qY(v) + 13} textAnchor="middle" className={qBad(v) ? 'kb-sm-val is-bad' : 'kb-sm-val'}>{fix(v, 2)}</text>
                </g>
              ))}
            </>
          )}
          {CLASSES.map((c, i) => <text key={c} x={cx(i)} y={H - 6} textAnchor="middle" className="kb-sm-class">{c}</text>)}
        </svg>
      </div>
      <div className="kb-demo-readout">
        {mode === 'softmax' ? (
          <>
            <span><Tex>{'S = \\sum_j e^{z_j}'}</Tex> = <b>{S.toFixed(3)}</b></span>
            <span><Tex>{'\\sum_i p_i'}</Tex> = <b>{p.reduce((a, v) => a + v, 0).toFixed(3)}</b></span>
            <span>最大的一类：<b>{CLASSES[top]}</b>（{pct(p[top])}）</span>
          </>
        ) : (
          <>
            <span><Tex>{'\\sum_j z_j'}</Tex> = <b>{fix(zSum, 2)}</b></span>
            <span>
              {Math.abs(zSum) < 1e-9 ? '分母为 0' : q.some(qBad)
                ? <>加起来也是 1，但有 <b className="is-bad">{q.filter(qBad).length}</b> 项小于 0 或大于 1，不是概率分布</>
                : '这组 logits 同号，结果碰巧都在 0 到 1 之间；把某一项拖过 0 试试'}
            </span>
          </>
        )}
      </div>
    </Demo>
  )
}
