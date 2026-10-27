import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { findTopic, usedBy, type Topic } from '@/topics/registry'
import { findArea } from '@/topics/taxonomy'
import { TexText } from '@/kb/components/Tex'
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

/** 页头：所在领域（面包屑）、标签、前置与后续专题 */
function TopicHead({ topic }: { topic: Topic }) {
  const place = findArea(topic.area)
  const pre = (topic.prereqs ?? []).map(findTopic).filter((t): t is Topic => !!t)
  const next = usedBy(topic.slug)
  const links = (ts: Topic[]) => ts.map((t, i) => <span key={t.slug}>{i > 0 && '、'}<Link to={`/t/${t.slug}`}>{t.title}</Link></span>)
  return (
    <header className="kb-topic-head">
      {place && (
        <nav className="kb-crumbs" aria-label="所在领域">
          <Link to={`/?area=${place.area.id}`}>{place.area.title}</Link>
          <span aria-hidden> › </span>
          <Link to={`/?area=${topic.area}`}>{place.sub.title}</Link>
        </nav>
      )}
      <h1>{topic.title}</h1>
      <p className="kb-lede"><TexText>{topic.summary}</TexText></p>
      <dl className="kb-topic-rel">
        <div>
          <dt>标签</dt>
          <dd>{topic.tags.map((tag) => <Link key={tag} className="kb-tag-link" to={`/?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</dd>
        </div>
        {pre.length > 0 && <div><dt>建议先读</dt><dd>{links(pre)}</dd></div>}
        {next.length > 0 && <div><dt>被这些专题用到</dt><dd>{links(next)}</dd></div>}
      </dl>
    </header>
  )
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
          <TopicHead topic={topic} />
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
