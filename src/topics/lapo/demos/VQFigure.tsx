import { Arrow, C, DiagramFigure, T, useArrows } from './diagram'

const IDX = [12, 3, 57, 40, 8, 33, 21, 60] // 示意用的码字编号
const X0 = 30, SW = 58, N = 8
const segX = (i: number) => X0 + i * SW
const Y_Z = 34, Y_CB = 92, Y_IDX = 150, Y_ZQ = 186, SH = 24

// 容量刻度（对数）
const AX0 = 60, AX1 = 650, AY = 300
const lx = (bits: number) => AX0 + (Math.log10(bits) / 5) * (AX1 - AX0)
const BITS = [
  { v: Math.log2(15), label: '真实动作：$\\log_2 15 \\approx 3.9$', color: C.act, align: 'middle' as const, dx: 0 },
  { v: 48, label: '$z_t^{q}$：$8 \\times \\log_2 64 = 48$', color: C.z, align: 'start' as const, dx: -12 },
  { v: 64 * 64 * 3 * 8, label: '一帧画面：$64 \\times 64 \\times 3 \\times 8 = 98{,}304$', color: C.ink2, align: 'end' as const, dx: 10 },
]

/** VQ 的前向（就近替换）、反向（straight-through）和它带来的容量上限 */
export function VQFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)' })
  const right = segX(N) // z 条的右端
  return (
    <DiagramFigure
      w={680}
      h={334}
      label="LAPO 的向量量化与潜在动作的容量"
      caption="上半部分：IDM 输出的 128 维向量切成 8 段，每段在所属码本（各 64 个码字）里找最近的一个替换掉，图中的编号只是示意。下半部分是对数刻度：量化后每条转移最多携带 48 bit，比一帧画面少三个数量级，复制下一帧这条路被堵死了；但它仍比区分 15 个动作所需的约 3.9 bit 宽得多。"
    >
      {defs}
      <T x={X0} y={14} align="start" size={11.5} color={C.ink2} w={420}>{'IDM 的输出 $z_t \\in \\mathbb{R}^{128}$：切成 8 段，每段 16 维'}</T>
      {/* z_t 八段 */}
      {IDX.map((_, i) => (
        <g key={i}>
          <rect x={segX(i) + 1} y={Y_Z} width={SW - 2} height={SH} rx={3} fill={`color-mix(in srgb, var(--c-latent) ${i < 4 ? 22 : 34}%, var(--card))`} stroke={C.z} strokeWidth={1} />
          <T x={segX(i) + SW / 2} y={Y_Z + SH / 2} w={SW} size={10} color={C.ink2}>{`16 维`}</T>
          <Arrow d={`M${segX(i) + SW / 2},${Y_Z + SH + 2} V${Y_CB - 3}`} color={C.ink3} marker={end('g')} />
          <Arrow d={`M${segX(i) + SW / 2},${Y_CB + 34 + 2} V${Y_IDX - 11}`} color={C.ink3} />
          <rect x={segX(i) + SW / 2 - 18} y={Y_IDX - 10} width={36} height={20} rx={10} fill="var(--card)" stroke={C.z} />
          <T x={segX(i) + SW / 2} y={Y_IDX} w={40} size={10.5} color={C.z} weight={600}>{`#${IDX[i]}`}</T>
          <Arrow d={`M${segX(i) + SW / 2},${Y_IDX + 11} V${Y_ZQ - 3}`} color={C.z} marker={end('z')} />
          <rect x={segX(i) + 1} y={Y_ZQ} width={SW - 2} height={SH} rx={3} fill={`color-mix(in srgb, var(--c-latent) ${i < 4 ? 55 : 75}%, var(--card))`} stroke={C.z} strokeWidth={1} />
        </g>
      ))}
      {/* 两个码本 */}
      {[0, 1].map((b) => (
        <g key={b}>
          <rect x={segX(b * 4) + 1} y={Y_CB} width={4 * SW - 2} height={34} rx={6} fill="var(--paper-2)" stroke={C.ink3} strokeWidth={1} />
          <T x={segX(b * 4) + 2 * SW} y={Y_CB + 17} w={4 * SW} size={11} color={C.ink2}>{`码本 ${b + 1}：64 个 16 维码字`}</T>
        </g>
      ))}
      <T x={X0} y={Y_ZQ + SH + 14} align="start" size={11.5} color={C.ink2} w={420}>{'量化后的 $z_t^{q}$：8 个码字拼回 128 维，交给 FDM'}</T>

      {/* 右侧说明：前向与反向 */}
      <T x={right + 18} y={Y_Z + 4} align="start" size={11} w={190} color={C.ink}>前向：每段换成最近的码字</T>
      <T x={right + 18} y={Y_Z + 26} align="start" size={11} w={190} color={C.ink2}>{'$i^* = \\arg\\min_i \\|z - c_i\\|$'}</T>
      <Arrow d={`M${right + 6},${Y_ZQ + SH / 2} H${right + 12} V${Y_Z + SH / 2 + 4} H${right + 4}`} color={C.z} marker={end('z')} dashed />
      <T x={right + 18} y={Y_ZQ - 24} align="start" size={11} w={190} color={C.ink}>反向：梯度跳过 argmin</T>
      <T x={right + 18} y={Y_ZQ - 6} align="start" size={11} w={190} color={C.ink2}>{'原样复制给 $z_t$（straight-through）'}</T>
      <T x={right + 18} y={Y_CB + 8} align="start" size={10.5} w={190} color={C.ink3}>码字用 EMA 更新，</T>
      <T x={right + 18} y={Y_CB + 25} align="start" size={10.5} w={190} color={C.ink3}>commitment 系数 0.05</T>

      {/* 下半：容量对数刻度 */}
      <line x1={0} x2={680} y1={236} y2={236} stroke="var(--rule)" />
      <T x={0} y={252} align="start" size={11.5} color={C.ink2} w={360}>每条转移能携带多少 bit（对数刻度）</T>
      <line x1={AX0} x2={AX1} y1={AY} y2={AY} className="axis" />
      {[1, 10, 100, 1000, 10000, 100000].map((v) => (
        <g key={v}>
          <line x1={lx(v)} x2={lx(v)} y1={AY - 3} y2={AY + 3} className="axis" />
          <T x={lx(v)} y={AY + 14} w={60} size={10} color={C.ink3}>{v >= 1000 ? `${v / 1000}k` : String(v)}</T>
        </g>
      ))}
      {BITS.map((b, i) => (
        <g key={i}>
          <circle cx={lx(b.v)} cy={AY} r={4.5} fill={b.color} />
          <line x1={lx(b.v)} x2={lx(b.v)} y1={AY - 5} y2={AY - 20} stroke={b.color} strokeWidth={1} />
          <T x={lx(b.v) + b.dx} y={AY - 30} w={260} size={10.5} color={b.color} align={b.align}>{b.label}</T>
        </g>
      ))}
    </DiagramFigure>
  )
}
