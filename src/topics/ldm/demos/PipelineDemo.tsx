import { useState, type ReactNode } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'

interface Stage { tex: string; shape: string; frozen?: boolean; text: ReactNode }

const TRAIN: Stage[] = [
  { tex: 'x', shape: '512^2\\times 3', text: '从数据集取一张图。' },
  { tex: '\\mathcal{E}', shape: '64^2\\times 8', frozen: true, text: <>冻结的 encoder 输出 <Tex>{'\\mu'}</Tex> 和 <Tex>{'\\log\\sigma^2'}</Tex>，各 4 个通道。</> },
  { tex: 'z', shape: '64^2\\times 4', frozen: true, text: <>从后验采样 <Tex>{'z = \\mu + \\sigma\\odot\\epsilon'}</Tex>。<Tex>{'\\sigma'}</Tex> 极小，和直接取 <Tex>{'\\mu'}</Tex> 几乎一样。</> },
  { tex: 'z_0', shape: '64^2\\times 4', text: <>乘缩放系数：<Tex>{'z_0 = s\\cdot z'}</Tex>，<Tex>{'s = 0.18215'}</Tex>。前四步都不依赖扩散模型，可以提前把整个数据集编码好存起来。</> },
  { tex: 'z_t', shape: '64^2\\times 4', text: <>采样 <Tex>{'t \\sim \\mathcal{U}\\{1,\\dots,T\\}'}</Tex> 和 <Tex>{'\\epsilon\\sim\\mathcal{N}(0,I)'}</Tex>，加噪 <Tex>{'z_t = \\sqrt{\\bar\\alpha_t}\\,z_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon'}</Tex>。</> },
  { tex: '\\epsilon_\\theta', shape: '64^2\\times 4', text: <>UNet 预测噪声 <Tex>{'\\epsilon_\\theta(z_t, t, \\tau_\\theta(y))'}</Tex>，输入输出都是 latent 的形状。</> },
  { tex: '\\mathcal{L}', shape: '\\text{标量}', text: <><Tex>{'\\|\\epsilon - \\epsilon_\\theta(z_t, t, \\tau_\\theta(y))\\|_2^2'}</Tex>，和 DDPM 一字不差。只有 UNet（和可训练的 <Tex>{'\\tau_\\theta'}</Tex>）被更新。</> },
]
const SAMPLE: Stage[] = [
  { tex: 'z_T', shape: '64^2\\times 4', text: <>从 <Tex>{'\\mathcal{N}(0, I)'}</Tex> 采样起点。形状是 latent 的形状，不是图像的形状。</> },
  { tex: '\\epsilon_\\theta', shape: '\\times 2 \\text{ 次}', text: <>每一步对同一个 <Tex>{'z_t'}</Tex> 算有条件和无条件两次预测，用 CFG 组合成 <Tex>{'\\hat\\epsilon'}</Tex>。</> },
  { tex: 'z_{t-1}', shape: '64^2\\times 4', text: '把组合后的噪声预测交给 DDIM（或 DDPM、DPM-Solver）更新，回到上一步，循环几十次。' },
  { tex: 'z_0', shape: '64^2\\times 4', text: '循环结束，得到干净的 latent。' },
  { tex: '\\div s', shape: '64^2\\times 4', text: <>先除以 <Tex>s</Tex> 回到 encoder 的原始尺度。</> },
  { tex: '\\mathcal{D}', shape: '512^2\\times 3', frozen: true, text: 'decoder 只在最后调用这一次，把 latent 解码成图像。' },
]

export function PipelineDemo() {
  const [mode, setMode] = useState<'train' | 'sample'>('train')
  const [k, setK] = useState(0)
  const [steps, setSteps] = useState(50)
  const st = mode === 'train' ? TRAIN : SAMPLE
  const W = 660, bw = Math.min(82, (W - 10) / st.length - 12), gap = (W - st.length * bw) / (st.length - 1)
  return (
    <Demo title="LDM 的训练与采样，逐步看张量形状" label="训练与采样流程" hint="点击方框或用按钮逐步查看。灰色虚线框是冻结的 autoencoder。" onReset={() => { setMode('train'); setK(0); setSteps(50) }}>
      <Seg label="流程" value={mode} onChange={(m) => { setMode(m); setK(0) }} options={[{ value: 'train', label: '训练一步' }, { value: 'sample', label: '采样' }]} />
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} 132`} className="kb-chart" role="img" aria-label={mode === 'train' ? '训练流程' : '采样流程'}>
          {st.map((s, i) => {
            const x = i * (bw + gap)
            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => setK(i)}>
                <rect x={x} y={18} width={bw} height={58} rx={8} className={i === k ? 'kb-flow-box is-hot' : 'kb-flow-box'} strokeDasharray={s.frozen ? '4 3' : undefined} />
                <SvgTex x={x + bw / 2} y={48} w={bw} align="middle" size={16} color="var(--ink)"><Tex>{s.tex}</Tex></SvgTex>
                <SvgTex x={x + bw / 2} y={70} w={bw + gap} align="middle" size={10} color="var(--ink-3)"><Tex>{s.shape}</Tex></SvgTex>
                {s.frozen && <text x={x + bw / 2} y={12} textAnchor="middle" style={{ fontSize: 10 }}>冻结</text>}
                {i < st.length - 1 && <line x1={x + bw + 3} x2={x + bw + gap - 3} y1={47} y2={47} className="axis" />}
              </g>
            )
          })}
          {mode === 'sample' && <path d={`M${2 * (bw + gap) + bw / 2},78 C${2 * (bw + gap) + bw / 2},118 ${1 * (bw + gap) + bw / 2},118 ${1 * (bw + gap) + bw / 2},78`} className="stroke-ref" />}
          {mode === 'sample' && <text x={1.5 * (bw + gap) + bw / 2} y={128} textAnchor="middle">{`循环 ${steps} 步`}</text>}
          {mode === 'train' && <rect x={-2} y={8} width={4 * (bw + gap) - gap + 4} height={82} rx={10} fill="none" stroke="var(--c-uncond)" strokeOpacity={0.5} />}
          {mode === 'train' && <text x={2} y={104}>可以离线预先算好</text>}
        </svg>
      </div>
      <p className="kb-demo-note"><b>{k + 1}.</b> {st[k].text}</p>
      <div className="kb-presets">
        <button type="button" className="kb-btn-ghost" onClick={() => setK((k + st.length - 1) % st.length)}>上一步</button>
        <button type="button" className="kb-btn" onClick={() => setK((k + 1) % st.length)}>下一步</button>
      </div>
      {mode === 'sample' && (
        <>
          <label className="kb-slider"><span>采样步数</span><input type="range" min={10} max={1000} step={10} value={steps} onChange={(e) => setSteps(Number(e.target.value))} aria-label="采样步数" /><output>{steps}</output></label>
          <p className="kb-demo-readout">
            <span>UNet 调用 <b>{steps * 2}</b> 次（在 <Tex>{'64\\times64\\times4'}</Tex> 上）</span>
            <span>decoder 调用 <b>1</b> 次（输出 <Tex>{'512\\times512\\times3'}</Tex>）</span>
          </p>
        </>
      )}
    </Demo>
  )
}
