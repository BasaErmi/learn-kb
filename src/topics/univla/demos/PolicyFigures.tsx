import { Arrow, Box, C, DiagramFigure, Frame, T, useArrows } from '@/kb/components/Diagram'
import { Chip, Squares, squaresWidth, U } from './parts'

const IDX = [3, 11, 7, 2] // 示意用的码本索引

/** 策略预训练：冻结的 LAM 给 (o_t, o_{t+k}) 打标签，VLM 只看 o_t 和 ℓ，自回归预测 4 个 ACT token */
export function PolicyFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', tc: U.tc, p: 'var(--c-pi)' })
  const llm = { x: 300, y: 108, w: 150, h: 106 }
  const ox = 488 // 输出 token 的 x
  return (
    <DiagramFigure
      w={680}
      h={240}
      label="策略预训练：LAM 离线打标签，VLM 预测潜动作 token"
      caption="上：冻结的 LAM 看一对帧 $(o_t, o_{t+k})$，取 $\tilde a_{TC}$ 的 4 个码本索引作为伪标签，索引 $i$ 对应词表里新加的 $\mathrm{ACT}_i$。下：Prismatic-7B 的输入只有 $o_t$ 和 $\ell$，按 next-token 交叉熵逐个预测这 4 个 token。图中索引是示意。"
    >
      {defs}
      <T x={0} y={8} align="start" size={11} weight={600} color={C.ink3} w={200}>离线打标签</T>
      <Frame x={0} y={22} s={38} w={76} size={11.5} label="$o_t,\ o_{t+k}$" />
      <Arrow d={`M${79},${41} H${113}`} color={C.ink3} marker={end('g')} />
      <Box x={116} y={20} w={150} h={42} color={C.idm} title="LAM（Stage 2）" sub="冻结" frozen titleSize={11.5} />
      <Arrow d={`M${269},${41} H${303}`} color={U.tc} marker={end('tc')} width={2} />
      <T x={286} y={28} w={40} size={10} color={U.tc}>{'$\\tilde a_{TC}$'}</T>
      {IDX.map((n, i) => (
        <Chip key={i} x={306 + i * 46} y={29} w={42} color={U.tc} label={String(n)} />
      ))}
      <Arrow d={`M${492},${41} H${520}`} color={U.tc} marker={end('tc')} />
      {IDX.map((n, i) => (
        <Chip key={i} x={523 + i * 39} y={29} w={36} color={U.tc} label={`$\\mathrm{ACT}_{${n}}$`} size={9.5} />
      ))}
      <T x={600} y={68} w={160} size={10} color={C.ink3}>{'伪标签 $a_{z,1}, \\dots, a_{z,4}$'}</T>

      <line x1={0} x2={680} y1={86} y2={86} stroke="var(--rule)" />
      <T x={0} y={102} align="start" size={11} weight={600} color={C.ink3} w={200}>策略预训练</T>
      <Frame x={0} y={116} s={36} w={44} label="$o_t$" />
      <Arrow d={`M${47},${134} H${73}`} color={C.ink3} marker={end('g')} />
      <Box x={76} y={114} w={120} h={40} color={C.obs} title="SigLIP + DINOv2" titleSize={11} />
      <Arrow d={`M${199},${134} H${221}`} color={C.ink3} marker={end('g')} />
      <Box x={224} y={114} w={56} h={40} color={C.obs} title="投影" titleSize={11} />
      <Arrow d={`M${283},${134} H${llm.x - 3}`} color={C.ink3} marker={end('g')} />
      <Frame x={0} y={172} s={36} w={44} label="$\ell$" color={U.lang} />
      <Arrow d={`M${47},${190} H${73}`} color={C.ink3} marker={end('g')} />
      <Box x={76} y={170} w={204} h={40} color={U.lang} title="Tokenizer" titleSize={11} />
      <Arrow d={`M${283},${190} H${llm.x - 3}`} color={C.ink3} marker={end('g')} />
      <Box x={llm.x} y={llm.y} w={llm.w} h={llm.h} color={C.pi} title="LLaMA-2 7B" sub="全参数训练" />
      <Arrow d={`M${llm.x + llm.w + 3},${llm.y + llm.h / 2} H${ox - 3}`} color={C.pi} marker={end('p')} width={2} />
      {[1, 2, 3, 4].map((i) => (
        <Chip key={i} x={ox + (i - 1) * 46} y={llm.y + llm.h / 2 - 12} w={42} color={C.pi} label={`$\\hat a_{z,${i}}$`} size={10} />
      ))}
      <T x={ox + 90} y={llm.y + llm.h / 2 + 26} w={200} size={10} color={C.ink3}>逐个自回归生成</T>
      <Arrow d={`M${600},${78} V${llm.y + llm.h / 2 - 16}`} color={U.tc} marker={end('tc')} dashed />
      <T x={606} y={128} align="start" size={10} w={80} color={U.tc}>交叉熵</T>
      <T x={llm.x + llm.w / 2} y={232} w={300} size={10} color={C.ink3}>{'输入里没有 $o_{t+k}$'}</T>
    </DiagramFigure>
  )
}

