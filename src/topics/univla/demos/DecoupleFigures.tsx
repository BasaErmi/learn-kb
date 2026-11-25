import { Arrow, Box, C, DiagramFigure, T, useArrows } from '@/kb/components/Diagram'
import { Chip, U } from './parts'

const PW = 310 // 每个面板的宽度
const cx = (ox: number, i: number) => ox + i * 80 + 35

/** 一个阶段的面板：编码器输入 → 编码器 → 量化 → 解码器输入 → 解码器 */
function Stage({ ox, stage, end }: { ox: number; stage: 1 | 2; end: (k: string) => string }) {
  const enc = stage === 1
    ? [['$O_t$', U.obs], ['$O_{t+k}$', U.obs], ['$a_{TI}$', U.ti], ['$\\ell$', U.lang]]
    : [['$O_t$', U.obs], ['$O_{t+k}$', U.obs], ['$a_{TI}$', U.ti], ['$a_{TC}$', U.tc]]
  const dec = stage === 1
    ? [[0, '$O_t$', U.obs], [2, '$\\tilde a_{TI}$', U.ti], [3, '$\\ell$', U.lang]]
    : [[0, '$O_t$', U.obs], [2, '$\\tilde a_{TI}$', U.ti], [3, '$\\tilde a_{TC}$', U.tc]]
  return (
    <g>
      <T x={ox} y={10} align="start" size={12} weight={600} w={PW}>{stage === 1 ? 'Stage 1：语言做条件' : 'Stage 2：去掉语言，新加一组 query'}</T>
      <T x={ox} y={36} align="start" size={10} color={C.ink3} w={PW}>编码器输入</T>
      {enc.map(([l, c], i) => <Chip key={i} x={ox + i * 80} y={48} w={70} color={c} label={l} />)}
      <Arrow d={`M${ox + PW / 2},${75} V${85}`} color={C.ink3} marker={end('g')} />
      <Box x={ox} y={88} w={PW} h={32} color={C.idm} title="编码器 $\mathcal{I}$" titleSize={11.5} />
      {/* 量化 */}
      <Arrow d={`M${cx(ox, 2)},${122} V${135}`} color={U.ti} marker={end('ti')} />
      <Box x={cx(ox, 2) - 36} y={138} w={72} h={28} color={U.ti} title="$\mathrm{VQ}_{TI}$" titleSize={11} frozen={stage === 2} />
      {stage === 2 && (
        <>
          <Arrow d={`M${cx(ox, 3)},${122} V${135}`} color={U.tc} marker={end('tc')} />
          <Box x={cx(ox, 3) - 36} y={138} w={72} h={28} color={U.tc} title="$\mathrm{VQ}_{TC}$" titleSize={11} tint={20} />
          <T x={cx(ox, 2) - 40} y={152} align="end" size={9.5} w={70} color={C.ink3}>码本冻结</T>
        </>
      )}
      <T x={ox} y={190} align="start" size={10} color={C.ink3} w={PW}>解码器输入</T>
      <Arrow d={`M${cx(ox, 2)},${168} V${197}`} color={U.ti} marker={end('ti')} />
      {stage === 2 && <Arrow d={`M${cx(ox, 3)},${168} V${197}`} color={U.tc} marker={end('tc')} />}
      {dec.map(([i, l, c]) => <Chip key={i as number} x={ox + (i as number) * 80} y={200} w={70} color={c as string} label={l as string} />)}
      <T x={cx(ox, 1)} y={212} w={70} size={9.5} color={C.ink3}>{'无 $O_{t+k}$'}</T>
      <Arrow d={`M${ox + PW / 2},${227} V${237}`} color={C.ink3} marker={end('g')} />
      <Box x={ox} y={240} w={PW} h={32} color={C.fdm} title="解码器 $\mathcal{F}$" sub="" titleSize={11.5} />
      <Arrow d={`M${ox + PW / 2},${274} V${286}`} color={C.fdm} marker={end('f')} />
      <T x={ox + PW / 2} y={298} w={60} size={11.5} color={C.fdm}>{'$\\hat O_{t+k}$'}</T>
      {stage === 2 && <T x={ox + PW} y={298} align="end" size={10.5} w={150} color={U.tc}>{'只把 $\\tilde a_{TC}$ 当伪标签'}</T>}
      {stage === 1 && <T x={ox} y={298} align="start" size={10.5} w={150} color={U.lang}>{'$\\ell$ 由 T5 编码'}</T>}
    </g>
  )
}

