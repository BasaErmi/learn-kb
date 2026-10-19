import { Demo } from '@/kb/components/Demo'

/** 率失真示意：横轴码率（保留的比特），纵轴失真；左段语义压缩，右段感知压缩 */
export function RateDistortionChart() {
  const W = 620, H = 250, L = 56, B = 200, R = 590, Tp = 24
  const x = (r: number) => L + r * (R - L)
  const y = (d: number) => B - d * (B - Tp)
  const D = (r: number) => 0.06 + 0.92 * Math.exp(-r * 9) + 0.06 * (1 - r)
  const pts = Array.from({ length: 101 }, (_, i) => i / 100)
  const path = pts.map((r, i) => `${i ? 'L' : 'M'}${x(r).toFixed(1)},${y(D(r)).toFixed(1)}`).join('')
  const knee = 0.28
  return (
    <Demo title="率失真：大部分比特花在看不出来的细节上" label="率失真示意图" schematic hint="从右往左压缩：先丢掉的是高频细节，失真几乎不变；越过拐点后才开始丢语义和构图。LDM 让 autoencoder 负责右段，扩散模型只学左段。">
      <div className="kb-svg-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="率失真曲线示意">
          <rect x={x(0)} y={Tp} width={x(knee) - x(0)} height={B - Tp} fill="color-mix(in srgb, var(--c-cond) 9%, transparent)" />
          <rect x={x(knee)} y={Tp} width={x(1) - x(knee)} height={B - Tp} fill="color-mix(in srgb, var(--c-guided) 9%, transparent)" />
          <line x1={L} x2={R} y1={B} y2={B} className="axis" />
          <line x1={L} x2={L} y1={Tp} y2={B} className="axis" />
          <path d={path} className="stroke-cond" />
          <line x1={x(knee)} x2={x(knee)} y1={Tp} y2={B} className="stroke-ref" />
          <text x={x(knee / 2)} y={Tp + 18} textAnchor="middle" style={{ fill: 'var(--c-cond)', fontWeight: 600 }}>语义压缩</text>
          <text x={x(knee / 2)} y={Tp + 34} textAnchor="middle">构图、物体：扩散模型学</text>
          <text x={x((1 + knee) / 2)} y={Tp + 18} textAnchor="middle" style={{ fill: 'var(--c-guided)', fontWeight: 600 }}>感知压缩</text>
          <text x={x((1 + knee) / 2)} y={Tp + 34} textAnchor="middle">高频纹理：autoencoder 负责，丢了也几乎看不出</text>
          <text x={(L + R) / 2} y={B + 30} textAnchor="middle">码率（保留的比特数）→</text>
          <text x={L - 10} y={(Tp + B) / 2} textAnchor="middle" transform={`rotate(-90 ${L - 10} ${(Tp + B) / 2})`}>失真 →</text>
        </svg>
      </div>
    </Demo>
  )
}
