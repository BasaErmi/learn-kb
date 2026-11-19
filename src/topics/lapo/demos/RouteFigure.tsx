import { Arrow, Box, C, DiagramFigure, T, useArrows } from '@/kb/components/Diagram'

interface Step { title: string; sub: string; color: string }

const OLD: Step[] = [
  { title: '少量带标签数据', sub: '$(o_t,\\ a_t,\\ o_{t+1})$', color: C.act },
  { title: '训练 IDM', sub: '$p(a_t \\mid o_t,\\ o_{t+1})$', color: C.idm },
  { title: '给大量视频打伪标签', sub: '$\\hat a_t = \\text{IDM}(o_t,\\ o_{t+1})$', color: C.obs },
  { title: '行为克隆', sub: '$\\pi(a_t \\mid o_t)$', color: C.pi },
]
const LAPO: Step[] = [
  { title: '纯视频', sub: '$(o_t,\\ o_{t+1})$', color: C.obs },
  { title: 'IDM + FDM', sub: '自监督：重建 $o_{t+1}$', color: C.idm },
  { title: 'IDM 打潜在标签', sub: '$z_t = \\text{IDM}(o_t,\\ o_{t+1})$', color: C.z },
  { title: '潜在行为克隆', sub: '$\\pi:\\ o_t \\mapsto z_t$', color: C.pi },
  { title: '解码成真实动作', sub: '$d:\\ z \\mapsto a$', color: C.act },
]

const W = 680, GAP = 22, BH = 54

function Row({ steps, y, end }: { steps: Step[]; y: number; end: (k: string) => string }) {
  const bw = (W - (steps.length - 1) * GAP) / steps.length
  return (
    <g>
      {steps.map((s, i) => {
        const x = i * (bw + GAP)
        return (
          <g key={s.title}>
            <Box x={x} y={y} w={bw} h={BH} color={s.color} title={s.title} sub={s.sub} subSize={11} />
            {i < steps.length - 1 && <Arrow d={`M${x + bw + 3},${y + BH / 2} H${x + bw + GAP - 3}`} color={C.ink3} marker={end('g')} />}
          </g>
        )
      })}
    </g>
  )
}

/** 以往“先用标签训练 IDM、再打伪标签”的路线和 LAPO 的路线对比 */
export function RouteFigure() {
  const { defs, end } = useArrows({ g: 'var(--ink-3)' })
  const bw4 = (W - 3 * GAP) / 4
  const bw5 = (W - 4 * GAP) / 5
  return (
    <DiagramFigure
      w={W}
      h={236}
      label="以往的伪标签路线与 LAPO 的路线对比"
      caption="上面一行是 VPT、BCO 一类方法：IDM 要先用真实动作训练，所以第一步离不开标签，也必须事先知道动作空间。下面一行是 LAPO：前四步只用视频，标签或奖励只在最后把 $z$ 翻译成真实按键时才用到，而且用量很少。"
    >
      {defs}
      <T x={0} y={12} align="start" size={12} weight={600} color={C.ink2}>以往：VPT、BCO 等</T>
      <Row steps={OLD} y={24} end={end} />
      <T x={0} y={92} w={300} size={10.5} color={C.act} align="start">要真实动作，还要事先知道动作空间</T>
      <T x={0} y={130} align="start" size={12} weight={600} color={C.ink2}>LAPO</T>
      <Row steps={LAPO} y={142} end={end} />
      <rect x={-4} y={136} width={4 * bw5 + 3 * GAP + 8} height={BH + 12} rx={10} fill="none" stroke={C.idm} strokeOpacity={0.45} strokeDasharray="3 3" />
      <T x={(4 * bw5 + 3 * GAP) / 2} y={220} w={300} size={10.5} color={C.idm}>只用视频，不用任何动作标签</T>
      <T x={4 * (bw5 + GAP) + bw5 / 2} y={210} w={bw5 + 40} size={10.5} color={C.act}>少量标签或在线奖励</T>
    </DiagramFigure>
  )
}
