import { useId, type ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { SvgTex } from '@/kb/components/SvgSub'
import { Tex } from '@/kb/components/Tex'

function Box({ x, y, w, h, title, sub }: { x: number; y: number; w: number; h: number; title: ReactNode; sub: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} className="kb-flow-box" />
      <SvgTex x={x + w / 2} y={y + 23} w={w} h={20} align="middle" color="var(--ink)">{title}</SvgTex>
      <SvgTex x={x + w / 2} y={y + 40} w={w} h={18} align="middle" color="var(--ink-3)"><span style={{ fontSize: 11 }}>{sub}</span></SvgTex>
    </g>
  )
}

export function CGPipeline() {
  const { review } = useReviewMode()
  const id = useId().replace(/:/g, '')
  if (review) return null
  const m = `url(#${id}-a)`, mb = `url(#${id}-b)`
  return (
    <figure className="kb-figure">
      <svg viewBox="0 0 680 262" className="kb-chart" role="img" aria-label="classifier guidance 的计算流程">
        <defs>
          <marker id={`${id}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-3)" /></marker>
          <marker id={`${id}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-guided)" /></marker>
        </defs>
        <circle cx={40} cy={125} r={22} className="kb-flow-box" />
        <SvgTex x={40} y={132} w={40} align="middle" color="var(--ink)"><Tex>x_t</Tex></SvgTex>
        <Box x={110} y={30} w={170} h={50} title={<>扩散模型 <Tex>{'\\epsilon_\\theta'}</Tex></>} sub="❄ 冻结 · 普通前向" />
        <Box x={110} y={160} w={170} h={50} title={<>噪声感知分类器 <Tex>{'p_\\phi'}</Tex></>} sub={<>❄ 冻结 · 输入 <Tex>x_t</Tex> 和 <Tex>t</Tex></>} />
        <path d="M62,115 C85,80 90,58 108,56" fill="none" stroke="var(--ink-3)" strokeWidth={1.5} markerEnd={m} />
        <path d="M62,135 C85,170 90,184 108,185" fill="none" stroke="var(--ink-3)" strokeWidth={1.5} markerEnd={m} />
        <SvgTex x={296} y={50} w={120} color="var(--ink-3)"><Tex>{'\\epsilon_\\theta(x_t, t)'}</Tex></SvgTex>
        <path d="M282,56 L440,108" fill="none" stroke="var(--ink-3)" strokeWidth={1.5} markerEnd={m} />
        <SvgTex x={292} y={234} w={240} color="var(--ink-3)">输出的梯度 <Tex>{'\\nabla \\log p_\\phi(y \\mid x_t)'}</Tex></SvgTex>
        <path d="M195,212 C195,248 40,248 40,150" fill="none" stroke="var(--c-guided)" strokeDasharray="5 4" strokeWidth={1.8} markerEnd={mb} />
        <SvgTex x={66} y={258} w={400} color="var(--c-guided)">只对输入求梯度：<Tex>{'\\nabla \\log p_\\phi(y \\mid x_t)'}</Tex>，不更新任何参数</SvgTex>
        <path d="M282,192 L440,138" stroke="var(--c-guided)" strokeWidth={1.8} fill="none" markerEnd={mb} />
        <SvgTex x={352} y={198} w={140} color="var(--c-guided)"><Tex>{'\\times\\,(-s\\sqrt{1-\\bar\\alpha_t})'}</Tex></SvgTex>
        <circle cx={460} cy={122} r={18} className="kb-flow-box" />
        <text x={460} y={128} textAnchor="middle" style={{ fontSize: 17, fill: 'var(--ink)' }}>+</text>
        <SvgTex x={503} y={112} w={30} align="middle" color="var(--c-guided)"><Tex>{'\\hat\\epsilon'}</Tex></SvgTex>
        <path d="M480,122 L528,122" className="stroke-guided" markerEnd={mb} />
        <Box x={530} y={97} w={130} h={50} title="DDPM / DDIM" sub="更新公式不变" />
        <SvgTex x={595} y={174} w={80} align="middle" color="var(--ink)">→ <Tex>{'x_{t-1}'}</Tex></SvgTex>
      </svg>
      <figcaption>两条并行支路只在最后相加。两个模型的参数都不更新，梯度只用来算出“往哪改图像会更像 <Tex>y</Tex>”的方向。</figcaption>
    </figure>
  )
}
