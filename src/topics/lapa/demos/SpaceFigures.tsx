import { Arrow, C, DiagramFigure, T, useArrows } from '@/kb/components/Diagram'

/** 潜在动作空间 8^4 和 OpenVLA 动作空间 256^7 的对比 */
export function CapacityFigure() {
  const pick = [1, 1, 3, 2]
  const cw = 26, ch = 18
  const ox = 30, oy = 40
  const bits = [
    { v: 12, label: 'LAPA：$4 \\log_2 8 = 12$ bit', color: C.z },
    { v: 56, label: 'OpenVLA：$7 \\log_2 256 = 56$ bit', color: C.act },
  ]
  const bx0 = 360, bx1 = 660, by = 120
  const bxs = (b: number) => bx0 + (b / 60) * (bx1 - bx0)
  return (
    <DiagramFigure
      w={680}
      h={226}
      label="潜在动作空间与 OpenVLA 动作空间的大小"
      caption="左边是一个潜在动作：4 个位置，每个位置从 8 个码字里选一个（高亮的是示意），共 $8^4 = 4096$ 种组合，约 12 bit。右边是同样每步要预测的量：OpenVLA 的 7 维动作每维 256 档，约 56 bit。潜在空间小得多，VLM 学起来更容易；这 12 bit 同时也是信息瓶颈，装不下整张 $x_{t+H}$。"
    >
      <T x={ox} y={14} align="start" size={11.5} color={C.ink2} w={300}>{'潜在动作 $z_t$：4 个位置 $\\times$ 8 个码字'}</T>
      {pick.map((p, i) => (
        <g key={i}>
          {Array.from({ length: 8 }, (_, k) => (
            <g key={k}>
              <rect x={ox + i * (cw + 14)} y={oy + k * ch} width={cw} height={ch - 3} rx={3}
                fill={k === p ? 'color-mix(in srgb, var(--c-latent) 60%, var(--card))' : 'var(--paper-2)'} stroke={k === p ? C.z : 'var(--rule)'} />
              <T x={ox + i * (cw + 14) + cw / 2} y={oy + k * ch + (ch - 3) / 2} w={cw} size={10} color={k === p ? C.ink : C.ink3}>{String(k)}</T>
            </g>
          ))}
          <T x={ox + i * (cw + 14) + cw / 2} y={oy + 8 * ch + 10} w={40} size={10.5} color={C.ink2}>{`$z^{(${i + 1})}$`}</T>
        </g>
      ))}
      <T x={ox + 4 * (cw + 14) + 4} y={oy + 4 * ch} align="start" size={12} color={C.z} weight={600} w={130}>{'$= [1, 1, 3, 2]$'}</T>
      {/* 比特数条 */}
      <T x={bx0} y={by - 50} align="start" size={11.5} color={C.ink2} w={300}>每一步要预测的信息量</T>
      <line x1={bx0} x2={bx1} y1={by + 50} y2={by + 50} className="axis" />
      {[0, 20, 40, 60].map((v) => (
        <g key={v}>
          <line x1={bxs(v)} x2={bxs(v)} y1={by + 47} y2={by + 53} className="axis" />
          <T x={bxs(v)} y={by + 64} w={40} size={10} color={C.ink3}>{`${v}`}</T>
        </g>
      ))}
      <T x={bx1} y={by + 80} align="end" size={10} color={C.ink3} w={60}>bit</T>
      {bits.map((b, i) => (
        <g key={i}>
          <rect x={bx0} y={by - 24 + i * 34} width={bxs(b.v) - bx0} height={18} rx={3} fill={`color-mix(in srgb, ${b.color} 55%, var(--card))`} stroke={b.color} />
          <T x={b.v < 30 ? bxs(b.v) + 6 : bx0 + 4} y={by - 15 + i * 34} align="start" size={10.5} w={260} color={C.ink}>{b.label}</T>
        </g>
      ))}
    </DiagramFigure>
  )
}

