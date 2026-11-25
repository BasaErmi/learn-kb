import { useState } from 'react'
import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'
import { Seg } from '@/kb/components/Seg'
import { Squares, squaresWidth, U } from './parts'

type Stage = 1 | 2

/** LAM 的结构，可在 Stage 1 / Stage 2 间切换：冻结 DINOv2 → 编码器（拼 query，Stage 1 另拼 ℓ，Stage 2 另拼 a_TC）→ VQ → 解码器 → 预测 O_{t+k} 的特征 */
export function LAMFigure() {
  const [stage, setStage] = useState<Stage>(1)
  const s1 = stage === 1
  const { defs, end } = useArrows({ g: 'var(--ink-3)', ti: U.ti, tc: U.tc, f: 'var(--c-fdm)', o: 'var(--c-obs)' })
  const fs = 40
  const dn = { x: 58, y: 0, w: 74, h: 100 }
  const sx = 160 // 编码器输入 token 串的起点
  const ny = 40 // 编码器输入 token 串的 y
  const g = 12 // 组间距
  const w4 = squaresWidth(4)
  const xs = [0, 1, 2, 3].map((i) => sx + i * (w4 + g)) // 四组 token 的起点
  const enc = { x: sx - 6, y: 80, w: 4 * w4 + 3 * g + 12, h: 52 }
  const vx = 440, vw = 96 // VQ 框
  const qx = 560 // 量化输出的方块
  const top = 88, bot = 128 // Stage 2 两个 VQ 的中心 y
  const mid = enc.y + enc.h / 2
  const dy = 216 // 解码器输入 token 串的 y
  const dec = { x: sx - 6, y: 254, w: 3 * w4 + 2 * g + 12, h: 44 }
  const oy = dec.y + dec.h / 2
  return (
    <DiagramFigure
      w={680}
      h={346}
      label={`UniVLA 的潜动作模型，Stage ${stage}：在 DINOv2 特征空间里做带瓶颈的逆动力学和前向动力学`}
      controls={<Seg label="LAM 的训练阶段" value={stage} onChange={setStage} options={[{ value: 1, label: 'Stage 1：加入语言' }, { value: 2, label: 'Stage 2：加入 TC query' }]} />}
      caption={s1
        ? 'Stage 1（论文图 2 左）。两帧先过冻结的 DINOv2，得到 patch 特征 $O_t$、$O_{t+k}$。编码器在特征后面拼 4 个可学习的 query token $a_{TI}$ 和 T5 编码的指令 $\\ell$，用带因果时间 mask 的时空 transformer 汇聚两帧之间的变化，只取 query 位置的输出去量化。解码器拿到 $O_t$、$\\tilde a_{TI}$ 和 $\\ell$，不给 $O_{t+k}$ 和更早的历史帧，去预测 $O_{t+k}$。方块的个数只是示意。'
        : 'Stage 2（论文图 2 右）。复制 Stage 1 的权重，去掉语言，新加一组 query $a_{TC}$ 和新码本 $\\mathrm{VQ}_{TC}$；$\\mathrm{VQ}_{TI}$ 的码本冻结，编码器、query 和解码器照常更新。解码器拿到 $O_t$、$\\tilde a_{TI}$ 和 $\\tilde a_{TC}$。训练完只用 $\\tilde a_{TC}$ 当策略的伪标签。方块的个数只是示意。'}
    >
      {defs}
      {/* 两帧 → DINOv2 */}
      <Frame x={0} y={6} s={fs} label="$o_t$" />
      <Frame x={0} y={56} s={fs} label="$o_{t+k}$" size={12} />
      <Arrow d={`M${fs + 2},26 H${dn.x - 3}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${fs + 2},76 H${dn.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={dn.x} y={dn.y} w={dn.w} h={dn.h} color={C.obs} title="DINOv2" sub="冻结" frozen titleSize={12} />
      <Arrow d={`M${dn.x + dn.w + 3},${ny + 5} H${sx - 4}`} color={C.ink3} marker={end('g')} />

      {/* 编码器输入 */}
      <T x={sx} y={12} align="start" size={10.5} color={C.ink3} w={300}>{s1 ? '编码器输入 $[O_t;\\ O_{t+k};\\ a_{TI};\\ \\ell]$' : '编码器输入 $[O_t;\\ O_{t+k};\\ a_{TI};\\ a_{TC}]$'}</T>
      <Squares x={xs[0]} y={ny} n={4} color={U.obs} />
      <Squares x={xs[1]} y={ny} n={4} color={U.obs} />
      <Squares x={xs[2]} y={ny} n={4} color={U.ti} />
      <Squares x={xs[3]} y={ny} n={4} color={s1 ? U.lang : U.tc} />
      <T x={xs[0] + w4 / 2} y={ny - 9} w={60} size={10}>{'$O_t$'}</T>
      <T x={xs[1] + w4 / 2} y={ny - 9} w={60} size={10}>{'$O_{t+k}$'}</T>
      <T x={xs[2] + w4 / 2} y={ny - 9} w={60} size={10} color={U.ti}>{'$a_{TI}$'}</T>
      <T x={xs[3] + w4 / 2} y={ny - 9} w={70} size={10} color={s1 ? U.lang : U.tc}>{s1 ? '$\\ell$（T5）' : '$a_{TC}$（新）'}</T>
      <Arrow d={`M${enc.x + enc.w / 2},${ny + 14} V${enc.y - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={enc.x} y={enc.y} w={enc.w} h={enc.h} color={C.idm} title="时空 Transformer" sub="因果时间 mask；编码器 $\approx$ IDM" titleSize={11.5} subSize={9.5} />

      {s1 ? (
        <>
          <Arrow d={`M${enc.x + enc.w + 3},${mid} H${vx - 3}`} color={U.ti} marker={end('ti')} width={2} />
          <T x={(enc.x + enc.w + vx) / 2} y={mid - 11} w={50} size={10.5} color={U.ti}>{'$\\hat a_{TI}$'}</T>
          <Box x={vx} y={84} w={vw} h={44} color={U.ti} title="$\mathrm{VQ}_{TI}$" sub="码本 $|C| = 16$" titleSize={11.5} subSize={10} tint={20} />
          <Arrow d={`M${vx + vw + 3},${mid} H${qx - 3}`} color={U.ti} marker={end('ti')} width={2} />
          <Squares x={qx} y={mid - 5.5} n={4} color={U.ti} />
          <T x={qx + w4 / 2} y={mid - 34} w={170} size={10.5} color={U.ti}>{'$\\tilde a_{TI}$：4 个码字，16 bit'}</T>
          {/* 量化后的潜动作送下来 */}
          <Arrow d={`M${qx + w4 / 2},${mid + 8} V${172} H${xs[1] + w4 / 2} V${dy - 3}`} color={U.ti} marker={end('ti')} />
        </>
      ) : (
        <>
          <Arrow d={`M${enc.x + enc.w + 3},${top} H${vx - 3}`} color={U.tc} marker={end('tc')} width={2} />
          <Arrow d={`M${enc.x + enc.w + 3},${bot} H${vx - 3}`} color={U.ti} marker={end('ti')} width={2} />
          <T x={(enc.x + enc.w + vx) / 2} y={top - 11} w={50} size={10.5} color={U.tc}>{'$\\hat a_{TC}$'}</T>
          <T x={(enc.x + enc.w + vx) / 2} y={bot - 11} w={50} size={10.5} color={U.ti}>{'$\\hat a_{TI}$'}</T>
          <Box x={vx} y={top - 16} w={vw} h={32} color={U.tc} title="$\mathrm{VQ}_{TC}$" sub="新码本" titleSize={11} subSize={9} tint={20} />
          <Box x={vx} y={bot - 16} w={vw} h={32} color={U.ti} title="$\mathrm{VQ}_{TI}$" sub="码本冻结" titleSize={11} subSize={9} frozen />
          <Arrow d={`M${vx + vw + 3},${top} H${qx - 3}`} color={U.tc} marker={end('tc')} width={2} />
          <Arrow d={`M${vx + vw + 3},${bot} H${qx - 3}`} color={U.ti} marker={end('ti')} width={2} />
          <Squares x={qx} y={top - 5.5} n={4} color={U.tc} />
          <Squares x={qx} y={bot - 5.5} n={4} color={U.ti} />
          <T x={qx + w4 / 2} y={top - 16} w={50} size={10.5} color={U.tc}>{'$\\tilde a_{TC}$'}</T>
          <T x={qx + w4 / 2} y={bot - 20} w={50} size={10.5} color={U.ti}>{'$\\tilde a_{TI}$'}</T>
          {/* 两组量化后的潜动作送下来，走线互不交叉 */}
          <Arrow d={`M${qx + w4 + 3},${top} H${652} V${180} H${xs[2] + w4 / 2} V${dy - 3}`} color={U.tc} marker={end('tc')} />
          <Arrow d={`M${qx + w4 / 2},${bot + 8} V${172} H${xs[1] + w4 / 2} V${dy - 3}`} color={U.ti} marker={end('ti')} />
        </>
      )}

      {/* 解码器 */}
      <line x1={0} x2={680} y1={162} y2={162} stroke="var(--rule)" />
      <T x={sx} y={196} align="start" size={10.5} color={C.ink3} w={330}>{s1 ? '解码器输入 $[O_t;\\ \\tilde a_{TI};\\ \\ell]$，不给 $O_{t+k}$ 和历史帧' : '解码器输入 $[O_t;\\ \\tilde a_{TI};\\ \\tilde a_{TC}]$，不给 $O_{t+k}$ 和历史帧'}</T>
      <Squares x={xs[0]} y={dy} n={4} color={U.obs} />
      <Squares x={xs[1]} y={dy} n={4} color={U.ti} />
      <Squares x={xs[2]} y={dy} n={4} color={s1 ? U.lang : U.tc} />
      {s1 && <T x={xs[2] + w4 / 2} y={dy + 24} w={60} size={10} color={U.lang}>{'$\\ell$'}</T>}
      {/* O_t 从 DINOv2 绕下来 */}
      <Arrow d={`M${dn.x + dn.w / 2},${dn.y + dn.h + 2} V${dy + 5} H${sx - 4}`} color={C.obs} marker={end('o')} />
      <T x={dn.x + dn.w / 2 + 6} y={dy - 14} align="start" size={10} w={40} color={C.ink3}>{'$O_t$'}</T>
      <Arrow d={`M${dec.x + dec.w / 2},${dy + 14} V${dec.y - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={dec.x} y={dec.y} w={dec.w} h={dec.h} color={C.fdm} title="空间 Transformer" sub="解码器 $\approx$ FDM" titleSize={11.5} subSize={9.5} />
      <Arrow d={`M${dec.x + dec.w + 3},${oy} H${dec.x + dec.w + 22}`} color={C.fdm} marker={end('f')} />
      <Squares x={dec.x + dec.w + 26} y={oy - 5.5} n={4} color={C.fdm} />
      <T x={dec.x + dec.w + 26 + w4 / 2} y={oy - 19} w={60} size={10.5} color={C.fdm}>{'$\\hat O_{t+k}$'}</T>
      <T x={dec.x + dec.w + 92} y={oy} align="start" size={11} w={240}>{'$\\mathcal{L}_{\\text{rec}} = \\|\\hat O_{t+k} - O_{t+k}\\|^2$'}</T>
      <T x={dec.x + dec.w + 92} y={oy + 22} align="start" size={10} w={240} color={C.ink3}>{'目标 $O_{t+k}$ 来自冻结的 DINOv2，不回传梯度'}</T>
    </DiagramFigure>
  )
}