/** 两阶段训练：Stage 1 让 TI 吸收语言解释不了的变化，Stage 2 冻结 TI 码本、拿掉语言，让新的 TC 接替语言 */
export function DecoupleFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', ti: U.ti, tc: U.tc, f: 'var(--c-fdm)' })
  const ox2 = 370
  return (
    <DiagramFigure
      w={680}
      h={308}
      label="两阶段语言解耦：Stage 1 和 Stage 2 的输入输出对比"
      caption="Stage 1 把 T5 编码的指令 $\ell$ 同时送进编码器和解码器，量化得到 task-irrelevant 潜动作 $\tilde a_{TI}$。Stage 2 复制 Stage 1 的全部权重，冻结 $\mathrm{VQ}_{TI}$ 的码本，去掉语言，新加一组 query $a_{TC}$ 和新码本 $\mathrm{VQ}_{TC}$；编码器、query 和解码器照常更新。两个阶段的解码器都看不到 $O_{t+k}$。最后只用 $\tilde a_{TC}$ 给策略当伪标签。"
    >
      {defs}
      <Stage ox={0} stage={1} end={end} />
      <Stage ox={ox2} stage={2} end={end} />
      <Arrow d={`M${PW + 6},${104} H${ox2 - 6}`} color={C.ink3} marker={end('g')} dashed />
      <Arrow d={`M${PW + 6},${256} H${ox2 - 6}`} color={C.ink3} marker={end('g')} dashed />
      <T x={(PW + ox2) / 2} y={180} w={56} size={10} color={C.ink3}>复制</T>
      <T x={(PW + ox2) / 2} y={196} w={56} size={10} color={C.ink3}>权重</T>
    </DiagramFigure>
  )
}

/** 一段条形：title 一行、sub 一行 */
function Seg({ x, y, w, h, color, title, sub, dashed }: { x: number; y: number; w: number; h: number; color: string; title: string; sub: string; dashed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={`color-mix(in srgb, ${color} 20%, var(--card))`} stroke={color} strokeWidth={1.3} strokeDasharray={dashed ? '5 3' : undefined} />
      <T x={x + w / 2} y={y + h / 2 - 9} w={w} size={11} weight={600}>{title}</T>
      <T x={x + w / 2} y={y + h / 2 + 10} w={w} size={10} color={C.ink2}>{sub}</T>
    </g>
  )
}

/** O_{t+k} 里的信息分别经哪条通道到达解码器：Stage 1 和 Stage 2 对比（示意） */
export function InfoSplitFigure() {
  const x0 = 96, h = 44
  const ws = [170, 220, 194]
  const xs = [x0, x0 + ws[0], x0 + ws[0] + ws[1]]
  const r = [30, 128]
  return (
    <DiagramFigure
      w={680}
      h={214}
      schematic
      label="目标帧里的信息在两个阶段分别经哪条通道到达解码器"
      caption="横条表示解码器要预测的 $O_{t+k}$ 里的信息，宽度只是示意。Stage 1 的解码器已经有 $O_t$ 和 $\ell$，凡是从它们能预测出来的部分都不必占瓶颈，$\tilde a_{TI}$ 只装剩下的“残差”。Stage 2 拿掉 $\ell$ 后，原来由语言提供的那部分没人送了，重建误差上升，新的 $\tilde a_{TC}$ 被迫接替语言的角色。"
    >
      <T x={0} y={8} align="start" size={11} color={C.ink3} w={500}>{'$O_{t+k}$ 里的信息，经哪条通道到达解码器'}</T>
      {['Stage 1', 'Stage 2'].map((s, i) => (
        <T key={s} x={0} y={r[i] + h / 2} align="start" size={12} weight={600} w={90}>{s}</T>
      ))}
      <Seg x={xs[0]} y={r[0]} w={ws[0]} h={h} color={U.obs} title="$O_t$ 里已有" sub="静态内容" />
      <Seg x={xs[1]} y={r[0]} w={ws[1]} h={h} color={U.lang} title="$O_t + \ell$ 能预测的变化" sub="解码器免费拿到 $\ell$" />
      <Seg x={xs[2]} y={r[0]} w={ws[2]} h={h} color={U.ti} title="$\ell$ 解释不了的变化" sub="$\to \tilde a_{TI}$" />
      <T x={xs[2] + ws[2] / 2} y={r[0] + h + 14} w={ws[2] + 20} size={10} color={C.ink3}>干扰，也有轨迹、速度、时机等细节</T>

      <Seg x={xs[0]} y={r[1]} w={ws[0]} h={h} color={U.obs} title="$O_t$ 里已有" sub="静态内容" />
      <Seg x={xs[1]} y={r[1]} w={ws[1]} h={h} color={U.tc} title="原来由 $\ell$ 提供的部分" sub="$\to \tilde a_{TC}$（新码本）" />
      <Seg x={xs[2]} y={r[1]} w={ws[2]} h={h} color={U.ti} title="$\ell$ 解释不了的变化" sub="$\to \tilde a_{TI}$（码本冻结）" dashed />
      <T x={xs[1] + ws[1] / 2} y={r[1] + h + 14} w={ws[1] + 40} size={10} color={C.ink3}>逐窗口从两帧推断，比 episode 级指令更细</T>
    </DiagramFigure>
  )
}
