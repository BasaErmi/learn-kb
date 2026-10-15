import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { findTopic } from '@/topics/registry'
import { TopicToc } from '@/kb/components/TopicToc'
import { mdxComponents } from '@/kb/mdx-components'
import { BackToReading, JumpProvider } from '@/kb/jump'
import { NotFound } from './NotFound'

export function TopicPage() {
  const { slug = '' } = useParams()
  const topic = findTopic(slug)
  const Content = useMemo(() => (topic ? lazy(topic.load) : null), [topic])

  useEffect(() => {
    if (topic) document.title = `${topic.title} · 知识库`
    window.scrollTo(0, 0)
  }, [topic])

  if (!topic || !Content) return <NotFound />
  return (
    <Suspense fallback={<p className="kb-loading">加载中…</p>}>
      <JumpProvider>
      <div className="kb-topic">
        <aside className="kb-topic-side">
          <TopicToc steps={topic.steps} />
        </aside>
        <article className="kb-prose">
          <header className="kb-topic-head">
            <p className="kb-eyebrow">{topic.tags.join(' · ')}</p>
            <h1>{topic.title}</h1>
            <p className="kb-lede">{topic.summary}</p>
          </header>
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </article>
      </div>
      <BackToReading />
      </JumpProvider>
    </Suspense>
  )
}
