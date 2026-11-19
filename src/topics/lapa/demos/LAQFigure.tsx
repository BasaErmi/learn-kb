import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'

const CODE = [1, 1, 3, 2] // 示意用的码字编号

/** LAQ 的编码器与解码器：做差、CNN 定序列长度、量化、cross-attention 解码 */
export function LAQFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', z: 'var(--c-latent)', a: 'var(--accent)', f: 'var(--c-fdm)' })
  const fs = 44
  const r1 = 40, r2 = 122 // 两行的中心 y
  const bh = 40
  const pe = { x: 66, w: 74 }, st = { x: 156, w: 96 }
  const ct = { x: 262, y: r1 - 24, w: 92, h: r2 - r1 + 48 }
  const df = { x: 478, y: 58, w: 100, h: 46 }
  const cnn = { x: 478, y: 128, w: 100, h: 40 }
  const qz = { x: 478, y: 190, w: 100, h: 40 }
  const zy = 250
  const nv = { x: 478, y: 300, w: 100, h: 40 }
  const ca = { x: 300, y: 296, w: 150, h: 48 }
  const sd = { x: 160, y: 300, w: 110, h: 40 }
  return (
    <DiagramFigure
      w={680}
      h={400}
      label="LAQ 模型结构：编码器做差、量化，解码器用 cross-attention 重建"
      caption="上半部分是编码器：两帧各自做 patch embedding 和空间注意力，再一起过因果 transformer，得到只看 $x_1$ 的 $e_1$ 和看过两帧的 $e_2$；两者相减得到 $d_1$，经 CNN 定出 4 个位置，再各自量化到 8 个码字之一。下半部分是解码器：$x_1$ 的 patch 作 query、量化后的潜在动作作 key/value 做 cross-attention，只有空间 transformer，重建 $x_2$。唯一的训练信号是像素 L2 重建误差。图中码字编号只是示意。"
    >
      {defs}
      <T x={0} y={4} align="start" size={11.5} weight={600} color={C.idm} w={300}>{'编码器（$\\approx$ 逆动力学模型）'}</T>
      {/* 两帧 */}
      <Frame x={0} y={r1 - fs / 2} s={fs} label="$x_1$" />
      <Frame x={0} y={r2 - fs / 2} s={fs} label="$x_2$" />
      {[r1, r2].map((r, i) => (
        <g key={r}>
          <Arrow d={`M${fs + 3},${r} H${pe.x - 3}`} color={C.ink3} marker={end('g')} />
          <Box x={pe.x} y={r - bh / 2} w={pe.w} h={bh} color={C.idm} title="Patch Emb" sub={i === 0 ? '$p_1$' : '$p_2$'} titleSize={11} subSize={10.5} />
          <Arrow d={`M${pe.x + pe.w + 3},${r} H${st.x - 3}`} color={C.ink3} marker={end('g')} />
          <Box x={st.x} y={r - bh / 2} w={st.w} h={bh} color={C.idm} title="空间 Transformer" titleSize={10} />
          <Arrow d={`M${st.x + st.w + 3},${r} H${ct.x - 3}`} color={C.ink3} marker={end('g')} />
        </g>
      ))}
      <Box x={ct.x} y={ct.y} w={ct.w} h={ct.h} color={C.idm} title="因果 Transformer" sub="时间维因果" titleSize={11} />
      <Arrow d={`M${ct.x + ct.w + 3},${r1} H${450} V${df.y + 14} H${df.x - 3}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${ct.x + ct.w + 3},${r2} H${410} V${df.y + df.h - 10} H${df.x - 3}`} color={C.ink3} marker={end('g')} />
      <T x={362} y={r1 - 11} align="start" size={10.5} w={130} color={C.ink2}>{'$e_1$：只看 $x_1$'}</T>
      <T x={362} y={r2 - 11} align="start" size={10.5} w={130} color={C.ink2}>{'$e_2$：看 $x_1, x_2$'}</T>
      <Box x={df.x} y={df.y} w={df.w} h={df.h} color={C.accent} title="$d_1 = e_2 - e_1$" titleSize={12.5} tint={14} />
      <Arrow d={`M${df.x + df.w / 2},${df.y + df.h + 2} V${cnn.y - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={cnn.x} y={cnn.y} w={cnn.w} h={cnn.h} color={C.idm} title="CNN" sub="定出序列长度 $s=4$" titleSize={11.5} subSize={9.5} />
      <Arrow d={`M${qz.x + qz.w / 2},${cnn.y + cnn.h + 2} V${qz.y - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={qz.x} y={qz.y} w={qz.w} h={qz.h} color={C.z} title="就近量化" sub="码本 $|\mathcal{C}| = 8$" titleSize={11.5} subSize={9.5} tint={20} />
      <Arrow d={`M${qz.x + qz.w / 2},${qz.y + qz.h + 2} V${zy - 3}`} color={C.z} marker={end('z')} />
      {/* 潜在动作：4 个 token */}
      {CODE.map((c, i) => (
        <g key={i}>
          <rect x={qz.x + 6 + i * 22} y={zy} width={20} height={22} rx={3} fill="color-mix(in srgb, var(--c-latent) 30%, var(--card))" stroke={C.z} />
          <T x={qz.x + 16 + i * 22} y={zy + 11} w={20} size={11} weight={600}>{String(c)}</T>
        </g>
      ))}
      <T x={qz.x + qz.w + 8} y={zy + 11} align="start" size={11.5} w={100} color={C.z}>{'$z_1$：4 个码字'}</T>
      <T x={qz.x + qz.w + 8} y={qz.y + 20} align="start" size={10} w={100} color={C.ink3}>{'$8^4 = 4096$ 种'}</T>

      {/* 解码器 */}
      <line x1={0} x2={680} y1={282} y2={282} stroke="var(--rule)" />
      <T x={0} y={384} align="start" size={11.5} weight={600} color={C.fdm} w={300}>{'解码器（$\\approx$ 世界模型）'}</T>
      <Arrow d={`M${nv.x + nv.w / 2},${zy + 24} V${nv.y - 3}`} color={C.z} marker={end('z')} />
      <Box x={nv.x} y={nv.y} w={nv.w} h={nv.h} color={C.z} title="NSVQ" sub="训练时把误差换成噪声" titleSize={11.5} subSize={9} tint={14} />
      <Arrow d={`M${nv.x - 3},${nv.y + nv.h / 2} H${ca.x + ca.w + 3}`} color={C.z} marker={end('z')} width={2} />
      <T x={(nv.x + ca.x + ca.w) / 2} y={nv.y + nv.h / 2 - 11} w={60} size={11} color={C.z}>{'$\\hat d_1$'}</T>
      <Box x={ca.x} y={ca.y} w={ca.w} h={ca.h} color={C.fdm} title="Cross-Attention" sub="Q: $\mathrm{sg}[p_1]$，K/V: $\hat d_1$" titleSize={11.5} subSize={10} />
      <Arrow d={`M${ca.x - 3},${ca.y + ca.h / 2} H${sd.x + sd.w + 3}`} color={C.fdm} marker={end('f')} />
      <Box x={sd.x} y={sd.y} w={sd.w} h={sd.h} color={C.fdm} title="空间 Transformer" sub="没有时间维" titleSize={10.5} subSize={9.5} />
      <Arrow d={`M${sd.x - 3},${sd.y + sd.h / 2} H${fs + 26}`} color={C.fdm} marker={end('f')} />
      <Frame x={22} y={sd.y + sd.h / 2 - fs / 2} s={fs} label="$\hat x_2$" color={C.fdm} />
      {/* x1 的 patch（停梯度）送进 cross-attention */}
      <Arrow d={`M${pe.x + pe.w / 2},${r1 + bh / 2 + 2} V${r1 + bh / 2 + 14} H${150} V${270} H${ca.x + 40} V${ca.y - 3}`} color={C.accent} marker={end('a')} dashed />
      <T x={ca.x + 46} y={272} align="start" size={10.5} w={160} color={C.accent}>{'$\\mathrm{sg}[p_1]$：停梯度'}</T>
      <T x={60} y={362} align="start" size={10.5} w={260} color={C.ink2}>{'损失：$\\mathcal{L} = \\|x_2 - \\hat x_2\\|_2^2$'}</T>
    </DiagramFigure>
  )
}
