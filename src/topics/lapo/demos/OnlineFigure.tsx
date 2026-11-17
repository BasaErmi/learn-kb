import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from './diagram'

/** 在线解码：共享冻结的卷积层，SL 头和 RL 头的 logits 取平均 */
export function OnlineFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--c-act)', p: 'var(--c-pi)' })
  const ySL = 44, yRL = 236, bh = 50, cy = 158
  const conv = { x: 64, y: cy - 40, w: 90, h: 80 }
  const b1 = { x: 196, w: 130 }, b2 = { x: 360, w: 112 }
  const mg = { x: 504, y: cy - 32, w: 104, h: 64 }
  const ax = 646
  return (
    <DiagramFigure
      w={680}
      h={330}
      label="在线解码的两个头：监督头与 RL 头"
      caption="卷积层冻结，上下两支共用它提取的特征。上面一支是 SL 头：原潜在策略的后几层原样冻结，输出 $z$，再由解码器 $d$ 翻译成 15 个动作的 logits。下面一支是 RL 头：全连接层从潜在策略复制过来，输出层是新加的，初始权重为 0，所以开始时动作完全由 SL 头决定。两支的 logits 取平均后过 softmax 采样动作。"
    >
      {defs}
      <Frame x={0} y={cy - 22} s={44} label="$o_t$" />
      <Arrow d={`M${47},${cy} H${conv.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={conv.x} y={conv.y} w={conv.w} h={conv.h} color={C.pi} title="卷积层" sub="冻结" frozen />
      {/* 分成两支 */}
      <Arrow d={`M${conv.x + conv.w + 2},${cy} H${174} V${ySL + bh / 2} H${b1.x - 3}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${174},${cy} V${yRL + bh / 2} H${b1.x - 3}`} color={C.ink3} marker={end('g')} />

      {/* SL 头 */}
      <Box x={b1.x} y={ySL} w={b1.w} h={bh} color={C.pi} title="潜在策略后几层" sub="冻结，输出 $z$" frozen />
      <Arrow d={`M${b1.x + b1.w + 3},${ySL + bh / 2} H${b2.x - 3}`} color={C.z} marker={end('z')} width={2} />
      <Box x={b2.x} y={ySL} w={b2.w} h={bh} color={C.act} title="解码器 $d$" sub="监督学习" tint={16} />
      <Arrow d={`M${b2.x + b2.w + 3},${ySL + bh / 2} H${mg.x + mg.w / 2} V${mg.y - 3}`} color={C.act} marker={end('a')} />
      <T x={b2.x + b2.w + 18} y={ySL + bh / 2 - 11} w={60} size={11.5} color={C.act} align="start">{'$\\ell_{\\text{SL}}$'}</T>

      {/* RL 头 */}
      <Box x={b1.x} y={yRL} w={b1.w} h={bh} color={C.pi} title="全连接层" sub="从潜在策略复制" tint={16} />
      <Arrow d={`M${b1.x + b1.w + 3},${yRL + bh / 2} H${b2.x - 3}`} color={C.pi} marker={end('p')} />
      <Box x={b2.x} y={yRL} w={b2.w} h={bh} color={C.pi} title="新输出层" sub="初始权重为 0" tint={16} />
      <Arrow d={`M${b2.x + b2.w + 3},${yRL + bh / 2} H${mg.x + mg.w / 2} V${mg.y + mg.h + 3}`} color={C.pi} marker={end('p')} />
      <T x={b2.x + b2.w + 18} y={yRL + bh / 2 + 12} w={60} size={11.5} color={C.pi} align="start">{'$\\ell_{\\text{RL}}$'}</T>

      {/* 合并 */}
      <Box x={mg.x} y={mg.y} w={mg.w} h={mg.h} color={C.ink2} title="$\tfrac{1}{2}(\ell_{\text{SL}} + \ell_{\text{RL}})$" sub="再过 softmax" titleSize={12} tint={6} />
      <Arrow d={`M${mg.x + mg.w + 3},${cy} H${ax - 6}`} color={C.ink} marker={end('g')} width={1.8} />
      <T x={ax + 8} y={cy} w={40} size={13} weight={600}>{'$a_t$'}</T>

      {/* SL 的标签来源 */}
      <Arrow d={`M${ax + 8},${cy - 12} V${16} H${b2.x + b2.w / 2} V${ySL - 3}`} color={C.act} marker={end('a')} dashed />
      <T x={(b2.x + ax) / 2 + 20} y={8} w={340} size={10.5} color={C.act}>{'执行 $a_t$、看到 $o_{t+1}$ 后，冻结的 IDM 算出 $z_t$，得到 $(z_t, a_t)$'}</T>
      {/* RL 的训练信号 */}
      <Arrow d={`M${ax + 8},${cy + 12} V${306} H${b1.x + b1.w / 2} V${yRL + bh + 3}`} color={C.pi} marker={end('p')} dashed />
      <Arrow d={`M${b2.x + b2.w / 2},${306} V${yRL + bh + 3}`} color={C.pi} marker={end('p')} dashed />
      <T x={(b1.x + ax) / 2} y={320} w={360} size={10.5} color={C.pi}>{'PPO 按环境奖励 $r_t$ 更新这两层，学习率可开到 0.01'}</T>
    </DiagramFigure>
  )
}
