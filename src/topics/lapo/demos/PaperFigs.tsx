import { useState, type ReactNode } from 'react'
import { Seg } from '@/kb/components/Seg'
import { TexText } from '@/kb/components/Tex'
import { useReviewMode } from '@/kb/state/ReviewMode'

const img = (name: string) => `${import.meta.env.BASE_URL}images/lapo/${name}`
/** 图注是字符串时按 `$...$` 渲染公式 */
const cap = (c: ReactNode) => (typeof c === 'string' ? <TexText>{c}</TexText> : c)

/** 论文原图；maxWidth 防止小图被拉得过大 */
export function PaperFigure({ src, alt, caption, maxWidth }: { src: string; alt: string; caption: ReactNode; maxWidth?: string }) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className="kb-figure kb-paperfig" style={maxWidth ? { maxWidth, marginLeft: 'auto', marginRight: 'auto' } : undefined}>
      <img src={img(src)} alt={alt} loading="lazy" />
      <figcaption>{cap(caption)}</figcaption>
    </figure>
  )
}

interface Tab { value: string; label: string; src: string; alt: string; caption: ReactNode; maxWidth?: string }

/** 同一张论文图的不同版本（如 16 个游戏的平均 / 逐个游戏），用分段按钮切换 */
export function PaperFigTabs({ label, tabs }: { label: string; tabs: Tab[] }) {
  const { review } = useReviewMode()
  const [v, setV] = useState(tabs[0].value)
  if (review) return null
  const t = tabs.find((x) => x.value === v)!
  return (
    <figure className="kb-figure kb-paperfig">
      <div className="kb-controls kb-paperfig-ctl">
        <Seg label={label} value={v} onChange={setV} options={tabs.map((x) => ({ value: x.value, label: x.label }))} />
      </div>
      <div style={t.maxWidth ? { maxWidth: t.maxWidth, margin: '0 auto' } : undefined}>
        <img src={img(t.src)} alt={t.alt} loading="lazy" />
      </div>
      <figcaption>{cap(t.caption)}</figcaption>
    </figure>
  )
}

type Group = 'clear' | 'frag' | 'other'
const GAMES: { id: string; group: Group }[] = [
  { id: 'bigfish', group: 'clear' }, { id: 'chaser', group: 'clear' }, { id: 'dodgeball', group: 'clear' }, { id: 'maze', group: 'clear' },
  { id: 'miner', group: 'clear' }, { id: 'plunder', group: 'clear' }, { id: 'starpilot', group: 'clear' },
  { id: 'climber', group: 'frag' }, { id: 'coinrun', group: 'frag' }, { id: 'fruitbot', group: 'frag' }, { id: 'jumper', group: 'frag' }, { id: 'ninja', group: 'frag' },
  { id: 'bossfight', group: 'other' }, { id: 'caveflyer', group: 'other' }, { id: 'heist', group: 'other' }, { id: 'leaper', group: 'other' },
]
const GROUP_NAME: Record<Group, string> = { clear: '聚类清晰', frag: '碎片化', other: '论文未归类' }
const GROUP_NOTE: Record<Group, string> = {
  clear: '论文把它归为聚类清晰的一类：有 VQ 时，簇和真实动作基本一一对应。',
  frag: '论文把它归为碎片化的一类：画面跟着角色移动，画面外露出的新内容也要经 $z$ 传给 FDM，簇被切碎，颜色混在一起。',
  other: '论文正文没有把它归到哪一类。',
}
const SPECIAL: Record<string, string> = {
  bigfish: '对比最明显的一个：有 VQ 时基本一个动作一簇；去掉 VQ 后分成 4 个岛，每个岛里各个动作都有一份，同一个动作被拆成了约 4 簇。',
  miner: '有 VQ 时上下左右各成一簇（论文图 1 画的就是它）；去掉 VQ 后也还能大致按动作分开。',
}

/** 论文图 5（有 VQ）和图 7（无 VQ）的同一个游戏并排放大 */
export function UmapCompare() {
  const { review } = useReviewMode()
  const [g, setG] = useState('bigfish')
  if (review) return null
  const game = GAMES.find((x) => x.id === g)!
  return (
    <figure className="kb-figure kb-paperfig kb-umap">
      <div className="kb-umap-ctl">
        {(Object.keys(GROUP_NAME) as Group[]).map((grp) => (
          <div key={grp} className="kb-umap-group">
            <span>{GROUP_NAME[grp]}</span>
            <Seg label={`选择游戏：${GROUP_NAME[grp]}`} value={g} onChange={setG} options={GAMES.filter((x) => x.group === grp).map((x) => ({ value: x.id, label: x.id }))} />
          </div>
        ))}
      </div>
      <div className="kb-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <figure>
          <img src={img(`umap-vq-${g}.webp`)} alt={`${g}：有 VQ 时的潜在动作 UMAP`} />
          <span className="kb-tag">有 VQ · 论文图 5</span>
        </figure>
        <figure>
          <img src={img(`umap-novq-${g}.webp`)} alt={`${g}：无 VQ 时的潜在动作 UMAP`} />
          <span className="kb-tag">无 VQ · 论文图 7</span>
        </figure>
      </div>
      <img className="kb-umap-legend" src={img('umap-legend.webp')} alt="颜色图例：12 个真实动作（箭头是移动方向，W、S、A、D 是游戏里的功能键）" />
      <figcaption>
        <b>{g}</b>：<TexText>{SPECIAL[g] ? `${SPECIAL[g]}${GROUP_NOTE[game.group]}` : GROUP_NOTE[game.group]}</TexText>
        <br />
        每个点是一条转移的 IDM 输出（量化前），颜色是这条转移的真实动作，只用来上色，训练时没用到。NOOP 没有画出来。
      </figcaption>
    </figure>
  )
}