/** 动作解码器：两次 attention pooling，视觉向量加到 query 上去读潜动作的隐状态 */
export function DecoderFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', v: 'var(--c-obs)', tc: U.tc, a: 'var(--c-act)' })
  const vlm = { x: 0, y: 6, w: 96, h: 212 }
  const ev = { x: 118, y: 44 }, ea = { x: 118, y: 160 }
  const p1 = { x: 222, y: 26, w: 168, h: 46 }
  const p2 = { x: 222, y: 142, w: 168, h: 46 }
  const lin = { x: 470, y: 142, w: 76, h: 46 }
  return (
    <DiagramFigure
      w={680}
      h={250}
      label="动作解码器：attention pooling 读出视觉和潜动作的隐状态，线性层输出 action chunk"
      caption="取 VLM 最后一层的视觉隐状态 $E_v$ 和 4 个潜动作位置的隐状态 $E_a$。第一次 attention pooling 用可学习的 $q_v$ 把 $E_v$ 汇成一个向量 $E_v'$；第二次把 $E_v'$ 加到 $q_a$ 上作为 query 去读 $E_a$，得到 $E_a'$，再经线性层一次输出整个 action chunk。真机实验另加一个本体状态 MLP。整个头约 12.6M 参数，与 LoRA 一起端到端训练。"
    >
      {defs}
      <Box x={vlm.x} y={vlm.y} w={vlm.w} h={vlm.h} color={C.pi} title="VLM" sub="最后一层，LoRA" subSize={9.5} />
      {/* E_v */}
      <Squares x={ev.x} y={ev.y} n={5} color={C.obs} s={10} gap={2} />
      <T x={ev.x + 29} y={ev.y - 12} w={60} size={10.5}>{'$E_v$'}</T>
      <Arrow d={`M${ev.x + squaresWidth(5, 10, 2) + 3},${ev.y + 5} H${p1.x - 3}`} color={C.obs} marker={end('v')} />
      <Box x={p1.x} y={p1.y} w={p1.w} h={p1.h} color={C.obs} title="Attention pooling" sub="$Q = q_v,\ K = V = E_v$" titleSize={11} subSize={10} />
      <Arrow d={`M${p1.x + p1.w + 3},${p1.y + p1.h / 2} H${417}`} color={C.obs} marker={end('v')} />
      <Squares x={420} y={p1.y + p1.h / 2 - 5} n={1} color={C.obs} s={10} />
      <T x={445} y={p1.y + p1.h / 2} align="start" size={10.5} w={80}>{"$E_v'$"}</T>
      <T x={445} y={p1.y + p1.h / 2 + 18} align="start" size={9.5} w={230} color={C.ink3}>视觉说“在哪里做”</T>
      {/* E_v' 加到 q_a 上 */}
      <Arrow d={`M${425},${p1.y + p1.h / 2 + 8} V${112} H${p2.x + p2.w / 2} V${p2.y - 3}`} color={C.obs} marker={end('v')} dashed />
      <T x={p2.x + p2.w / 2 + 6} y={124} align="start" size={10} w={140} color={C.ink3}>{'加到 $q_a$ 上'}</T>
      {/* E_a */}
      <Squares x={ea.x} y={ea.y} n={4} color={U.tc} s={10} gap={2} />
      <T x={ea.x + 23} y={ea.y + 24} w={60} size={10.5}>{'$E_a$'}</T>
      <Arrow d={`M${ea.x + squaresWidth(4, 10, 2) + 3},${ea.y + 5} H${p2.x - 3}`} color={U.tc} marker={end('tc')} />
      <Box x={p2.x} y={p2.y} w={p2.w} h={p2.h} color={U.tc} title="Attention pooling" sub="$Q = q_a + E_v',\ K = V = E_a$" titleSize={11} subSize={10} />
      <Arrow d={`M${p2.x + p2.w + 3},${p2.y + p2.h / 2} H${lin.x - 3}`} color={U.tc} marker={end('tc')} width={2} />
      <T x={(p2.x + p2.w + lin.x) / 2} y={p2.y + p2.h / 2 - 11} w={60} size={10.5} color={U.tc}>{"$E_a'$"}</T>
      <T x={(p2.x + p2.w + lin.x) / 2} y={p2.y + p2.h / 2 + 30} w={120} size={9.5} color={C.ink3}>潜动作说“做什么”</T>
      <Box x={lin.x} y={lin.y} w={lin.w} h={lin.h} color={C.act} title="线性层" titleSize={11.5} tint={18} />
      <Arrow d={`M${lin.x + lin.w + 3},${lin.y + lin.h / 2} H${572}`} color={C.act} marker={end('a')} width={2} />
      <T x={576} y={lin.y + lin.h / 2 - 9} align="start" size={11} w={110} color={C.act}>action chunk</T>
      <T x={576} y={lin.y + lin.h / 2 + 10} align="start" size={10} w={110} color={C.ink3}>{'维度 $\\times$ 步数'}</T>
      <Box x={lin.x - 8} y={210} w={lin.w + 16} h={34} color={C.obs} title="本体状态 MLP" sub="仅真机" titleSize={10} subSize={9} />
      <Arrow d={`M${lin.x + lin.w / 2},${207} V${lin.y + lin.h + 3}`} color={C.ink3} marker={end('g')} />
    </DiagramFigure>
  )
}

