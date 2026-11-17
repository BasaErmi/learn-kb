import { Arrow, Box, C, DiagramFigure, T, useArrows } from './diagram'

const CELL = 15, COLS = 5, ROWS = 3

/** 迷你画面：5×3 格，agent 是深色方块，金币是圆点 */
function Mini({ x, y, agent, coin, label }: { x: number; y: number; agent: number; coin: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={COLS * CELL} height={ROWS * CELL} rx={3} fill="color-mix(in srgb, var(--c-obs) 14%, var(--card))" stroke={C.obs} />
      {Array.from({ length: COLS - 1 }, (_, i) => <line key={`v${i}`} x1={x + (i + 1) * CELL} x2={x + (i + 1) * CELL} y1={y} y2={y + ROWS * CELL} stroke="var(--rule)" />)}
      {Array.from({ length: ROWS - 1 }, (_, i) => <line key={`h${i}`} x1={x} x2={x + COLS * CELL} y1={y + (i + 1) * CELL} y2={y + (i + 1) * CELL} stroke="var(--rule)" />)}
      <circle cx={x + coin * CELL + CELL / 2} cy={y + CELL * 1.5} r={4.5} fill="var(--c-rand)" />
      <rect x={x + agent * CELL + 2.5} y={y + CELL + 2.5} width={CELL - 5} height={CELL - 5} rx={2} fill={C.ink} />
      <T x={x + (COLS * CELL) / 2} y={y + ROWS * CELL + 12} w={90} size={11}>{label}</T>
    </g>
  )
}

const ROWS_DEF = [
  { name: '状态 A', coin: 0, after: 1, move: '向左一格' },
  { name: '状态 B', coin: 4, after: 3, move: '向右一格' },
]

/** 同一个码字在两个状态下对应相反的真实动作：FDM 能解读，只看 z 的解码器不能 */
export function StateDepFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--c-act)' })
  const dec = { x: 540, y: 52, w: 132, h: 62 }
  return (
    <DiagramFigure
      w={680}
      h={214}
      schematic
      label="潜在动作依赖状态：同一个码字在两个状态下表示相反的动作"
      caption="假设 IDM 学到的码字 $c_7$ 表示“朝金币走一格”。FDM 看得到当前画面，知道金币在哪边，两个状态下都能把下一帧预测准，所以重建损失不会惩罚这种编码。离线解码器只看码字，同一个 $c_7$ 却要对应两个相反的按键。"
    >
      {defs}
      {ROWS_DEF.map((r, i) => {
        const y = 22 + i * 96
        return (
          <g key={r.name}>
            <T x={0} y={y + 22} align="start" size={12} weight={600} color={C.ink2} w={60}>{r.name}</T>
            <Mini x={58} y={y} agent={2} coin={r.coin} label="$o_t$" />
            <Arrow d={`M${58 + COLS * CELL + 3},${y + 22} H${246}`} color={C.ink3} marker={end('g')} />
            <rect x={160} y={y + 44} width={64} height={22} rx={11} fill="color-mix(in srgb, var(--c-latent) 18%, var(--card))" stroke={C.z} />
            <T x={192} y={y + 55} w={70} size={11.5} color={C.z} weight={600}>{'$z = c_7$'}</T>
            <Arrow d={`M${224 + 2},${y + 55} H${232} V${y + 34} H${246}`} color={C.z} marker={end('z')} />
            <Box x={249} y={y + 6} w={70} h={36} color={C.fdm} title="FDM" />
            <Arrow d={`M${319 + 3},${y + 22} H${350}`} color={C.ink3} marker={end('g')} />
            <Mini x={353} y={y} agent={r.after} coin={r.coin} label="$\hat o_{t+1}$" />
            <T x={440} y={y + 22} align="start" size={11} color={C.act} w={80}>{r.move}</T>
            <Arrow d={`M${192},${y + 66} V${y + (i === 0 ? 80 : 74)} H${i === 0 ? 500 : 516} V${dec.y + dec.h / 2 + (i === 0 ? -10 : 10)} H${dec.x - 3}`} color={C.z} marker={end('z')} dashed />
          </g>
        )
      })}
      <Box x={dec.x} y={dec.y} w={dec.w} h={dec.h} color={C.act} title="离线解码器 $d$" sub="只看到 $c_7$" />
      <T x={dec.x + dec.w / 2} y={dec.y + dec.h + 20} w={170} size={12} color={C.accent} weight={600}>{'$d(c_7)$ 该输出 $\\leftarrow$ 还是 $\\rightarrow$？'}</T>
    </DiagramFigure>
  )
}
