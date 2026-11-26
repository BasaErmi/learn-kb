import type { ReactNode } from 'react'
import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'
import { CODE_COLORS } from './QuantizeDemo'

const ENC = C.idm, DEC = C.fdm, CB = C.z, PRIOR = C.act

/** 一个只有边框和底色的小圆角块，里面一行字 */
function Pill({ x, y, w, h = 26, color, label, size = 11 }: { x: number; y: number; w: number; h?: number; color: string; label: string; size?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={`color-mix(in srgb, ${color} 16%, var(--card))`} stroke={color} strokeWidth={1.2} />
      <T x={x + w / 2} y={y + h / 2} w={w + 20} size={size} weight={600}>{label}</T>
    </g>
  )
}

/** 第 1 步：AE、VAE、VQ-VAE 的结构对比 */
export function AEFamilyFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)' })
  const ys = [8, 92, 176]
  const fx = 84, ex = 140, mx = 252, dx = 500, ox = 610
  const row = (y: number, mid: ReactNode, note: string) => (
    <g>
      <Frame x={fx} y={y} s={40} label="$x$" />
      <Arrow d={`M${fx + 43},${y + 20} H${ex - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={ex} y={y} w={92} h={40} color={ENC} title="编码器" titleSize={12} />
      <Arrow d={`M${ex + 95},${y + 20} H${mx - 3}`} color={C.ink3} marker={end('g')} />
      {mid}
      <Arrow d={`M${dx - 22},${y + 20} H${dx - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={dx} y={y} w={92} h={40} color={DEC} title="解码器" titleSize={12} />
      <Arrow d={`M${dx + 95},${y + 20} H${ox - 3}`} color={C.ink3} marker={end('g')} />
      <Frame x={ox} y={y} s={40} label="$\hat x$" color={DEC} />
      <T x={mx} y={y + 54} align="start" size={10} w={240} color={C.ink3}>{note}</T>
    </g>
  )
  return (
    <DiagramFigure
      w={652}
      h={246}
      label="AE、VAE、VQ-VAE 的结构对比"
      caption="三者都是“编码器 → 潜变量 → 解码器”，区别全在中间。AE 的 $z$ 是确定的连续向量，没有先验，不能生成；VAE 的 $z$ 从高斯里采样，KL 项把它拉向固定先验 $\mathcal{N}(0, I)$；VQ-VAE 把编码器输出换成码本里最近的码字，潜变量变成离散的编号，先验留到训练完再学。"
    >
      {defs}
      {['AE', 'VAE', 'VQ-VAE'].map((t, i) => <T key={t} x={0} y={ys[i] + 20} align="start" size={12.5} weight={600} w={80}>{t}</T>)}
      {row(ys[0], <Pill x={mx} y={ys[0] + 7} w={226} color={C.ink3} label="$z$：连续、确定" />, '没有先验，不能生成')}
      {row(ys[1], (
        <g>
          <Pill x={mx} y={ys[1] + 7} w={86} color={ENC} label="$\mu(x),\ \sigma(x)$" size={10.5} />
          <Arrow d={`M${mx + 89},${ys[1] + 20} H${mx + 112}`} color={C.ink3} marker={end('g')} />
          <Pill x={mx + 115} y={ys[1] + 7} w={111} color={C.ink3} label="$z \sim \mathcal{N}(\mu, \sigma^2)$" size={10.5} />
        </g>
      ), 'KL 把 $q(z \\mid x)$ 拉向固定先验 $\\mathcal{N}(0, I)$')}
      {row(ys[2], (
        <g>
          <Pill x={mx} y={ys[2] + 7} w={46} color={ENC} label="$z_e$" />
          <Arrow d={`M${mx + 49},${ys[2] + 20} H${mx + 70}`} color={C.ink3} marker={end('g')} />
          <Box x={mx + 73} y={ys[2]} w={84} h={40} color={CB} title="最近码字" sub="码本 $K \times D$" titleSize={11} subSize={9.5} tint={18} />
          <Arrow d={`M${mx + 160},${ys[2] + 20} H${mx + 175}`} color={CB} marker={end('g')} />
          <Pill x={mx + 178} y={ys[2] + 7} w={48} color={CB} label="$e_k$" />
        </g>
      ), '离散编号 $k$；先验训练完再学')}
    </DiagramFigure>
  )
}

/** 第 1 步：先验空洞（示意） */
export function PriorHoleFigure() {
  const blobs: [number, number, number, number, number][] = [[205, 70, 48, 22, -25], [300, 120, 40, 18, 30], [235, 150, 30, 14, 10], [330, 62, 26, 13, -10]]
  return (
    <DiagramFigure
      w={560}
      h={210}
      schematic
      label="聚合后验和固定先验不重合，中间出现空洞"
      caption="虚线圆是固定先验 $\mathcal{N}(0, I)$ 的高概率区域，彩色斑块是真实数据编码出来的聚合后验 $q(z)$。两者不重合：先验认为概率很高、但解码器从没见过的区域（叉号处）就是空洞，从那里采样只能解码出模糊或怪异的图。"
    >
      <circle cx={265} cy={105} r={98} fill="color-mix(in srgb, var(--ink-3) 6%, var(--card))" stroke="var(--ink-3)" strokeDasharray="5 4" />
      <T x={265} y={0} w={200} size={10.5} color={C.ink3}>{'先验 $\\mathcal{N}(0, I)$'}</T>
      {blobs.map(([x, y, rx, ry, rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} fill={`color-mix(in srgb, ${ENC} 30%, var(--card))`} stroke={ENC} strokeWidth={1} />
      ))}
      {[[248, 104], [192, 122], [332, 162]].map(([x, y], i) => (
        <path key={i} d={`M${x - 5},${y - 5} L${x + 5},${y + 5} M${x - 5},${y + 5} L${x + 5},${y - 5}`} stroke={C.accent} strokeWidth={1.8} />
      ))}
      <T x={380} y={50} align="start" size={11} color={ENC} w={180}>{'聚合后验 $q(z)$：真实编码在这里'}</T>
      <line x1={376} y1={52} x2={342} y2={62} stroke={ENC} strokeWidth={0.8} />
      <T x={380} y={150} align="start" size={11} color={C.accent} w={180}>空洞：先验概率高，解码器没见过</T>
      <line x1={376} y1={152} x2={336} y2={160} stroke={C.accent} strokeWidth={0.8} />
    </DiagramFigure>
  )
}

const GRID = [[0, 0, 3, 3], [0, 1, 1, 3], [5, 1, 4, 2], [5, 5, 4, 2]] // 示意用的索引网格
const SHADE = [[22, 30, 64, 70], [26, 44, 48, 68], [80, 46, 58, 36], [84, 78, 56, 40]] // z_e 每格的灰度示意

/** 第 2 步：逐位置量化，图像变成索引网格 */
export function GridFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', c: 'var(--c-latent)' })
  const cs = 15, gy = 44
  const grid = (x: number, fill: (i: number, j: number) => string, text?: (i: number, j: number) => string) => (
    <g>
      {GRID.map((r, i) => r.map((_, j) => (
        <g key={`${i}-${j}`}>
          <rect x={x + j * cs} y={gy + i * cs} width={cs} height={cs} fill={fill(i, j)} stroke="var(--card)" strokeWidth={1} />
          {text && <text x={x + j * cs + cs / 2} y={gy + i * cs + cs / 2 + 3.5} textAnchor="middle" fontSize={9.5} fontFamily="var(--mono)" fill="var(--ink)">{text(i, j)}</text>}
        </g>
      )))}
    </g>
  )
  const gw = 4 * cs
  const xs = { img: 0, enc: 64, ze: 148, idx: 288, zq: 428, dec: 520, out: 612 }
  return (
    <DiagramFigure
      w={652}
      h={214}
      label="图像经编码器得到特征图，每个位置独立量化成码本编号，再查表送进解码器"
      caption="编码器把图像压成 $H' \times W'$ 的特征图 $z_e(x)$，每个位置是一个 $D$ 维向量。每个位置独立地找最近的码字，得到一张整数的索引网格；查码本把编号换回码字向量，就是解码器的输入 $z_q(x)$。所有位置、所有图片共用同一个码本。网格大小和编号只是示意。"
    >
      {defs}
      <Frame x={xs.img} y={gy + 6} s={48} label="$x$" />
      <Arrow d={`M${xs.img + 51},${gy + 30} H${xs.enc - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={xs.enc} y={gy + 8} w={64} h={44} color={ENC} title="编码器" titleSize={11.5} />
      <Arrow d={`M${xs.enc + 67},${gy + 30} H${xs.ze - 3}`} color={C.ink3} marker={end('g')} />
      {grid(xs.ze, (i, j) => `color-mix(in srgb, ${ENC} ${SHADE[i][j]}%, var(--card))`)}
      <T x={xs.ze + gw / 2} y={gy - 26} w={120} size={11}>{"$z_e(x)$"}</T>
      <T x={xs.ze + gw / 2} y={gy - 10} w={120} size={9.5} color={C.ink3}>{"$H' \\times W' \\times D$"}</T>
      <Arrow d={`M${xs.ze + gw + 3},${gy + 30} H${xs.idx - 3}`} color={CB} marker={end('c')} width={1.8} />
      <T x={(xs.ze + gw + xs.idx) / 2} y={gy + 14} w={90} size={9.5} color={CB}>逐位置找</T>
      <T x={(xs.ze + gw + xs.idx) / 2} y={gy + 46} w={90} size={9.5} color={CB}>最近码字</T>
      {grid(xs.idx, (i, j) => `color-mix(in srgb, ${CODE_COLORS[GRID[i][j]]} 22%, var(--card))`, (i, j) => String(GRID[i][j] + 1))}
      <T x={xs.idx + gw / 2} y={gy - 26} w={120} size={11}>索引网格</T>
      <T x={xs.idx + gw / 2} y={gy - 10} w={120} size={9.5} color={C.ink3}>{"$H' \\times W'$ 个整数"}</T>
      <Arrow d={`M${xs.idx + gw + 3},${gy + 30} H${xs.zq - 3}`} color={CB} marker={end('c')} width={1.8} />
      <T x={(xs.idx + gw + xs.zq) / 2} y={gy + 14} w={60} size={9.5} color={CB}>查码本</T>
      {grid(xs.zq, (i, j) => CODE_COLORS[GRID[i][j]])}
      <T x={xs.zq + gw / 2} y={gy - 26} w={120} size={11}>{"$z_q(x)$"}</T>
      <T x={xs.zq + gw / 2} y={gy - 10} w={120} size={9.5} color={C.ink3}>{"$H' \\times W' \\times D$"}</T>
      <Arrow d={`M${xs.zq + gw + 3},${gy + 30} H${xs.dec - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={xs.dec} y={gy + 8} w={64} h={44} color={DEC} title="解码器" titleSize={11.5} />
      <Arrow d={`M${xs.dec + 67},${gy + 30} H${xs.out - 3}`} color={C.ink3} marker={end('g')} />
      <Frame x={xs.out} y={gy + 6} s={40} label="$\hat x$" color={DEC} />

      {/* 码本 */}
      <T x={xs.idx - 24} y={150} align="start" size={10.5} color={CB} w={80}>{'码本 $K \\times D$'}</T>
      {CODE_COLORS.map((c, k) => (
        <g key={k}>
          <rect x={xs.idx + 50 + k * 22} y={140} width={18} height={20} rx={2} fill={c} opacity={0.85} />
          <text x={xs.idx + 59 + k * 22} y={172} textAnchor="middle" fontSize={9} fontFamily="var(--mono)" fill="var(--ink-2)">{k + 1}</text>
        </g>
      ))}
      <Arrow d={`M${xs.idx + gw + 34},${137} V${gy + 36}`} color={CB} marker={end('c')} dashed />
      <T x={0} y={200} align="start" size={10} w={640} color={C.ink3}>{'ImageNet 设置：$128 \\times 128 \\times 3 \\to 32 \\times 32$，$K = 512$，一张图变成 1024 个“视觉 token”'}</T>
    </DiagramFigure>
  )
}

/** 第 3 步：STE 的前向与反向——同一列对齐，反向在量化处分成“链式法则 ×0”和“STE ×I”两条路 */
export function SteGraphFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', b: 'var(--accent)', x: 'var(--ink-3)' })
  const fy = 34 // 前向这一行的中心
  const sy = 118, ty = 172 // 反向：STE 一路、真实链式法则一路
  const ze = { x: 112, w: 60 }, q = { x: 200, w: 124 }, zq = { x: 352, w: 60 }, dec = { x: 440, w: 88 }
  const cx = (o: { x: number; w: number }) => o.x + o.w / 2
  return (
    <DiagramFigure
      w={640}
      h={196}
      label="STE：前向走硬量化；反向时真实链式法则在量化处乘 0，STE 改成乘单位矩阵，把梯度原样交给编码器输出"
      caption="上一行是前向：$z_e$ 经过硬量化变成 $z_q$，再进解码器算损失。下面是反向：梯度穿过解码器到达 $z_q$ 之后，要再穿过量化才能到 $z_e$。按链式法则，这里要乘量化函数的导数 $dz_q/dz_e$，它处处为 0，梯度断在这里（灰线）；STE 把这个导数换成单位矩阵，$\partial \mathcal{L}/\partial z_q$ 原样交给 $z_e$（橙线）。写成一行就是 $z_{q,\text{st}} = z_e + \mathrm{sg}[z_q - z_e]$。"
    >
      {defs}
      <T x={0} y={fy} align="start" size={11.5} weight={600} w={60}>前向</T>
      <T x={0} y={(sy + ty) / 2} align="start" size={11.5} weight={600} w={60} color={C.accent}>反向</T>
      {/* 前向 */}
      <Pill x={ze.x} y={fy - 13} w={ze.w} color={ENC} label="$z_e$" />
      <Arrow d={`M${ze.x + ze.w + 3},${fy} H${q.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={q.x} y={fy - 20} w={q.w} h={40} color={CB} title="硬量化" sub="$e_k,\ k = \arg\min_j \|z_e - e_j\|$" titleSize={11} subSize={9.5} tint={18} />
      <Arrow d={`M${q.x + q.w + 3},${fy} H${zq.x - 3}`} color={C.ink3} marker={end('g')} />
      <Pill x={zq.x} y={fy - 13} w={zq.w} color={CB} label="$z_q$" />
      <Arrow d={`M${zq.x + zq.w + 3},${fy} H${dec.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={dec.x} y={fy - 20} w={dec.w} h={40} color={DEC} title="解码器" titleSize={11.5} />
      <Arrow d={`M${dec.x + dec.w + 3},${fy} H${566}`} color={C.ink3} marker={end('g')} />
      <T x={574} y={fy} align="start" size={13} w={40}>{'$\\mathcal{L}$'}</T>
      {/* 反向：从损失穿过解码器回到 z_q */}
      <Arrow d={`M${582},${fy + 14} V${sy} H${zq.x + zq.w + 3}`} color={C.accent} marker={end('b')} width={1.8} />
      <T x={cx(dec)} y={sy - 11} w={160} size={10} color={C.accent}>反传穿过解码器</T>
      <Pill x={zq.x} y={sy - 13} w={zq.w} color={C.accent} label="$\partial \mathcal{L}/\partial z_q$" size={10.5} />
      {/* 在量化这一列分成两路 */}
      <Arrow d={`M${zq.x - 3},${sy} H${ze.x + ze.w + 3}`} color={C.accent} marker={end('b')} width={2} />
      <T x={cx(q)} y={sy - 11} w={200} size={10.5} color={C.accent} weight={600}>{'STE：乘 $I$，原样复制'}</T>
      <Arrow d={`M${zq.x + 10},${sy + 15} V${ty} H${q.x + 22}`} color={C.ink3} marker={end('x')} dashed />
      <T x={cx(q) + 30} y={ty + 13} w={220} size={10.5} color={C.ink3}>{'链式法则：乘 $dz_q/dz_e = 0$，梯度断掉'}</T>
      <path d={`M${q.x + 8},${ty - 6} L${q.x + 20},${ty + 6} M${q.x + 8},${ty + 6} L${q.x + 20},${ty - 6}`} stroke="var(--ink-3)" strokeWidth={1.8} />
      {/* 到达 z_e 的梯度 */}
      <Pill x={ze.x - 38} y={sy - 13} w={ze.w + 38} color={C.accent} label="$\nabla_{z_e} = \partial \mathcal{L}/\partial z_q$" size={10} />
      <Pill x={ze.x - 38} y={ty - 13} w={ze.w + 38} color={C.ink3} label="$\nabla_{z_e} = 0$" size={10.5} />
    </DiagramFigure>
  )
}

/** 第 4 步：三项损失分别更新谁 */
export function GradFlowFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', r: 'var(--c-fdm)', c: 'var(--c-latent)', m: 'var(--c-cond)' })
  const y = 70
  const enc = { x: 60, w: 86 }, q = { x: 236, w: 110 }, dec = { x: 436, w: 86 }
  const ly = 190
  return (
    <DiagramFigure
      w={640}
      h={250}
      label="重建损失、码本损失、commitment 损失分别把梯度送给哪个组件"
      caption="① 重建损失更新解码器，并经 STE 更新编码器，但碰不到码本（码字只出现在 $\mathrm{sg}$ 里）；② 码本损失对 $z_e$ 停梯度，只把码字拉向编码器输出；③ commitment 对码字停梯度，只把编码器输出拉向选中的码字，权重 $\beta = 0.25$。三处 $\mathrm{sg}$ 各司其职。"
    >
      {defs}
      <Frame x={0} y={y} s={40} label="$x$" />
      <Arrow d={`M43,${y + 20} H${enc.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={enc.x} y={y} w={enc.w} h={40} color={ENC} title="编码器" titleSize={11.5} />
      <Arrow d={`M${enc.x + enc.w + 3},${y + 20} H${q.x - 3}`} color={C.ink3} marker={end('g')} />
      <T x={(enc.x + enc.w + q.x) / 2} y={y + 8} w={40} size={10.5}>{'$z_e$'}</T>
      <Box x={q.x} y={y} w={q.w} h={40} color={C.ink3} title="最近邻量化" titleSize={11} />
      <Box x={q.x + 5} y={0} w={q.w - 10} h={36} color={CB} title="码本" sub="$\{e_1, \dots, e_K\}$" titleSize={11} subSize={9.5} tint={20} />
      <Arrow d={`M${q.x + q.w / 2},39 V${y - 3}`} color={CB} marker={end('c')} />
      <Arrow d={`M${q.x + q.w + 3},${y + 20} H${dec.x - 3}`} color={C.ink3} marker={end('g')} />
      <T x={(q.x + q.w + dec.x) / 2} y={y + 8} w={60} size={10.5}>{'$z_q = e_k$'}</T>
      <Box x={dec.x} y={y} w={dec.w} h={40} color={DEC} title="解码器" titleSize={11.5} />
      <Arrow d={`M${dec.x + dec.w + 3},${y + 20} H568`} color={C.ink3} marker={end('g')} />
      <Frame x={571} y={y} s={40} label="$\hat x$" color={DEC} />

      {/* 三项损失 */}
      <Box x={dec.x - 10} y={ly} w={196} h={40} color={DEC} title="① 重建 $-\log p(x \mid z_q)$" titleSize={10.5} />
      <Box x={q.x - 12} y={ly} w={134} h={40} color={CB} title="② $\|\mathrm{sg}[z_e] - e_k\|^2$" titleSize={10.5} tint={18} />
      <Box x={enc.x - 44} y={ly} w={160} h={40} color={ENC} title="③ $\beta\,\|z_e - \mathrm{sg}[e_k]\|^2$" titleSize={10.5} />
      {/* 梯度去向 */}
      <Arrow d={`M${dec.x + dec.w / 2},${ly - 2} V${y + 43}`} color={DEC} marker={end('r')} dashed width={1.6} />
      <Arrow d={`M${dec.x + 6},${ly - 2} V${150} H${enc.x + enc.w - 14} V${y + 43}`} color={DEC} marker={end('r')} dashed width={1.6} />
      <T x={(enc.x + enc.w + dec.x) / 2 + 20} y={140} w={120} size={9.5} color={DEC}>经 STE</T>
      <Arrow d={`M${q.x + q.w - 30},${ly - 2} V${130} H${q.x + q.w + 14} V${30} H${q.x + q.w - 2}`} color={CB} marker={end('c')} dashed width={1.6} />
      <Arrow d={`M${enc.x + 30},${ly - 2} V${y + 43}`} color={ENC} marker={end('m')} dashed width={1.6} />
    </DiagramFigure>
  )
}

/** 第 6 步：两阶段训练与生成 */
export function TwoStageFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', p: 'var(--c-act)', c: 'var(--c-latent)' })
  const ys = [10, 104, 198]
  const LW = 92
  return (
    <DiagramFigure
      w={660}
      h={262}
      label="VQ-VAE 的两阶段流程：先训自编码器，再在索引网格上训先验，最后从先验采样生成"
      caption="阶段一训练编码器、码本和解码器（均匀先验，KL 是常数）。阶段二冻结编码器和码本，把训练集每张图编码成索引网格，在这些网格上用自回归模型做最大似然，学出先验 $p_\psi(z)$。生成时不需要编码器：从先验逐个采样编号，查码本，交给解码器。"
    >
      {defs}
      {[['阶段一', '训练自编码器'], ['阶段二', '学先验'], ['生成', '不用编码器']].map(([a, b], i) => (
        <g key={a}>
          <T x={0} y={ys[i] + 14} align="start" size={12} weight={600} w={LW}>{a}</T>
          <T x={0} y={ys[i] + 32} align="start" size={10.5} color={C.ink3} w={LW}>{b}</T>
        </g>
      ))}
      <line x1={0} x2={660} y1={90} y2={90} stroke="var(--rule)" />
      <line x1={0} x2={660} y1={184} y2={184} stroke="var(--rule)" />
      {/* 阶段一 */}
      <Frame x={LW} y={ys[0] + 2} s={40} label="$x$" />
      <Arrow d={`M${LW + 43},${ys[0] + 22} H${LW + 63}`} color={C.ink3} marker={end('g')} />
      <Box x={LW + 66} y={ys[0]} w={78} h={44} color={ENC} title="编码器" titleSize={11.5} />
      <Arrow d={`M${LW + 147},${ys[0] + 22} H${LW + 167}`} color={C.ink3} marker={end('g')} />
      <Box x={LW + 170} y={ys[0]} w={92} h={44} color={CB} title="码本量化" titleSize={11.5} tint={18} />
      <Arrow d={`M${LW + 265},${ys[0] + 22} H${LW + 285}`} color={C.ink3} marker={end('g')} />
      <Box x={LW + 288} y={ys[0]} w={78} h={44} color={DEC} title="解码器" titleSize={11.5} />
      <Arrow d={`M${LW + 369},${ys[0] + 22} H${LW + 389}`} color={C.ink3} marker={end('g')} />
      <Frame x={LW + 392} y={ys[0] + 2} s={40} label="$\hat x$" color={DEC} />
      <T x={LW + 444} y={ys[0] + 22} align="start" size={10.5} w={130} color={C.ink3}>重建 + 码本 + commitment</T>
      {/* 阶段二 */}
      <Frame x={LW} y={ys[1] + 2} s={40} label="$x^{(n)}$" size={12} />
      <Arrow d={`M${LW + 43},${ys[1] + 22} H${LW + 63}`} color={C.ink3} marker={end('g')} />
      <Box x={LW + 66} y={ys[1]} w={196} h={44} color={ENC} title="编码器 + 量化" sub="冻结" frozen titleSize={11.5} />
      <Arrow d={`M${LW + 265},${ys[1] + 22} H${LW + 285}`} color={CB} marker={end('c')} width={1.8} />
      <g>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={LW + 288 + i * 20} y={ys[1] + 12} width={18} height={20} rx={2} fill={`color-mix(in srgb, ${CODE_COLORS[[1, 0, 2, 2][i]]} 25%, var(--card))`} stroke={CODE_COLORS[[1, 0, 2, 2][i]]} />
            <text x={LW + 297 + i * 20} y={ys[1] + 26} textAnchor="middle" fontSize={9.5} fontFamily="var(--mono)" fill="var(--ink)">{[2, 1, 3, 3][i]}</text>
          </g>
        ))}
        <T x={LW + 327} y={ys[1] + 4} w={120} size={9.5} color={C.ink3}>{'索引网格 $z^{(n)}$'}</T>
      </g>
      <Arrow d={`M${LW + 371},${ys[1] + 22} H${LW + 391}`} color={CB} marker={end('c')} width={1.8} />
      <Box x={LW + 394} y={ys[1]} w={170} h={44} color={PRIOR} title="自回归先验 $p_\psi(z)$" sub="交叉熵，最大似然" titleSize={11} subSize={9.5} tint={16} />
      {/* 生成 */}
      <Box x={LW} y={ys[2]} w={150} h={44} color={PRIOR} title="从 $p_\psi$ 逐个采样" sub="$z_1, z_2, \dots, z_N$" titleSize={11} subSize={9.5} tint={16} />
      <Arrow d={`M${LW + 153},${ys[2] + 22} H${LW + 185}`} color={CB} marker={end('c')} width={1.8} />
      <Box x={LW + 188} y={ys[2]} w={92} h={44} color={CB} title="查码本" sub="$e_{z_i}$" titleSize={11.5} subSize={9.5} tint={18} />
      <Arrow d={`M${LW + 283},${ys[2] + 22} H${LW + 303}`} color={C.ink3} marker={end('g')} />
      <Box x={LW + 306} y={ys[2]} w={78} h={44} color={DEC} title="解码器" titleSize={11.5} />
      <Arrow d={`M${LW + 387},${ys[2] + 22} H${LW + 407}`} color={C.ink3} marker={end('g')} />
      <Frame x={LW + 410} y={ys[2] + 2} s={40} label="$x_{\text{gen}}$" color={DEC} size={11} />
      <Arrow d={`M${LW + 479},${ys[1] + 46} V${ys[2] - 14} H${LW + 75} V${ys[2] - 3}`} color={PRIOR} marker={end('p')} dashed />
      <T x={LW + 486} y={ys[2] - 24} align="start" size={10} w={90} color={PRIOR}>训好的先验</T>
    </DiagramFigure>
  )
}

/** 第 7 步：死码字（示意） */
export function DeadCodeFigure() {
  const used: [number, number][] = [[120, 92], [150, 120], [108, 128], [160, 84]]
  const dead: [number, number][] = [[30, 30], [250, 40], [258, 160], [34, 168]]
  const used2: [number, number][] = [[420, 88], [452, 118], [410, 126], [462, 84], [440, 100], [432, 140], [470, 140], [398, 104]]
  return (
    <DiagramFigure
      w={560}
      h={210}
      schematic
      label="随机初始化时远离数据的码字永远选不上；用编码器输出初始化或重启后，码字都落在数据附近"
      caption="灰色区域是编码器输出所在的范围。左：码本随机初始化，落在数据外的码字从未被选中，码本损失碰不到它们，永远原地不动，有效码本只剩 4 个。右：用编码器输出初始化码本，或定期把没人用的码字重启到随机一个 $z_e$ 上，8 个码字都参与量化。"
    >
      {[0, 300].map((ox, p) => (
        <g key={p}>
          <ellipse cx={ox + 136} cy={106} rx={58} ry={44} fill="color-mix(in srgb, var(--ink-3) 14%, var(--card))" stroke="var(--ink-3)" strokeWidth={0.8} />
          <T x={ox + 136} y={8} w={260} size={11} weight={600}>{p === 0 ? '随机初始化' : '用 $z_e$ 初始化 / 重启'}</T>
        </g>
      ))}
      {used.map(([x, y], i) => <rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={2} fill={CB} />)}
      {dead.map(([x, y], i) => <rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={2} fill="var(--card)" stroke="var(--ink-3)" strokeDasharray="2 2" />)}
      <T x={150} y={194} w={260} size={10.5} color={C.ink3}>虚线方块：死码字，梯度为 0</T>
      {used2.map(([x, y], i) => <rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={2} fill={CB} />)}
      <T x={436} y={194} w={260} size={10.5} color={C.ink3}>8 个码字都在用</T>
    </DiagramFigure>
  )
}

/** 第 7 步：后续发展的脉络 */
export function LineageFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)' })
  return (
    <DiagramFigure
      w={640}
      h={190}
      label="从 VQ-VAE 出发的几条发展线"
      caption="VQ-VAE-2 把一张网格拆成全局、局部两层；VQGAN 换掉 MSE 重建、把先验换成 Transformer，形成“tokenizer + 自回归”的范式；LDM 继承 VQGAN 的自编码器，用扩散模型当先验；LAPA 的 LAQ 是条件 VQ-VAE，把两帧之间的变化量化成离散的潜在动作。"
    >
      {defs}
      <Box x={0} y={70} w={110} h={48} color={CB} title="VQ-VAE" sub="码本 + STE + 先验" titleSize={12} subSize={9.5} tint={20} />
      <Arrow d="M113,94 H135 V24 H158" color={C.ink3} marker={end('g')} />
      <Arrow d="M113,94 H158" color={C.ink3} marker={end('g')} />
      <Arrow d="M113,94 H135 V164 H158" color={C.ink3} marker={end('g')} />
      <Box x={161} y={2} w={170} h={44} color={C.ink3} title="VQ-VAE-2" sub="顶层管全局、底层管细节" titleSize={11.5} subSize={9.5} />
      <Box x={161} y={72} w={170} h={44} color={DEC} title="VQGAN" sub="感知 + 对抗损失，Transformer 先验" titleSize={11.5} subSize={9} />
      <Box x={161} y={142} w={170} h={44} color={C.act} title="LAPA 的 LAQ" sub="条件 VQ-VAE，潜在动作" titleSize={11.5} subSize={9.5} />
      <Arrow d="M334,94 H370" color={C.ink3} marker={end('g')} />
      <Box x={373} y={72} w={190} h={44} color={ENC} title="LDM" sub="扩散模型当先验，在量化前的 $z_e$ 上" titleSize={11.5} subSize={9} />
    </DiagramFigure>
  )
}
