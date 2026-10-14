import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { topics } from '@/topics/registry'
import { readJSON, safeStorage } from '@/kb/state/storage'

export function HomePage() {
  useEffect(() => { document.title = '知识库' }, [])
  return (
    <div className="kb-home">
      <header className="kb-home-head">
        <h1>知识库</h1>
        <p className="kb-lede">按主题整理的学习笔记，每篇都可以在「学习」和「复习」两种模式间切换。</p>
      </header>
      <ul className="kb-topic-list">
        {topics.map((t) => {
          const visited = readJSON<string[]>(safeStorage(), `kb:${t.slug}:visited`, [])
          const read = t.steps.filter((s) => visited.includes(s.id)).length
          return (
            <li key={t.slug}>
              <Link to={`/t/${t.slug}`} className="kb-topic-card">
                <span className="kb-eyebrow">{t.tags.join(' · ')}</span>
                <h2>{t.title}</h2>
                <p>{t.summary}</p>
                <span className="kb-card-meta">
                  更新于 {t.updated} · 已读 {read}/{t.steps.length}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