/** 做差 d = e2 − e1 带来的偏置：平移不变时同一动作落到同一码字，不动时 d≈0，小面积变化容易被忽略 */
export function DiffFigure() {
  const { defs, end } = useArrows({ a: 'var(--accent)', g: 'var(--ink-3)' })
  const panels = [
    { title: '同一动作、不同场景', sub: '表征对动作近似平移时' },
    { title: '画面没变化', sub: '' },
    { title: '夹爪开合', sub: '局部、小面积的变化' },
  ]
  const PW = 226
  const dot = (x: number, y: number, label: string, color = C.idm) => (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} />
      <T x={x + 6} y={y + 11} align="start" size={10.5} w={60} color={C.ink2}>{label}</T>
    </g>
  )
  return (
    <DiagramFigure
      w={680}
      h={214}
      schematic
      label="d = e2 − e1 的几何直觉"
      caption="三栏都画在编码器的表征空间里，点是 $e_1$、$e_2$，箭头是差 $d_1 = e_2 - e_1$。左：如果同一个动作在不同场景里让表征平移同样的量，两次的 $d_1$ 相同，会落到同一个码字上，这是做差的好处。中：画面不变时 $d_1 \approx 0$，自然对应一个“不动”的码字（论文图 12 的 6 号）。右：做差隐含了“动作是加性位移”的假设，夹爪开合这种局部小变化，$d_1$ 很短，容易和“不动”挤在一起。"
    >
      {defs}
      {panels.map((p, i) => (
        <g key={i}>
          <rect x={i * (PW + 1)} y={0} width={PW - 8} height={190} rx={8} fill="var(--paper)" stroke="var(--rule)" />
          <T x={i * (PW + 1) + (PW - 8) / 2} y={16} w={PW} size={11.5} weight={600}>{p.title}</T>
          {p.sub && <T x={i * (PW + 1) + (PW - 8) / 2} y={33} w={PW} size={10} color={C.ink3}>{p.sub}</T>}
        </g>
      ))}
      {/* 左：两组平行箭头 */}
      {[[26, 140, 'A'], [110, 150, 'B']].map(([x, y, sc], i) => (
        <g key={i}>
          {dot(x as number, y as number, `$e_1^{${sc}}$`)}
          <Arrow d={`M${(x as number) + 3},${(y as number) - 3} L${(x as number) + 77},${(y as number) - 43}`} color={C.accent} marker={end('a')} width={2} />
          {dot((x as number) + 80, (y as number) - 46, `$e_2^{${sc}}$`)}
        </g>
      ))}
      <T x={110} y={180} w={200} size={10.5} color={C.accent}>{'场景 A、B 的 $d_1$ 相同 $\\to$ 同一码字'}</T>
      {/* 中：差为 0 */}
      <circle cx={PW + 109} cy={100} r={4} fill={C.idm} />
      <circle cx={PW + 109} cy={100} r={16} fill="none" stroke={C.accent} strokeDasharray="3 3" />
      <T x={PW + 109} y={130} w={120} size={10.5} color={C.ink2}>{'$e_1 \\approx e_2$'}</T>
      <T x={PW + 109} y={180} w={200} size={10.5} color={C.accent}>{'$d_1 \\approx 0$ $\\to$ “不动”码字'}</T>
      {/* 右：很短的箭头 */}
      {dot(2 * (PW + 1) + 90, 115, '$e_1$')}
      <Arrow d={`M${2 * (PW + 1) + 93},${112} L${2 * (PW + 1) + 106},${104}`} color={C.accent} marker={end('a')} width={2} />
      {dot(2 * (PW + 1) + 108, 102, '')}
      <T x={2 * (PW + 1) + 126} y={96} align="start" size={10.5} w={60} color={C.ink2}>{'$e_2$'}</T>
      <T x={2 * (PW + 1) + 109} y={180} w={210} size={10.5} color={C.accent}>{'$d_1$ 很短，容易被当成“不动”'}</T>
    </DiagramFigure>
  )
}

