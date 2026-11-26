import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex, TexText } from '@/kb/components/Tex'
import { C, T } from '@/kb/components/Diagram'
import { quantize1d, runSte } from '../lib/vq'

const Z0 = 0.8, TARGET = 2, LR = 0.25
const SW = 360, SH = 138 // 每条道的阶梯图
const PX0 = 10, PX1 = 330
const X0 = -0.25, X1 = 2.45, Y0 = -0.3, Y1 = 2.35
const TOP = 4, PH = 108, BOT = TOP + PH
const py = (v: number) => TOP + (1 - (v - Y0) / (Y1 - Y0)) * PH
const ROWS = [
  { mode: 'true' as const, y: 6, name: '链式法则（真实梯度）', slope: 0, color: 'var(--ink-2)' },
  { mode: 'ste' as const, y: 154, name: 'STE', slope: 1, color: 'var(--accent)' },
]
const BANDS = [
  { a: X0, b: 0.5, k: 0, color: 'var(--ink-3)' },
  { a: 0.5, b: 1.5, k: 1, color: 'var(--c-cond)' },
  { a: 1.5, b: X1, k: 2, color: 'var(--c-uncond)' },
]
const px = (v: number) => PX0 + ((v - X0) / (X1 - X0)) * (PX1 - PX0)
const f2 = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(2)
const fi = (v: number) => String(Math.abs(v) < 1e-9 ? 0 : v)
const paren = (v: number) => (v < 0 ? `(${fi(v)})` : fi(v))

/** z_e 走了 n 步之后的位置 */
const posAt = (mode: 'ste' | 'true', n: number) => (n === 0 ? Z0 : runSte(Z0, TARGET, LR, n, mode)[n - 1].next)
const trailOf = (mode: 'ste' | 'true', n: number) => [Z0, ...runSte(Z0, TARGET, LR, Math.max(n, 1), mode).slice(0, n).map((r) => r.next)]

