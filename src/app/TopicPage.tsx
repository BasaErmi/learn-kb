import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { findTopic, type Topic } from '@/topics/registry'
import { TopicToc } from '@/kb/components/TopicToc'
import { mdxComponents } from '@/kb/mdx-components'
import { BackToReading, JumpProvider } from '@/kb/jump'
import { NotFound } from './NotFound'

// 每个专题的懒加载组件只创建一次。路由切换在 transition 里进行，挂起的渲染会被丢弃，
// 如果在渲染时现场创建 lazy 组件，每次重试都会得到新组件，永远加载不完
const contentCache = new Map<string, LazyExoticComponent<ComponentType>>()
function contentOf(topic: Topic) {
  let c = contentCache.get(topic.slug)
  if (!c) contentCache.set(topic.slug, (c = lazy(topic.load)))
  return c
}

export function TopicPage() {
  const { slug = '' } = useParams()
  const topic = findTopic(slug)
  const Content = topic ? contentOf(topic) : null

  useEffect(() => {
    if (topic) document.title = `${topic.title} · 知识库`
    window.scrollTo(0, 0)
  }, [topic])

  if (!topic || !Content) return <NotFound />
  return (
    <Suspense fallback={<p className="kb-loading">加载中…</p>}>
      <JumpProvider key={topic.slug}>
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