/** 预训练和微调只差最后一层头：潜在动作头被换成新的动作头 */
export function HeadSwapFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--c-act)' })
  return (
    <DiagramFigure
      w={680}
      h={236}
      label="从潜在预训练到动作微调：只换最后一层头"
      caption="两个阶段的 VLM 是同一份参数：视觉编码器始终冻结，LLM 全量训练。预训练时接潜在动作头，预测 4 个潜在 token；微调时把这一层丢掉，换成随机初始化的动作头，预测 7 维动作（每维按等频分箱成 256 档，沿用 RT-2 和 OpenVLA 的做法）。被丢掉的只有一层 MLP，预训练学到的东西留在 LLM 里。"
    >
      {defs}
      <rect x={0} y={84} width={60} height={30} rx={4} fill="color-mix(in srgb, var(--c-obs) 16%, var(--card))" stroke={C.obs} />
      <T x={30} y={99} w={60} size={12} weight={600}>{'$x_t$'}</T>
      <rect x={0} y={130} width={60} height={30} rx={4} fill="var(--paper-2)" stroke={C.obs} />
      <T x={30} y={145} w={60} size={12} weight={600}>{'$\\ell$'}</T>
      <T x={30} y={175} w={80} size={10} color={C.ink3}>单帧 + 指令</T>
      <Arrow d={`M${63},${99} H${92}`} color={C.ink3} marker={end('g')} />
      <rect x={95} y={78} width={110} height={42} rx={7} fill="color-mix(in srgb, var(--ink-3) 8%, var(--card))" stroke={C.pi} strokeDasharray="5 3" strokeWidth={1.4} />
      <T x={150} y={92} w={120} size={11.5} weight={600}>视觉编码器</T>
      <T x={150} y={109} w={120} size={10} color={C.ink2}>冻结</T>
      <Arrow d={`M${208},${99} H${236}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${63},${145} H${236}`} color={C.ink3} marker={end('g')} />
      <rect x={239} y={60} width={150} height={110} rx={8} fill="color-mix(in srgb, var(--c-pi) 14%, var(--card))" stroke={C.pi} strokeWidth={1.4} />
      <T x={314} y={88} w={150} size={13} weight={600}>LLM（7B）</T>
      <T x={314} y={108} w={150} size={10} color={C.ink2}>全量训练</T>
      <T x={314} y={132} w={150} size={9.5} color={C.ink3}>语言对齐、粗粒度规划、</T>
      <T x={314} y={148} w={150} size={9.5} color={C.ink3}>“画面接下来该怎么变”</T>
      {/* 两个头 */}
      <Arrow d={`M${392},${100} H${408} V${46} H${432}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${408},${100} V${186} H${432}`} color={C.ink3} marker={end('g')} />
      <rect x={435} y={24} width={110} height={44} rx={7} fill="color-mix(in srgb, var(--c-latent) 16%, var(--card))" stroke={C.z} strokeWidth={1.4} />
      <T x={490} y={39} w={120} size={11.5} weight={600}>潜在动作头</T>
      <T x={490} y={56} w={120} size={9.5} color={C.ink2}>单层 MLP，词表 8</T>
      <line x1={430} x2={550} y1={70} y2={22} stroke={C.accent} strokeWidth={2} />
      <Arrow d={`M${548},${46} H${572}`} color={C.z} marker={end('z')} />
      <T x={576} y={40} align="start" size={11} w={110} color={C.z}>{'$z_t^{(1)}, \\dots, z_t^{(4)}$'}</T>
      <T x={576} y={57} align="start" size={10} w={110} color={C.ink3}>预训练用，微调时丢掉</T>
      <rect x={435} y={164} width={110} height={44} rx={7} fill="color-mix(in srgb, var(--c-act) 16%, var(--card))" stroke={C.act} strokeWidth={1.4} />
      <T x={490} y={179} w={120} size={11.5} weight={600}>动作头</T>
      <T x={490} y={196} w={120} size={9.5} color={C.ink2}>随机初始化</T>
      <Arrow d={`M${548},${186} H${572}`} color={C.act} marker={end('a')} />
      <T x={576} y={180} align="start" size={11} w={110} color={C.act}>{'$a_t$：7 维'}</T>
      <T x={576} y={197} align="start" size={10} w={110} color={C.ink3}>每维 256 档</T>
    </DiagramFigure>
  )
}

/** 时间粒度：潜在动作描述约 0.6 s 的变化，微调预测的是单步动作 */
export function GranularityFigure() {
  const { defs, end } = useArrows({ z: 'var(--c-latent)', a: 'var(--c-act)' })
  const x0 = 70, dx = 130
  return (
    <DiagramFigure
      w={680}
      h={130}
      schematic
      label="潜在动作与真实动作的时间粒度"
      caption="以 Bridgev2（5 Hz，$H = 3$）为例：一个潜在动作 $z_t$ 描述的是 $x_t$ 到 $x_{t+3}$ 约 0.6 s 的变化，微调时动作头却要输出每 0.2 s 一步的 $a_t$。人类视频的窗口更长，约 2.4 s。"
    >
      {defs}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={x0 + i * dx - 22} y={52} width={44} height={34} rx={4} fill="color-mix(in srgb, var(--c-obs) 16%, var(--card))" stroke={C.obs} />
          <T x={x0 + i * dx} y={69} w={60} size={11.5} weight={600}>{i === 0 ? '$x_t$' : `$x_{t+${i}}$`}</T>
          {i < 4 && <Arrow d={`M${x0 + i * dx + 24},${100} H${x0 + (i + 1) * dx - 24}`} color={C.act} marker={end('a')} />}
          {i < 4 && <T x={x0 + i * dx + dx / 2} y={112} w={80} size={10.5} color={C.act}>{i === 0 ? '$a_t$：0.2 s' : `$a_{t+${i}}$`}</T>}
        </g>
      ))}
      <Arrow d={`M${x0},${44} V${30} H${x0 + 3 * dx} V${46}`} color={C.z} marker={end('z')} width={2} />
      <T x={x0 + 1.5 * dx} y={18} w={300} size={11} color={C.z} weight={600}>{'一个潜在动作 $z_t$：$x_t \\to x_{t+3}$，约 0.6 s'}</T>
    </DiagramFigure>
  )
}
