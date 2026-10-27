import { useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'
import { bceGrad, gdTrajectory, mseGrad, sigmoid, stepsToReach } from '../lib/crossEntropy'

type Mode = 'grad' | 'train'
const Z_MAX = 8
const ZS = Array.from({ length: 321 }, (_, i) => -Z_MAX + (2 * Z_MAX * i) / 320)
const GRAD = {
  mse: ZS.map((z) => [z, Math.abs(mseGrad(z, 1))] as [number, number]),
  ce: ZS.map((z) => [z, Math.abs(bceGrad(z, 1))] as [number, number]),
}
// 训练轨迹：y = 1，从 z = −6 出发，学习率 1
const Z0 = -6, LR = 1, STEPS = 600
const TRAJ = { mse: gdTrajectory(mseGrad, Z0, 1, LR, STEPS), ce: gdTrajectory(bceGrad, Z0, 1, LR, STEPS) }
const REACH = { mse: stepsToReach(TRAJ.mse, 0.9), ce: stepsToReach(TRAJ.ce, 0.9) }

const W = 560, H = 296, M = { l: 44, r: 14, t: 42, b: 40 }

export function GradientCompareDemo() {
  const [mode, setMode] = useState<Mode>('grad')
  const [z, setZ] = useState(-6)
  const p = sigmoid(z)
  const gm = Math.abs(mseGrad(z, 1)), gc = Math.abs(bceGrad(z, 1))
  const sx = mode === 'grad'
    ? scaleLinear().domain([-Z_MAX, Z_MAX]).range([M.l, W - M.r])
    : scaleLinear().domain([0, STEPS]).range([M.l, W - M.r])
  const sy = scaleLinear().domain([0, 1]).range([H - M.b, M.t])
  const path = (pts: [number, number][]) => line<[number, number]>().x((d) => sx(d[0])).y((d) => sy(d[1]))(pts) ?? ''
  const traj = (t: number[]) => t.map((v, i) => [i, v] as [number, number])
  const xTicks = mode === 'grad' ? [-8, -4, 0, 4, 8] : [0, 100, 200, 300, 400, 500, 600]

  return (
    <Demo
      title="二分类：MSE 与交叉熵的梯度"
      label="MSE 与交叉熵的梯度"
      hint={mode === 'grad'
        ? '真实标签 $y = 1$。拖动滑块改变 logit $z$：$z$ 越负，模型越确信是 0，错得越离谱。交叉熵的梯度 $|p - y|$ 这时接近 1；MSE 的梯度多乘了 $p(1-p)$，反而趋于 0。'
        : '真实标签 $y = 1$，两种损失都从 $z = -6$（$p \\approx 0.0025$）出发，用同样的学习率 1 做梯度下降。纵轴是每一步之后的 $p = \\sigma(z)$。'}
      onReset={() => { setMode('grad'); setZ(-6) }}
      note={mode === 'grad'
        ? '$p = \\sigma(z)$。MSE 是 $\\frac{1}{2}(p - y)^2$，交叉熵是 $-[y \\ln p + (1 - y)\\ln(1 - p)]$；纵轴是对 $z$ 的梯度的绝对值。'
        : '$z \\leftarrow z - \\eta \\frac{\\partial L}{\\partial z}$，$\\eta = 1$，共 600 步；虚线是 $p = 0.9$。'}
    >
      <Seg<Mode> label="显示" value={mode} onChange={setMode} options={[
        { value: 'grad', label: <>梯度随 <Tex>{'z'}</Tex> 的变化</>, aria: '梯度随 z 的变化' },
        { value: 'train', label: '梯度下降的轨迹' },
      ]} />
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label={mode === 'grad' ? '两种损失的梯度大小随 z 的变化' : '两种损失下 p 随训练步数的变化'}>
          <line className="axis" x1={M.l} x2={W - M.r} y1={sy(0)} y2={sy(0)} />
          <line className="axis" x1={M.l} x2={M.l} y1={sy(0)} y2={M.t} />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={M.l - 6} y={sy(v) + 4} textAnchor="end">{v}</text>)}
          {xTicks.map((v) => <text key={v} x={sx(v)} y={sy(0) + 15} textAnchor="middle">{v}</text>)}
          {mode === 'grad' ? (
            <>
              <path d={path(GRAD.ce)} className="stroke-prob" />
              <path d={path(GRAD.mse)} className="stroke-grad" />
              <line x1={sx(z)} x2={sx(z)} y1={sy(0)} y2={M.t} className="axis" strokeDasharray="2 3" />
              <circle cx={sx(z)} cy={sy(gc)} r={4.5} fill="var(--c-prob)" stroke="var(--card)" strokeWidth={2} />
              <circle cx={sx(z)} cy={sy(gm)} r={4.5} fill="var(--c-grad)" stroke="var(--card)" strokeWidth={2} />
              <SvgTex x={(M.l + W - M.r) / 2} y={H - 6} w={120} align="middle" size={12} color="var(--ink-3)">logit <Tex>{'z'}</Tex></SvgTex>
              <SvgTex x={M.l - 30} y={20} w={120} size={12} color="var(--ink-3)"><Tex>{'\\left|\\frac{\\partial L}{\\partial z}\\right|'}</Tex></SvgTex>
            </>
          ) : (
            <>
              <line className="grid" x1={M.l} x2={W - M.r} y1={sy(0.9)} y2={sy(0.9)} strokeDasharray="4 3" />
              <path d={path(traj(TRAJ.ce))} className="stroke-prob" />
              <path d={path(traj(TRAJ.mse))} className="stroke-grad" />
              <SvgTex x={(M.l + W - M.r) / 2} y={H - 6} w={120} align="middle" size={12} color="var(--ink-3)">训练步数</SvgTex>
              <SvgTex x={M.l - 30} y={20} w={120} size={12} color="var(--ink-3)"><Tex>{'p = \\sigma(z)'}</Tex></SvgTex>
            </>
          )}
        </svg>
      </div>
      <div className="kb-legend">
        <span><i style={{ background: 'var(--c-prob)' }} />交叉熵{mode === 'grad' && <>：<Tex>{'p - y'}</Tex></>}</span>
        <span><i style={{ background: 'var(--c-grad)' }} />MSE{mode === 'grad' && <>：<Tex>{'(p - y)\\,p(1 - p)'}</Tex></>}</span>
      </div>
      {mode === 'grad' ? (
        <>
          <Slider label="logit $z$" value={z} min={-Z_MAX} max={Z_MAX} step={0.1} onChange={setZ} format={(v) => v.toFixed(1)} />
          <div className="kb-demo-readout">
            <span><Tex>{'p = \\sigma(z)'}</Tex> = <b>{p.toFixed(4)}</b></span>
            <span>交叉熵 <Tex>{'|p - y|'}</Tex> = <b>{gc.toFixed(4)}</b></span>
            <span>MSE <Tex>{'|(p - y)\\,p(1-p)|'}</Tex> = <b>{gm.toFixed(4)}</b></span>
          </div>
        </>
      ) : (
        <div className="kb-demo-readout">
          <span>交叉熵到达 <Tex>{'p \\ge 0.9'}</Tex>：<b>{REACH.ce}</b> 步</span>
          <span>MSE 到达 <Tex>{'p \\ge 0.9'}</Tex>：<b>{REACH.mse}</b> 步</span>
        </div>
      )}
    </Demo>
  )
}
