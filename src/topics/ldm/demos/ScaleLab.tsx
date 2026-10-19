import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { alphaBar, residual, snr, T, varZt } from '../lib/ldm'

const TS = Array.from({ length: 100 }, (_, i) => Math.round((i * (T - 1)) / 99))

function Chart({ title, f, std, yMax, log, aria }: { title: string; f: (ab: number, s: number) => number; std: number; yMax: number; log?: boolean; aria: string }) {
  const W = 300, H = 190, L = 44, R = 290, Tp = 26, B = 160
  const lo = log ? -3 : 0
  const y = (v: number) => {
    const u = log ? (Math.log10(Math.max(v, 1e-3)) - lo) / (Math.log10(yMax) - lo) : v / yMax
    return B - Math.min(1, Math.max(0, u)) * (B - Tp)
  }
  const x = (t: number) => L + (t / (T - 1)) * (R - L)
  const path = (s: number) => TS.map((t, i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(f(alphaBar(t), s)).toFixed(1)}`).join('')
  const ticks = log ? [1e-3, 1e-1, 10, 1e3].filter((v) => v <= yMax) : [0, yMax / 2, yMax]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label={aria}>
      <SvgTex x={L} y={16} w={250} size={12} color="var(--ink-2)"><Tex>{title}</Tex></SvgTex>
      <line x1={L} x2={R} y1={B} y2={B} className="axis" />
      <line x1={L} x2={L} y1={Tp} y2={B} className="axis" />
      {ticks.map((v) => log
        ? <SvgTex key={v} x={L - 4} y={y(v) + 8} w={40} align="end" size={10} color="var(--ink-3)"><Tex>{`10^{${Math.log10(v)}}`}</Tex></SvgTex>
        : <text key={v} x={L - 5} y={y(v) + 4} textAnchor="end">{v}</text>)}
      {[0, 500, 999].map((t) => <text key={t} x={x(t)} y={B + 15} textAnchor="middle">{t}</text>)}
      <SvgTex x={R} y={B + 30} w={30} align="end" size={11} color="var(--ink-3)"><Tex>t</Tex></SvgTex>
      <path d={path(1)} className="stroke-ref" />
      <path d={path(std)} className="stroke-guided" />
    </svg>
  )
}

export function ScaleLab() {
  const [std, setStd] = useState(5.49)
  const abT = alphaBar(T - 1)
  return (
    <Demo
      title="$\operatorname{std}(z_0)$ 不是 1 会怎样"
      label="缩放实验：std(z0) 对方差和信噪比的影响"
      hint="用 SD 实际的 scaled-linear 噪声调度（$T = 1000$）计算。虚线是 $\operatorname{std}(z_0) = 1$ 的设计情形，橙线是当前值。"
      onReset={() => setStd(5.49)}
    >
      <Slider label="$\operatorname{std}(z_0)$" value={std} min={0.25} max={8} step={0.01} onChange={setStd} />
      <div className="kb-presets">
        <button type="button" className="kb-btn-ghost" onClick={() => setStd(1)}>缩放后：1</button>
        <button type="button" className="kb-btn-ghost" onClick={() => setStd(5.49)}>SD 原始 latent：5.49</button>
        <button type="button" className="kb-btn-ghost" onClick={() => setStd(0.5)}>像素 [−1, 1] 约 0.5</button>
      </div>
      <div className="kb-demo-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Chart title={'\\operatorname{Var}(z_t) = \\bar\\alpha_t \\operatorname{Var}(z_0) + 1 - \\bar\\alpha_t'} aria="z_t 的方差随 t 变化" f={varZt} std={std} yMax={64} />
        <Chart title={'\\text{SNR}(t)\\ \\text{(log)}'} aria="信噪比随 t 变化" f={snr} std={std} yMax={1e5} log />
      </div>
      <table className="kb-num-table">
        <thead><tr><th>在 <Tex>{'t = T'}</Tex></th><th><Tex>{'\\operatorname{std}(z_0) = 1'}</Tex></th><th>当前</th></tr></thead>
        <tbody>
          <tr><td>残留信号 <Tex>{'\\sqrt{\\bar\\alpha_T}\\cdot\\operatorname{std}(z_0)'}</Tex></td><td>{residual(abT, 1).toFixed(3)}</td><td><b>{residual(abT, std).toFixed(3)}</b></td></tr>
          <tr><td><Tex>{'\\operatorname{Var}(z_T)'}</Tex></td><td>{varZt(abT, 1).toFixed(3)}</td><td><b>{varZt(abT, std).toFixed(3)}</b></td></tr>
          <tr><td>SNR 整体放大倍数 <Tex>{'\\operatorname{std}(z_0)^2'}</Tex></td><td>1</td><td><b>{(std * std).toFixed(1)}</b></td></tr>
        </tbody>
      </table>
      <p className="kb-demo-readout"><span><Tex>{'\\bar\\alpha_T'}</Tex> = <b>{abT.toFixed(4)}</b></span><span><Tex>{'\\sqrt{\\bar\\alpha_T}'}</Tex> = <b>{Math.sqrt(abT).toFixed(3)}</b></span></p>
    </Demo>
  )
}
