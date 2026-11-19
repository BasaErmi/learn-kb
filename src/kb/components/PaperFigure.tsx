import { useState, type ReactNode } from 'react'
import { Seg } from '@/kb/components/Seg'
import { TexText } from '@/kb/components/Tex'
import { useReviewMode } from '@/kb/state/ReviewMode'

/** 论文原图。src 相对 public/，如 `images/lapa/fig2.webp`；图注是字符串时按 `$...$` 渲染公式 */
const img = (src: string) => `${import.meta.env.BASE_URL}${src}`
const cap = (c: ReactNode) => (typeof c === 'string' ? <TexText>{c}</TexText> : c)

/** maxWidth 防止小图被拉得过大 */
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

