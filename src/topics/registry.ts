import type { ComponentType } from 'react'
import { meta as cfgMeta } from './cfg/meta'
import { meta as ldmMeta } from './ldm/meta'

export interface TopicStep { id: string; title: string }
export interface TopicMeta {
  slug: string
  title: string
  summary: string
  tags: string[]
  updated: string
  steps: TopicStep[]
}
export interface Topic extends TopicMeta {
  load: () => Promise<{ default: ComponentType }>
}

export const topics: Topic[] = [
  { ...cfgMeta, load: () => import('./cfg/index.mdx') },
  { ...ldmMeta, load: () => import('./ldm/index.mdx') },
]

export function findTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug)
}