/** 同一个起点，链式法则和 STE 两条道并排走：反向用的斜率不同，z_e 的命运就不同 */
export function SteDemo() {
  const [n, setN] = useState(0)
  const steDone = quantize1d(posAt('ste', n)) === TARGET

  return (
    <Demo
      title="同一个起点，链式法则卡住，STE 换到了想要的码字"
      label="STE 一维例子"
      hint="一维码本 $\{0, 1, 2\}$，背景三段是三个码字的区域（边界 0.5 和 1.5）。编码器输出从 $z_e = 0.8$ 出发，量化成 $z_q = 1$；解码器想要的是码字 2，损失 $\mathcal{L} = (z_q - 2)^2$，学习率 0.25。两条道唯一的区别是反向传播穿过量化时乘的那个导数（图中的虚线斜率）。点“走一步”，两条道各更新一次；箭头是这一步会把 $z_e$ 推到哪里。"
      onReset={() => setN(0)}
      note="阶梯的真实斜率处处是 0，所以链式法则给出的梯度恒为 0，$z_e$ 永远停在 0.8。STE 把斜率换成 1，梯度等于 $\partial\mathcal{L}/\partial z_q$，它不会让 $z_q$ 连续地变大，而是把 $z_e$ 一路推过边界 1.5，换进解码器想要的区域；到那里 $\mathcal{L} = 0$，梯度也变成 0，自然停下。"
    >
      <div className="kb-controls">
        <button type="button" className="kb-btn-ghost" disabled={steDone} onClick={() => setN(n + 1)}>{steDone ? 'STE 已停下' : '走一步'}</button>
        <span className="kb-demo-note">第 <b>{n}</b> 步</span>
      </div>
      {ROWS.map((r) => {
        const z = posAt(r.mode, n)
        const zq = quantize1d(z)
        const dLdzq = 2 * (zq - TARGET)
        const g = dLdzq * r.slope
        const next = z - LR * g
        const trail = trailOf(r.mode, n).slice(0, -1)
        const h = 0.42 // 斜率线段的半宽
        let status: string
        if (r.mode === 'true') status = '梯度恒为 0，$z_e$ 永远卡在 0.8'
        else if (zq === TARGET) status = '已换到码字 2，$\\mathcal{L} = 0$，停下'
        else if (quantize1d(next) === TARGET) status = '这一步会越过边界 1.5，换成码字 2'
        else status = '把 $z_e$ 往右推，向边界 1.5 靠近'
        return (
          <div key={r.mode} className={`kb-ste-lane${r.mode === 'ste' ? ' is-ste' : ''}`}>
            <div className="kb-ste-name">{r.name}</div>
            <svg viewBox={`0 0 ${SW} ${SH}`} className="kb-chart" role="img" aria-label={`${r.name}：z_e = ${f2(z)}，z_q = ${zq}`}>
              <defs>
                <marker id={`ste-arrow-${r.mode}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,1 L9,5 L0,9 z" fill={r.color} />
                </marker>
              </defs>
              {/* 三个码字的区域 */}
              {BANDS.map((b) => (
                <g key={b.k}>
                  <rect x={px(b.a)} y={TOP} width={px(b.b) - px(b.a)} height={PH} fill={`color-mix(in srgb, ${b.color} ${b.k === TARGET ? 18 : 9}%, var(--card))`} />
                  <T x={(px(b.a) + px(b.b)) / 2} y={TOP + 10} w={120} size={10.5} color={C.ink3}>{b.k === TARGET ? '码字 2（想要的）' : `码字 ${b.k}`}</T>
                </g>
              ))}
              <line x1={PX0} x2={PX1} y1={BOT} y2={BOT} stroke="var(--ink-3)" strokeWidth={1} />
              {[0, 0.5, 1, 1.5, 2].map((v) => <text key={v} x={px(v)} y={BOT + 15} textAnchor="middle" className="kb-sm-val">{v}</text>)}
              <T x={PX1 + 4} y={BOT} align="start" size={12} w={30}>{'$z_e$'}</T>
              {/* 前向：阶梯 */}
              {BANDS.map((b) => <line key={b.k} x1={px(b.a)} x2={px(b.b)} y1={py(b.k)} y2={py(b.k)} stroke="var(--c-guided)" strokeWidth={3} />)}
              {/* 反向用的斜率：过当前点的虚线 */}
              <line x1={px(z - h)} x2={px(z + h)} y1={py(zq - r.slope * h)} y2={py(zq + r.slope * h)} stroke={r.color} strokeWidth={2.2} strokeDasharray="6 3" />
              <T x={px(z + h) + 3} y={py(zq + r.slope * h) + (r.slope ? -2 : 12)} align="start" size={11} w={110} color={r.color} weight={600}>{r.slope ? '假装斜率 1' : '真实斜率 0'}</T>
              {/* 走过的位置、当前位置、这一步要去的位置 */}
              {trail.map((t, i) => <circle key={i} cx={px(t)} cy={BOT} r={3.5} fill="var(--card)" stroke="var(--ink-3)" strokeWidth={1.3} />)}
              <line x1={px(z)} x2={px(z)} y1={py(zq)} y2={BOT} stroke="var(--ink-3)" strokeDasharray="2 2" />
              <circle cx={px(z)} cy={py(zq)} r={5} fill="var(--c-guided)" stroke="var(--card)" strokeWidth={1.4} />
              <circle cx={px(z)} cy={BOT} r={5} fill="var(--ink)" />
              {Math.abs(next - z) > 1e-9 && (
                <line x1={px(z) + 6} x2={px(next) - 2} y1={BOT - 11} y2={BOT - 11} stroke={r.color} strokeWidth={2.4} markerEnd={`url(#ste-arrow-${r.mode})`} />
              )}
            </svg>
            <div className="kb-ste-calc">
              <p><TexText>{`$\\partial\\mathcal{L}/\\partial z_q = 2(z_q - 2) = ${fi(dLdzq)}$`}</TexText></p>
              <p style={{ color: r.color }}><TexText>{`$\\partial\\mathcal{L}/\\partial z_e = ${fi(dLdzq)} \\times ${r.slope} = ${fi(g)}$`}</TexText></p>
              <p><TexText>{`$z_e \\leftarrow ${f2(z)} - 0.25 \\times ${paren(g)} = ${f2(next)}$`}</TexText></p>
              <p className="kb-ste-status" style={{ color: r.color }}><TexText>{status}</TexText></p>
            </div>
          </div>
        )
      })}
      <div className="kb-demo-readout">
        <span>链式法则：<Tex>{'z_e'}</Tex> = <b data-lane="true">{f2(posAt('true', n))}</b>，<Tex>{'\\mathcal{L}'}</Tex> = <b>{f2((quantize1d(posAt('true', n)) - TARGET) ** 2)}</b></span>
        <span>STE：<Tex>{'z_e'}</Tex> = <b data-lane="ste">{f2(posAt('ste', n))}</b>，<Tex>{'\\mathcal{L}'}</Tex> = <b>{f2((quantize1d(posAt('ste', n)) - TARGET) ** 2)}</b></span>
      </div>
    </Demo>
  )
}
