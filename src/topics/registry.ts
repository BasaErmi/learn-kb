import type { ComponentType } from 'react'
import { meta as softmaxMeta } from './softmax/meta'
import { meta as crossEntropyMeta } from './cross-entropy/meta'
import { meta as cfgMeta } from './cfg/meta'
import { meta as ldmMeta } from './ldm/meta'

export interface TopicStep { id: string; title: string }
export interface TopicMeta {
  slug: string
  title: string
  summary: string
  /** 所属子领域，写法见 taxonomy.ts，如 'ml-basics/prob-output' */
  area: string
  /** 跨领域的关键词，首页可以按标签筛选 */
  tags: string[]
  /** 建议先读的专题 slug；反过来的“被哪些专题用到”由 usedBy 算出 */
  prereqs?: string[]
  updated: string
  steps: TopicStep[]
}
export interface Topic extends TopicMeta {
  load: () => Promise<{ default: ComponentType }>
}

// 同一子领域内按这里的顺序显示，基础的放前面
export const topics: Topic[] = [
  { ...softmaxMeta, load: () => import('./softmax/index.mdx') },
  { ...crossEntropyMeta, load: () => import('./cross-entropy/index.mdx') },
  { ...cfgMeta, load: () => import('./cfg/index.mdx') },
  { ...ldmMeta, load: () => import('./ldm/index.mdx') },
]

export function findTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug)
}

/** 把 slug 作为前置的专题 */
export function usedBy(slug: string): Topic[] {
  return topics.filter((t) => t.prereqs?.includes(slug))
}
