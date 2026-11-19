import { C, DiagramFigure, T } from '@/kb/components/Diagram'

type Seg = 'known' | 'act' | 'rand' | 'new'
const SEG: Record<Seg, { color: string; name: string; h: number }> = {
  known: { color: 'var(--c-obs)', name: '已在 $o_t$ 里（背景、布局、外观）', h: 104 },
  act: { color: 'var(--c-act)', name: '动作引起的变化', h: 18 },
  rand: { color: 'var(--c-rand)', name: '随机事件', h: 18 },
  new: { color: 'var(--c-new)', name: '画面外露出的新内容', h: 26 },
}
const CAP = 46 // z 的容量（示意高度）

interface Col { title: string; sub: string; segs: Seg[]; known: boolean; verdict: string; ok: boolean }
const COLS: Col[] = [
  { title: 'FDM 看不到 $o_t$', sub: '假设的对照', segs: ['known', 'act'], known: false, verdict: '装不下，只能粗略压缩整帧', ok: false },
  { title: '确定性环境', sub: 'FDM 看得到 $o_t$', segs: ['known', 'act'], known: true, verdict: '$z_t \\approx$ 动作', ok: true },
  { title: '有随机事件', sub: '例如敌人随机出现', segs: ['known', 'act', 'rand'], known: true, verdict: '$z_t$ = 动作 + 随机事件', ok: false },
  { title: '视角跟随角色', sub: '边缘露出新区域', segs: ['known', 'act', 'new'], known: true, verdict: '$z_t$ = 动作 + 新内容', ok: false },
]

const W = 680, CW = 170, BASE = 214, BW = 44

/** o_{t+1} 里的信息拆成几块，哪些必须经过 z 才能到 FDM */
export function InfoFigure() {
  return (
    <DiagramFigure
      w={W}
      h={300}
      schematic
      label="o_{t+1} 中哪些信息必须经过 z_t"
      caption="每一栏左边的柱子是 $o_{t+1}$ 含有的信息，右边是其中必须经过 $z_t$ 才能送到 FDM 的部分，虚线框是 $z_t$ 的容量。FDM 看得到 $o_t$ 时，灰色部分它已经知道，不用再传。第二栏是 LAPO 期望的情形；后两栏里，动作以外的变化也挤进了 $z_t$。"
    >
      {COLS.map((c, i) => {
        const x0 = i * CW
        const ox = x0 + 28, zx = x0 + 98
        let y = BASE
        const need = c.segs.filter((s) => !(c.known && s === 'known'))
        const needH = need.reduce((a, s) => a + SEG[s].h, 0)
        const scale = c.known ? 1 : (CAP + 30) / needH // 装不下时把需要的部分画成“溢出”的高度
        let zy = BASE
        return (
          <g key={i}>
            <T x={x0 + CW / 2} y={14} w={CW} size={12.5} weight={600}>{c.title}</T>
            <T x={x0 + CW / 2} y={33} w={CW} size={10.5} color={C.ink3}>{c.sub}</T>
            {/* o_{t+1} 柱 */}
            {c.segs.map((s) => {
              const h = SEG[s].h
              y -= h
              const faded = c.known && s === 'known'
              return (
                <g key={s}>
                  <rect x={ox} y={y} width={BW} height={h} fill={SEG[s].color} opacity={faded ? 0.22 : 0.85} stroke="var(--card)" strokeWidth={1} />
                  {faded && <T x={ox + BW / 2} y={y + h / 2} w={BW} size={9.5} color={C.ink2}>FDM 已知</T>}
                </g>
              )
            })}
            <T x={ox + BW / 2} y={BASE + 13} w={60} size={11}>{'$o_{t+1}$'}</T>
            {/* z 需要装的部分 */}
            {need.map((s) => {
              const h = SEG[s].h * scale
              zy -= h
              return <rect key={s} x={zx} y={zy} width={BW} height={h} fill={SEG[s].color} opacity={0.85} stroke="var(--card)" strokeWidth={1} />
            })}
            <rect x={zx - 3} y={BASE - CAP} width={BW + 6} height={CAP} fill="none" stroke={C.z} strokeWidth={1.6} strokeDasharray="4 3" rx={3} />
            <T x={zx + BW / 2} y={BASE + 13} w={60} size={11} color={C.z}>{'$z_t$'}</T>
            {!c.known && <T x={zx + BW / 2} y={BASE - CAP - 40} w={70} size={9.5} color={C.z}>超出容量</T>}
            <T x={x0 + CW / 2} y={BASE + 36} w={CW} size={11} color={c.ok ? 'var(--c-uncond)' : C.accent} weight={600}>{c.verdict}</T>
          </g>
        )
      })}
      {/* 图例 */}
      {(Object.keys(SEG) as Seg[]).map((s, i) => {
        const lx = i < 2 ? 20 + i * 260 : 20 + (i - 2) * 260
        const ly = i < 2 ? 270 : 290
        return (
          <g key={s}>
            <rect x={lx} y={ly - 6} width={12} height={12} rx={2} fill={SEG[s].color} opacity={0.85} />
            <T x={lx + 18} y={ly} w={240} size={10.5} color={C.ink2} align="start">{SEG[s].name}</T>
          </g>
        )
      })}
      <rect x={540} y={264} width={18} height={12} rx={2} fill="none" stroke={C.z} strokeWidth={1.6} strokeDasharray="4 3" />
      <T x={564} y={270} w={120} size={10.5} color={C.ink2} align="start">{'$z_t$ 的容量'}</T>
    </DiagramFigure>
  )
}
