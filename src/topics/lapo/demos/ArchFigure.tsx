import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from './diagram'

/** 第一阶段的结构：IDM 看三帧、FDM 看两帧，中间只隔着量化后的 z */
export function ArchFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', a: 'var(--accent)', z: 'var(--c-latent)', o: 'var(--c-obs)' })
  // 帧
  const fx = 24, fs = 48
  const yPrev = 40, yCur = 100, yNext = 206
  // 方框
  const idm = { x: 175, y: 160, w: 130, h: 70 }
  const fdm = { x: 375, y: 40, w: 140, h: 70 }
  const vq = { x: 410, y: 170, w: 70, h: 50 }
  const loss = { x: 548, y: 168, w: 128, h: 54 }
  const bus = 122
  const idmY1 = idm.y + 22, idmY2 = idm.y + 50
  return (
    <DiagramFigure
      w={680}
      h={300}
      label="LAPO 第一阶段：IDM、VQ 与 FDM 的连接方式"
      caption="论文里 $k = 1$：IDM 和 FDM 都看得到过去两帧，只有 IDM 看得到未来一帧（红色箭头）。两者之间唯一的通道是 IDM 输出的 128 维向量 $z_t$，它先经过 VQ 量化，再交给 FDM。FDM 直接输出整张下一帧，两个网络用同一个重建误差联合训练。"
    >
      {defs}
      {/* 帧 */}
      <Frame x={fx} y={yPrev} s={fs} label="$o_{t-1}$" />
      <Frame x={fx} y={yCur} s={fs} label="$o_t$" />
      <Frame x={fx} y={yNext} s={fs} label="$o_{t+1}$" hot />
      <T x={fx + fs / 2} y={yPrev - 14} w={90} size={10.5} color={C.ink3}>过去两帧</T>
      <T x={fx + fs / 2 + 8} y={yNext + fs + 13} w={160} size={10.5} color={C.accent} align="start">未来一帧：只有 IDM 看得到</T>

      {/* 过去两帧 → 汇总线 → FDM 与 IDM */}
      <Arrow d={`M${fx + fs + 2},${yPrev + fs / 2} H${bus}`} color={C.ink3} />
      <Arrow d={`M${fx + fs + 2},${yCur + fs / 2} H${bus}`} color={C.ink3} />
      <Arrow d={`M${bus},${yPrev + fs / 2} V${idmY1}`} color={C.ink3} />
      <Arrow d={`M${bus},${fdm.y + fdm.h / 2} H${fdm.x - 3}`} color={C.ink3} marker={end('g')} />
      <Arrow d={`M${bus},${idmY1} H${idm.x - 3}`} color={C.ink3} marker={end('g')} />
      <T x={250} y={fdm.y + fdm.h / 2 - 11} w={200} size={10.5} color={C.ink2}>{'$o_{t-1},\\ o_t$：2 帧，6 通道'}</T>

      {/* 未来帧只进 IDM */}
      <Arrow d={`M${fx + fs + 2},${yNext + fs / 2 - 6} H${bus + 18} V${idmY2} H${idm.x - 3}`} color={C.accent} marker={end('a')} width={2} />

      {/* IDM */}
      <Box x={idm.x} y={idm.y} w={idm.w} h={idm.h} color={C.idm} title="IDM" sub="IMPALA-CNN" />
      <T x={idm.x + idm.w / 2} y={idm.y + idm.h + 14} w={220} size={10.5} color={C.ink2}>3 帧按通道拼成 9 通道输入</T>

      {/* IDM → z → VQ → FDM */}
      <Arrow d={`M${idm.x + idm.w + 3},${vq.y + vq.h / 2} H${vq.x - 3}`} color={C.z} marker={end('z')} width={2} />
      <T x={(idm.x + idm.w + vq.x) / 2} y={vq.y + vq.h / 2 - 12} w={120} size={12} color={C.z}>{'$z_t \\in \\mathbb{R}^{128}$'}</T>
      <Box x={vq.x} y={vq.y} w={vq.w} h={vq.h} color={C.z} title="VQ" sub="最近码字" tint={20} />
      <Arrow d={`M${vq.x + vq.w / 2},${vq.y - 3} V${fdm.y + fdm.h + 3}`} color={C.z} marker={end('z')} width={2} />
      <T x={vq.x + vq.w / 2 + 8} y={(vq.y + fdm.y + fdm.h) / 2} w={60} size={12} color={C.z} align="start">{'$z_t^{q}$'}</T>

      {/* FDM */}
      <Box x={fdm.x} y={fdm.y} w={fdm.w} h={fdm.h} color={C.fdm} title="FDM" sub="U-Net，约 8M 参数" />
      <T x={fdm.x + fdm.w / 2} y={fdm.y - 13} w={300} size={10.5} color={C.ink2}>{'$z_t^{q}$ 在 U-Net 第一层和最深处各注入一次'}</T>

      {/* FDM → 预测帧 → 损失 */}
      <Arrow d={`M${fdm.x + fdm.w + 3},${fdm.y + fdm.h / 2} H${588 - 3}`} color={C.fdm} marker={end('g')} />
      <Frame x={588} y={fdm.y + fdm.h / 2 - fs / 2} s={fs} label="$\hat o_{t+1}$" color={C.fdm} />
      <Arrow d={`M${612},${fdm.y + fdm.h / 2 + fs / 2 + 2} V${loss.y - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={loss.x} y={loss.y} w={loss.w} h={loss.h} color={C.ink2} title="重建误差" sub="$\|\hat o_{t+1} - o_{t+1}\|^2$" tint={6} />

      {/* 真实的下一帧作为目标 */}
      <Arrow d={`M${fx + fs / 2},${yNext + fs + 24} V${282} H${612} V${loss.y + loss.h + 3}`} color={C.obs} marker={end('o')} dashed />
      <T x={360} y={273} w={260} size={10.5} color={C.ink3}>{'真实的 $o_{t+1}$ 作为重建目标'}</T>
    </DiagramFigure>
  )
}