/** 历史潜动作：训练时用 LAM 对真实帧的标签，推理时用策略上一步自己的输出 */
export function HistoryFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)', tc: U.tc, p: 'var(--c-pi)' })
  const r = [34, 150]
  const vx = 380
  return (
    <DiagramFigure
      w={680}
      h={236}
      label="历史潜动作在训练和推理时的来源"
      caption="历史潜动作拼在指令后面，只用一步（4 个 token），概括了上一段约 1 秒发生的事。训练时它是 LAM 对真实历史帧打的标签；推理时除第一步外，放的是策略上一步自己输出的 4 个 token，形成一个反馈回路。两者的来源不同，类似 exposure bias。"
    >
      {defs}
      {['训练', '推理'].map((s, i) => (
        <g key={s}>
          <T x={0} y={r[i] - 20} align="start" size={12} weight={600} w={60}>{s}</T>
          <Chip x={0} y={r[i]} w={60} color={U.lang} label="$\ell$" />
          <Chip x={66} y={r[i]} w={140} color={U.tc} label={i === 0 ? 'LAM 对真实帧的标签' : '上一步自己的输出'} size={10.5} dashed={i === 1} />
          <Chip x={212} y={r[i]} w={60} color={C.obs} label="$o_t$" />
          <Arrow d={`M${275},${r[i] + 12} H${vx - 3}`} color={C.ink3} marker={end('g')} />
          <Box x={vx} y={r[i] - 6} w={110} h={36} color={C.pi} title="VLM" titleSize={11.5} />
          <Arrow d={`M${vx + 113},${r[i] + 12} H${525}`} color={C.pi} marker={end('p')} width={2} />
          <Chip x={528} y={r[i]} w={140} color={C.pi} label="4 个 ACT token" size={10.5} />
        </g>
      ))}
      <T x={136} y={r[0] + 38} w={240} size={10} color={C.ink3}>{'LAM 看真实历史帧对 $(o_{t-k}, o_t)$'}</T>
      {/* 推理时的反馈回路 */}
      <Arrow d={`M${598},${r[1] + 27} V${r[1] + 52} H${136} V${r[1] + 27}`} color={C.pi} marker={end('p')} dashed />
      <T x={367} y={r[1] + 64} w={300} size={10} color={C.ink3}>下一步时，作为历史放回 prompt</T>
    </DiagramFigure>
  )
}
