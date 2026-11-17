import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from './diagram'

const BH = 46
const LABEL_W = 92

/** 三个阶段：IDM+FDM → 潜在行为克隆 → 离线解码部署 */
export function PipelineFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--c-act)' })
  const rowY = [16, 128, 252]
  const fs = 38
  return (
    <DiagramFigure
      w={680}
      h={350}
      label="LAPO 的三个阶段"
      caption="虚线框表示参数冻结。前两个阶段用的是同一批无标签视频：阶段 1 训练出 IDM，阶段 2 用 IDM 打出的 $z_t$ 当标签训练策略。阶段 3 的离线方案只额外需要几百条带真实动作的转移，用来训练解码器 $d$，部署时把它接在冻结的策略后面。"
    >
      {defs}
      {/* 阶段标签 */}
      {[
        ['阶段 1', '纯视频'],
        ['阶段 2', '同一批视频'],
        ['阶段 3', '离线解码'],
      ].map(([a, b], i) => (
        <g key={a}>
          <T x={0} y={rowY[i] + 14} align="start" size={12.5} weight={600} w={LABEL_W}>{a}</T>
          <T x={0} y={rowY[i] + 32} align="start" size={10.5} color={C.ink3} w={LABEL_W}>{b}</T>
        </g>
      ))}
      <line x1={0} x2={680} y1={112} y2={112} stroke="var(--rule)" />
      <line x1={0} x2={680} y1={236} y2={236} stroke="var(--rule)" />

      {/* 阶段 1 */}
      <Frame x={LABEL_W - 18} y={rowY[0] + 4} s={fs} w={74} size={12} label="$o_{t-1:t+1}$" />
      <Arrow d={`M${LABEL_W + 59},${rowY[0] + 23} H${178}`} color={C.ink3} marker={end('g')} />
      <Box x={181} y={rowY[0]} w={84} h={BH} color={C.idm} title="IDM" />
      <Arrow d={`M${268},${rowY[0] + 23} H${318}`} color={C.z} marker={end('z')} width={2} />
      <T x={293} y={rowY[0] + 12} w={40} size={11.5} color={C.z}>{'$z_t$'}</T>
      <Box x={321} y={rowY[0] + 5} w={56} h={BH - 10} color={C.z} title="VQ" tint={20} />
      <Arrow d={`M${380},${rowY[0] + 23} H${418}`} color={C.z} marker={end('z')} width={2} />
      <Box x={421} y={rowY[0]} w={84} h={BH} color={C.fdm} title="FDM" />
      <T x={463} y={rowY[0] + BH + 14} w={120} size={10.5} color={C.ink3}>{'另输入 $o_{t-1},\\ o_t$'}</T>
      <Arrow d={`M${508},${rowY[0] + 23} H${540}`} color={C.ink3} marker={end('g')} />
      <T x={545} y={rowY[0] + 23} align="start" size={11.5} w={140}>{'$\\|\\hat o_{t+1} - o_{t+1}\\|^2$'}</T>
      <T x={223} y={rowY[0] + BH + 14} w={150} size={10.5} color={C.idm} weight={600}>训练完保留 IDM</T>

      {/* 阶段 2 */}
      <Frame x={LABEL_W - 18} y={rowY[1] + 4} s={fs} w={74} size={12} label="$o_{t-1:t+1}$" />
      <Arrow d={`M${LABEL_W + 59},${rowY[1] + 23} H${178}`} color={C.ink3} marker={end('g')} />
      <Box x={181} y={rowY[1]} w={84} h={BH} color={C.idm} title="IDM" sub="冻结" frozen />
      <Arrow d={`M${268},${rowY[1] + 23} H${400} V${rowY[1] + 40} H${420}`} color={C.z} marker={end('z')} width={2} dashed />
      <T x={334} y={rowY[1] + 12} w={150} size={11} color={C.z}>{'目标 $z_t$（量化前）'}</T>
      <Frame x={LABEL_W + 18} y={rowY[1] + 56} s={fs} label="$o_t$" />
      <Arrow d={`M${LABEL_W + 18 + fs + 3},${rowY[1] + 75} H${178}`} color={C.ink3} marker={end('g')} />
      <Box x={181} y={rowY[1] + 54} w={84} h={42} color={C.pi} title="策略 $\pi$" sub="IMPALA-CNN" />
      <Arrow d={`M${268},${rowY[1] + 75} H${400} V${rowY[1] + 58} H${420}`} color={C.pi} marker={end('g')} />
      <T x={334} y={rowY[1] + 86} w={120} size={11} color={C.pi}>{'$\\pi(o_t) \\in \\mathbb{R}^{128}$'}</T>
      <Box x={423} y={rowY[1] + 26} w={150} h={BH} color={C.ink2} title="$\|\pi(o_t) - z_t\|^2$" titleSize={12} tint={6} />
      <T x={498} y={rowY[1] + 26 + BH + 14} w={180} size={10.5} color={C.ink3}>策略只看当前一帧</T>

      {/* 阶段 3：训练解码器 + 部署 */}
      <T x={LABEL_W} y={rowY[2] - 2} align="start" size={10.5} color={C.ink3} w={240}>{'训练 $d$：少量带标签转移 $(o_{t-1:t+1},\\ a_t)$'}</T>
      <Box x={LABEL_W} y={rowY[2] + 10} w={84} h={36} color={C.idm} title="IDM" frozen titleSize={12} />
      <Arrow d={`M${LABEL_W + 87},${rowY[2] + 28} H${300}`} color={C.z} dashed />
      <T x={240} y={rowY[2] + 18} w={60} size={11} color={C.z}>{'$z_t$'}</T>
      <Arrow d={`M${300},${rowY[2] + 28} H${385} V${rowY[2] + 41}`} color={C.z} marker={end('z')} dashed />
      <T x={LABEL_W} y={rowY[2] + 64} align="start" size={10.5} color={C.ink3} w={120}>部署：</T>
      <Frame x={LABEL_W + 36} y={rowY[2] + 50} s={fs} label="$o_t$" />
      <Arrow d={`M${LABEL_W + 36 + fs + 3},${rowY[2] + 69} H${208}`} color={C.ink3} marker={end('g')} />
      <Box x={211} y={rowY[2] + 48} w={84} h={42} color={C.pi} title="策略 $\pi$" sub="冻结" frozen />
      <Arrow d={`M${298},${rowY[2] + 69} H${352}`} color={C.z} marker={end('z')} width={2} />
      <T x={325} y={rowY[2] + 58} w={50} size={11} color={C.z}>{'$z$'}</T>
      <Box x={355} y={rowY[2] + 44} w={120} h={50} color={C.act} title="解码器 $d$" sub="MLP，隐层 128-128" />
      <Arrow d={`M${478},${rowY[2] + 69} H${520}`} color={C.act} marker={end('a')} width={2} />
      <T x={526} y={rowY[2] + 69} align="start" size={12} color={C.act} w={160}>{'$a_t = d(\\pi(o_t))$'}</T>
      <Arrow d={`M${600},${rowY[2] + 28} H${445} V${rowY[2] + 41}`} color={C.act} marker={end('a')} dashed />
      <T x={604} y={rowY[2] + 28} align="start" size={11} color={C.act} w={80}>{'标签 $a_t$'}</T>
    </DiagramFigure>
  )
}
