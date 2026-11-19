import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'

const LW = 96, BH = 46

/** 三个阶段：LAQ → 潜在预训练 → 动作微调，标出每一步用什么数据、哪里冻结 */
export function PipelineFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--c-act)' })
  const y = [14, 132, 250]
  return (
    <DiagramFigure
      w={680}
      h={340}
      label="LAPA 的三个阶段"
      caption="虚线框表示冻结。阶段 1 和阶段 2 用的是同一份无标签视频：阶段 1 学出编码器（相当于逆动力学模型），阶段 2 用它给每一帧打上潜在动作 $z_t$，让 VLM 去预测。阶段 3 才用到真实动作：丢掉只有一层的潜在动作头，换一个新的动作头，在少量带标签轨迹上微调（真实机器人上是 3 个任务共 450 条）。"
    >
      {defs}
      {[
        ['阶段 1 · LAQ', '无标签视频'],
        ['阶段 2 · 潜在预训练', '同一份视频'],
        ['阶段 3 · 动作微调', '少量带标签轨迹'],
      ].map(([a, b], i) => (
        <g key={a}>
          <T x={0} y={y[i] + 14} align="start" size={12} weight={600} w={LW + 30}>{a}</T>
          <T x={0} y={y[i] + 32} align="start" size={10.5} color={C.ink3} w={LW}>{b}</T>
        </g>
      ))}
      <line x1={0} x2={680} y1={118} y2={118} stroke="var(--rule)" />
      <line x1={0} x2={680} y1={236} y2={236} stroke="var(--rule)" />

      {/* 阶段 1 */}
      <Frame x={LW + 30} y={y[0] + 4} s={38} w={70} size={11.5} label="$x_t,\ x_{t+H}$" />
      <Arrow d={`M${LW + 103},${y[0] + 23} H${222}`} color={C.ink3} marker={end('g')} />
      <Box x={225} y={y[0]} w={92} h={BH} color={C.idm} title="编码器" sub="$\approx$ 逆动力学模型" />
      <Arrow d={`M${320},${y[0] + 23} H${420}`} color={C.z} marker={end('z')} width={2} />
      <T x={370} y={y[0] + 10} w={120} size={11} color={C.z}>{'$z_t \\in \\{0,\\dots,7\\}^4$'}</T>
      <Box x={423} y={y[0]} w={92} h={BH} color={C.fdm} title="解码器" sub="$\approx$ 世界模型" />
      <T x={469} y={y[0] + BH + 13} w={120} size={10.5} color={C.ink3}>{'另输入 $x_t$'}</T>
      <Arrow d={`M${518},${y[0] + 23} H${548}`} color={C.ink3} marker={end('g')} />
      <T x={552} y={y[0] + 23} align="start" size={11.5} w={140}>{'$\\|x_{t+H} - \\hat x_{t+H}\\|^2$'}</T>

      {/* 阶段 2 */}
      <Frame x={LW + 30} y={y[1] + 4} s={38} w={70} size={11.5} label="$x_t,\ \ell$" />
      <Arrow d={`M${LW + 103},${y[1] + 23} H${222}`} color={C.ink3} marker={end('g')} />
      <Box x={225} y={y[1]} w={150} h={BH} color={C.pi} title="VLM（LWM 7B）" sub="视觉编码器冻结，LLM 训练" />
      <Arrow d={`M${378},${y[1] + 23} H${405}`} color={C.ink3} marker={end('g')} />
      <Box x={408} y={y[1] + 4} w={98} h={BH - 8} color={C.z} title="潜在动作头" sub="单层 MLP，词表 8" titleSize={11.5} subSize={9.5} tint={18} />
      <Arrow d={`M${509},${y[1] + 23} H${545}`} color={C.z} marker={end('z')} width={2} />
      <T x={550} y={y[1] + 23} align="start" size={11.5} w={140} color={C.z}>{'4 个 token $\\hat z_t$'}</T>
      <Arrow d={`M${370},${y[0] + 27} V${y[1] - 12} H${592} V${y[1] + 9}`} color={C.z} marker={end('z')} dashed />
      <T x={480} y={y[1] - 22} w={200} size={10.5} color={C.z}>{'冻结的编码器给出目标 $z_t$'}</T>
      <T x={300} y={y[1] + BH + 14} w={300} size={10.5} color={C.ink3}>{'编码器冻结，给每一帧打上 $z_t$；只看单帧 $x_t$ 和指令 $\\ell$'}</T>

      {/* 阶段 3 */}
      <Frame x={LW + 30} y={y[2] + 4} s={38} w={70} size={11.5} label="$x_t,\ \ell$" />
      <Arrow d={`M${LW + 103},${y[2] + 23} H${222}`} color={C.ink3} marker={end('g')} />
      <Box x={225} y={y[2]} w={150} h={BH} color={C.pi} title="同一个 VLM" sub="接着阶段 2 的参数训练" />
      <Arrow d={`M${378},${y[2] + 23} H${405}`} color={C.ink3} marker={end('g')} />
      <Box x={408} y={y[2] + 4} w={98} h={BH - 8} color={C.act} title="新动作头" sub="随机初始化" titleSize={11.5} subSize={9.5} tint={18} />
      <Arrow d={`M${509},${y[2] + 23} H${545}`} color={C.act} marker={end('a')} width={2} />
      <T x={550} y={y[2] + 23} align="start" size={11.5} w={140} color={C.act}>{'$a_t$：7 维，每维 256 档'}</T>
      <T x={300} y={y[2] + BH + 14} w={320} size={10.5} color={C.ink3}>潜在动作头整个丢掉，只有这一层是新的</T>
    </DiagramFigure>
  )
}
