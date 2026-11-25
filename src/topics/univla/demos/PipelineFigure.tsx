import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'
import { Chip, U } from './parts'

const LW = 110, BH = 46

/** 三个阶段：LAM 打标签 → 策略预训练 → 下游适配，标出每一步用什么数据、哪里冻结 */
export function PipelineFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', tc: U.tc, a: C.act })
  const y = [14, 128, 242]
  const x0 = LW + 24
  return (
    <DiagramFigure
      w={680}
      h={318}
      label="UniVLA 的三个阶段"
      caption="阶段 1 和阶段 2 用的是同一批异构视频（机器人、导航、人类视频），真实动作和本体状态全部不用。阶段 1 训练 LAM，阶段 2 用冻结的 LAM 离线给每一对帧打上 task-centric 潜动作的 4 个码本索引，VLM 只看当前帧和指令去预测它们。阶段 3 才用到目标机器人的少量真实动作：VLM 用 LoRA 微调，新加一个轻量的动作解码头，把潜动作位置的隐状态翻译成 action chunk。"
    >
      {defs}
      {[
        ['阶段 1 · LAM', '无标签异构视频'],
        ['阶段 2 · 策略预训练', '同一批视频 + 指令'],
        ['阶段 3 · 下游适配', '少量目标机器人轨迹'],
      ].map(([a, b], i) => (
        <g key={a}>
          <T x={0} y={y[i] + 14} align="start" size={12} weight={600} w={LW + 20}>{a}</T>
          <T x={0} y={y[i] + 32} align="start" size={10.5} color={C.ink3} w={LW + 10}>{b}</T>
        </g>
      ))}
      <line x1={0} x2={680} y1={114} y2={114} stroke="var(--rule)" />
      <line x1={0} x2={680} y1={228} y2={228} stroke="var(--rule)" />

      {/* 阶段 1 */}
      <Frame x={x0} y={y[0] + 4} s={38} w={74} size={11.5} label="$o_t,\ o_{t+k}$" />
      <Arrow d={`M${x0 + 77},${y[0] + 23} H${246}`} color={C.ink3} marker={end('g')} />
      <Box x={249} y={y[0]} w={150} h={BH} color={C.idm} title="LAM" sub="两阶段训练，DINOv2 特征空间" subSize={10} />
      <Arrow d={`M${402},${y[0] + 23} H${446}`} color={U.tc} marker={end('tc')} width={2} />
      <T x={452} y={y[0] + 14} align="start" size={11.5} w={230} color={U.tc}>{'$\\tilde a_{TC}$：4 个码本索引'}</T>
      <T x={452} y={y[0] + 33} align="start" size={10.5} w={230} color={C.ink3}>{'每个取自 16 个码字，$16^4$ 种'}</T>

      {/* 阶段 2 */}
      <Frame x={x0} y={y[1] + 4} s={38} w={74} size={11.5} label="$o_t,\ \ell$" />
      <Arrow d={`M${x0 + 77},${y[1] + 23} H${246}`} color={C.ink3} marker={end('g')} />
      <Box x={249} y={y[1]} w={150} h={BH} color={C.pi} title="Prismatic-7B" sub="全参数训练，约 960 A100 小时" subSize={10} />
      <Arrow d={`M${402},${y[1] + 23} H${446}`} color={C.ink3} marker={end('g')} />
      {[1, 2, 3, 4].map((i) => (
        <Chip key={i} x={449 + (i - 1) * 54} y={y[1] + 11} w={50} color={U.tc} label={`$\\mathrm{ACT}_{z_${i}}$`} size={10} />
      ))}
      <Arrow d={`M${560},${y[0] + 44} V${y[1] + 8}`} color={U.tc} marker={end('tc')} dashed />
      <T x={566} y={y[0] + 68} align="start" size={10.5} w={120} color={U.tc}>冻结的 LAM 离线打标签</T>
      <T x={324} y={y[1] + BH + 14} w={300} size={10.5} color={C.ink3}>{'只看当前帧 $o_t$ 和指令 $\\ell$，看不到 $o_{t+k}$'}</T>

      {/* 阶段 3 */}
      <Frame x={x0} y={y[2] + 4} s={38} w={74} size={11.5} label="$o_t,\ \ell$" />
      <Arrow d={`M${x0 + 77},${y[2] + 23} H${246}`} color={C.ink3} marker={end('g')} />
      <Box x={249} y={y[2]} w={150} h={BH} color={C.pi} title="同一个 VLM" sub="LoRA 微调" subSize={10} />
      <Arrow d={`M${402},${y[2] + 23} H${436}`} color={C.ink3} marker={end('g')} />
      <T x={419} y={y[2] + 12} w={60} size={9.5} color={C.ink3}>隐状态</T>
      <Box x={439} y={y[2]} w={110} h={BH} color={C.act} title="动作解码头" sub="约 12.6M 参数" subSize={10} tint={18} />
      <Arrow d={`M${552},${y[2] + 23} H${582}`} color={C.act} marker={end('a')} width={2} />
      <T x={586} y={y[2] + 14} align="start" size={11.5} w={100} color={C.act}>action chunk</T>
      <T x={586} y={y[2] + 33} align="start" size={10.5} w={100} color={C.ink3}>真机 12 步</T>
    </DiagramFigure>
  )
}
