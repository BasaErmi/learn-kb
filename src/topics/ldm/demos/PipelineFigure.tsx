import { Tex } from '@/kb/components/Tex'
import { SvgTex } from '@/kb/components/SvgSub'

interface Node { tex: string; shape: string; frozen?: boolean }
const TRAIN: Node[] = [
  { tex: 'x', shape: '512^2\\times 3' },
  { tex: '\\mathcal{E}', shape: '64^2\\times 8', frozen: true },
  { tex: 'z = \\mu + \\sigma\\odot\\epsilon', shape: '64^2\\times 4' },
  { tex: 'z_0 = s\\,z', shape: '64^2\\times 4' },
  { tex: 'z_t', shape: '64^2\\times 4' },
  { tex: '\\epsilon_\\theta', shape: '64^2\\times 4' },
  { tex: '\\|\\epsilon - \\epsilon_\\theta\\|^2', shape: '\\text{标量}' },
]
const SAMPLE: Node[] = [
  { tex: 'z_T \\sim \\mathcal{N}(0, I)', shape: '64^2\\times 4' },
  { tex: '\\epsilon_\\theta\\ \\times 2', shape: '\\text{CFG}' },
  { tex: 'z_{t-1}', shape: '64^2\\times 4' },
  { tex: 'z_0', shape: '64^2\\times 4' },
  { tex: '\\tfrac{z_0}{s}', shape: '64^2\\times 4' },
  { tex: '\\mathcal{D}', shape: '512^2\\times 3', frozen: true },
]
const W = 680, bw = 84

function Row({ nodes, y, label }: { nodes: Node[]; y: number; label: string }) {
  const gap = (W - 60 - nodes.length * bw) / (nodes.length - 1)
  const x = (i: number) => 60 + i * (bw + gap)
  return (
    <g>
      <text x={0} y={y + 33} style={{ fill: 'var(--ink-2)', fontWeight: 600 }}>{label}</text>
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={x(i)} y={y} width={bw} height={56} rx={8} className="kb-flow-box" strokeDasharray={n.frozen ? '4 3' : undefined} />
          <SvgTex x={x(i) + bw / 2} y={y + 28} w={bw + gap} align="middle" size={13} color="var(--ink)"><Tex>{n.tex}</Tex></SvgTex>
          <SvgTex x={x(i) + bw / 2} y={y + 50} w={bw} align="middle" size={10} color="var(--ink-3)"><Tex>{n.shape}</Tex></SvgTex>
          {i < nodes.length - 1 && <line x1={x(i) + bw + 3} x2={x(i + 1) - 3} y1={y + 28} y2={y + 28} className="axis" />}
        </g>
      ))}
    </g>
  )
}

/** LDM 训练一步与采样的数据流，标出每一步的张量形状 */
export function PipelineFigure() {
  const gapS = (W - 60 - SAMPLE.length * bw) / (SAMPLE.length - 1)
  const cx = (i: number) => 60 + i * (bw + gapS) + bw / 2
  const gapT = (W - 60 - TRAIN.length * bw) / (TRAIN.length - 1)
  return (
    <figure className="kb-figure">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} 222`} className="kb-chart" role="img" aria-label="LDM 训练与采样流程">
          <rect x={56} y={4} width={4 * bw + 3 * gapT + 8} height={64} rx={10} fill="none" stroke="var(--c-uncond)" strokeOpacity={0.55} />
          <text x={60} y={84} style={{ fill: 'var(--c-uncond)' }}>可以离线预先算好</text>
          <Row nodes={TRAIN} y={8} label="训练" />
          <Row nodes={SAMPLE} y={120} label="采样" />
          <path d={`M${cx(2)},178 C${cx(2)},208 ${cx(1)},208 ${cx(1)},178`} className="stroke-ref" />
          <text x={(cx(1) + cx(2)) / 2} y={218} textAnchor="middle">循环几十步</text>
        </svg>
      </div>
      <figcaption>虚线框是冻结的 autoencoder。训练时前四步不依赖扩散模型，可以提前把整个数据集编码好；采样时 UNet 在 <Tex>{'64\\times64\\times4'}</Tex> 上调用几十到上百次（CFG 每步两次），decoder 只在最后调用一次。图中按生成 512×512 的 SD 1.x 标注形状。</figcaption>
    </figure>
  )
}
