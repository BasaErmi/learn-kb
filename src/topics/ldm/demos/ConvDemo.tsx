import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { convParams, pointwise } from '../lib/ldm'

type Mode = 'k3' | 'k1' | 'dw'
const CIN = 4
const CH = ['var(--c-cond)', 'var(--c-uncond)', 'var(--c-guided)', 'var(--accent)']
// 1×1 卷积的示例权重 W（5×4）、偏置和某个位置上的输入向量
const W = [[0.5, -1, 0, 2], [1, 1, 1, 1], [0, 0.25, -0.5, 1], [2, 0, 0, -1], [-1, 0.5, 0.5, 0]]
const B = [0.1, 0, -0.2, 0.3, 1]
const Hv = [1, 2, -1, 0.5]

export function ConvDemo() {
  const [mode, setMode] = useState<Mode>('k1')
  const [o, setO] = useState(0)
  const k = mode === 'k1' ? 1 : 3
  const cout = mode === 'dw' ? CIN : 5
  const oo = Math.min(o, cout - 1)
  const params = convParams(k, CIN, cout, mode === 'dw')
  const y = pointwise(W, B, Hv)
  const slab = (x: number, yy: number, c: string, hot: boolean, key: string, h = 46) => (
    <rect key={key} x={x} y={yy} width={46} height={h} rx={3} fill={`color-mix(in srgb, ${c} ${hot ? 40 : 14}%, var(--card))`} stroke={c} strokeWidth={hot ? 2 : 1} />
  )
  const inY = (m: number) => 18 + m * 54
  const outY = (j: number) => 22 + j * (cout === 5 ? 43 : 54)
  return (
    <Demo
      title="普通卷积、$1\times1$ 卷积与 depthwise 卷积"
      label="卷积对比：普通、1×1、depthwise"
      hint="输入 $C_{\text{in}} = 4$ 个通道。点击右侧某个输出通道，看它的卷积核用到了哪些输入通道。"
      onReset={() => { setMode('k1'); setO(0) }}
    >
      <Seg label="卷积类型" value={mode} onChange={setMode} options={[
        { value: 'k3', label: <>普通 <Tex>{'3\\times3'}</Tex></>, aria: '普通 3×3' },
        { value: 'k1', label: <Tex>{'1\\times1'}</Tex>, aria: '1×1' },
        { value: 'dw', label: <>depthwise <Tex>{'3\\times3'}</Tex></>, aria: 'depthwise 3×3' },
      ]} />
      <div className="kb-svg-scroll">
        <svg viewBox="0 0 640 250" className="kb-chart" role="img" aria-label="卷积核与通道的连接">
          <text x={20} y={12}>输入通道</text>
          {Array.from({ length: CIN }, (_, m) => slab(20, inY(m), CH[m], mode !== 'dw' || m === oo, `in${m}`))}
          <text x={250} y={12} textAnchor="middle">{`输出通道 ${oo + 1} 的卷积核`}</text>
          {Array.from({ length: CIN }, (_, m) => {
            const used = mode !== 'dw' || m === oo
            const s = k === 1 ? 14 : 36, x = 250 - s / 2, yy = inY(m) + 23 - s / 2
            return (
              <g key={m} opacity={used ? 1 : 0.15}>
                <line x1={68} x2={x - 4} y1={inY(m) + 23} y2={inY(m) + 23} stroke={CH[m]} />
                <rect x={x} y={yy} width={s} height={s} fill={`color-mix(in srgb, ${CH[m]} 30%, var(--card))`} stroke={CH[m]} />
                {k === 3 && [1, 2].map((q) => <g key={q}><line x1={x + (q * s) / 3} x2={x + (q * s) / 3} y1={yy} y2={yy + s} stroke={CH[m]} strokeOpacity={0.5} /><line y1={yy + (q * s) / 3} y2={yy + (q * s) / 3} x1={x} x2={x + s} stroke={CH[m]} strokeOpacity={0.5} /></g>)}
                <line x1={x + s + 4} x2={mode === 'dw' ? 476 : 380} y1={inY(m) + 23} y2={mode === 'dw' ? outY(oo) + 23 : 125} stroke={CH[m]} strokeOpacity={used ? 0.8 : 0} />
              </g>
            )
          })}
          {mode !== 'dw' && <><circle cx={396} cy={125} r={15} fill="var(--card)" stroke="var(--ink-3)" /><SvgTex x={396} y={132} w={30} align="middle" size={16}><Tex>{'\\Sigma'}</Tex></SvgTex><line x1={412} x2={476} y1={125} y2={outY(oo) + 18} stroke="var(--ink-3)" /></>}
          <text x={500} y={12}>输出通道</text>
          {Array.from({ length: cout }, (_, j) => (
            <g key={j} style={{ cursor: 'pointer' }} onClick={() => setO(j)} role="button" tabIndex={0} aria-label={`输出通道 ${j + 1}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setO(j) }}>
              {slab(480, outY(j), mode === 'dw' ? CH[j] : 'var(--ink-3)', j === oo, `out${j}`, cout === 5 ? 37 : 46)}
              <text x={534} y={outY(j) + (cout === 5 ? 22 : 27)}>{j + 1}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="kb-demo-readout">
        {mode === 'dw'
          ? <span>每个核只看一个输入通道，<b>不做跨通道求和</b>，通道之间互不影响。参数量 <Tex>{'k^2 C_{\\text{in}}'}</Tex> = <b>{params}</b></span>
          : <span>一个核形状为 <Tex>{`${k}\\times${k}\\times C_{\\text{in}}`}</Tex>，每片在对应通道上卷积后<b>逐位置求和</b>。参数量 <Tex>{'k^2 C_{\\text{in}} C_{\\text{out}}'}</Tex> = {k * k}×4×5 = <b>{params}</b></span>}
      </p>
      {mode === 'k1' && (
        <div>
          <p className="kb-demo-note">在任一位置 <Tex>{'(i, j)'}</Tex> 取出通道向量 <Tex>{'h_{ij}'}</Tex>，<Tex>{'1\\times1'}</Tex> 卷积就是 <Tex>{'y_{ij} = W h_{ij} + b'}</Tex>，和 <code>nn.Linear(4, 5)</code> 做的事完全一样。高亮的是第 {oo + 1} 个输出通道用到的那一行权重：</p>
          <div className="kb-table-scroll">
            <table className="kb-num-table kb-nowrap">
              <thead><tr><th></th>{Hv.map((_, m) => <th key={m}><Tex>{`w_{k,${m + 1}}`}</Tex></th>)}<th><Tex>{'b_k'}</Tex></th><th><Tex>{'y^{(k)}_{ij}'}</Tex></th></tr></thead>
              <tbody>
                <tr><td><Tex>{'h_{ij}'}</Tex></td>{Hv.map((v, m) => <td key={m} style={{ color: CH[m] }}>{v}</td>)}<td></td><td></td></tr>
                {W.map((row, j) => (
                  <tr key={j} style={{ background: j === oo ? 'var(--accent-soft)' : undefined, cursor: 'pointer' }} onClick={() => setO(j)}>
                    <td><Tex>{`k = ${j + 1}`}</Tex></td>{row.map((w, m) => <td key={m}>{w}</td>)}<td>{B[j]}</td><td><b>{y[j].toFixed(2)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Demo>
  )
}
