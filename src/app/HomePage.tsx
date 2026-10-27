import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { findTopic, topics, type Topic } from '@/topics/registry'
import { areas, findArea, inArea, toneOf } from '@/topics/taxonomy'
import { readJSON, safeStorage } from '@/kb/state/storage'
import { TexText } from '@/kb/components/Tex'
import { Tag } from './Tag'

// 标签按出现次数排序，次数相同按首次出现的顺序
const allTags = (() => {
  const count = new Map<string, number>()
  for (const t of topics) for (const tag of t.tags) count.set(tag, (count.get(tag) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1]).map(([tag, n]) => ({ tag, n }))
})()

function TopicCard({ t, activeTag }: { t: Topic; activeTag: string | null }) {
  const mastered = readJSON<string[]>(safeStorage(), `kb:${t.slug}:mastered`, []).length
  const nSteps = t.steps.filter((s) => s.id.startsWith('step-')).length
  const pre = (t.prereqs ?? []).map((s) => findTopic(s)?.title ?? s)
  return (
    <Link to={`/t/${t.slug}`} className="kb-topic-card">
      <span className="kb-tags">{t.tags.map((tag) => <Tag key={tag} tag={tag} active={tag === activeTag} />)}</span>
      <h4>{t.title}</h4>
      <p><TexText>{t.summary}</TexText></p>
      <span className="kb-card-meta">
        {nSteps} 步 · 更新于 {t.updated}
        {pre.length > 0 && ` · 建议先读 ${pre.join('、')}`}
        {mastered > 0 && ` · 已掌握 ${mastered} 张闪卡`}
      </span>
    </Link>
  )
}

export function HomePage() {
  const [params, setParams] = useSearchParams()
  const tag = params.get('tag')
  const area = params.get('area')
  useEffect(() => { document.title = '知识库' }, [])

  const visible = topics.filter((t) => (!tag || t.tags.includes(tag)) && (!area || inArea(t.area, area)))
  const areaTitle = area && (findArea(area)?.sub.title ?? areas.find((a) => a.id === area)?.title)
  const toggleTag = (x: string) => setParams(x === tag ? {} : { tag: x })

  return (
    <div className="kb-home">
      <header className="kb-home-head">
        <h1>知识库</h1>
        <p className="kb-lede">按领域整理的学习笔记，每篇都可以在「学习」和「复习」两种模式间切换。标签跨领域，点一下筛出相关的专题。</p>
      </header>
      <div className="kb-filter" role="group" aria-label="按标签筛选">
        {allTags.map(({ tag: x, n }) => (
          <button key={x} type="button" className="kb-tag-chip" data-tone={toneOf(x)} aria-pressed={x === tag} onClick={() => toggleTag(x)}>
            {x}<small>{n}</small>
          </button>
        ))}
        {(tag || area) && (
          <button type="button" className="kb-btn-ghost" onClick={() => setParams({})}>
            清除筛选{areaTitle ? `（${areaTitle}）` : ''}
          </button>
        )}
      </div>
      {visible.length === 0 && <p className="kb-muted">没有符合筛选条件的专题。</p>}
      {areas.map((a) => {
        const groups = a.subs
          .map((sub) => ({ sub, items: visible.filter((t) => t.area === `${a.id}/${sub.id}`) }))
          .filter((g) => g.items.length > 0)
        if (groups.length === 0) return null
        return (
          <section key={a.id} className="kb-area" aria-labelledby={`area-${a.id}`}>
            <h2 id={`area-${a.id}`}>{a.title}</h2>
            {groups.map(({ sub, items }) => (
              <div key={sub.id} className="kb-subarea">
                <h3>{sub.title}<span>{items.length}</span></h3>
                <ul className="kb-topic-list">
                  {items.map((t) => <li key={t.slug}><TopicCard t={t} activeTag={tag} /></li>)}
                </ul>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
