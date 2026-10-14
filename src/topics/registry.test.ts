import { describe, expect, it } from 'vitest'
import { findTopic, topics } from './registry'

describe('registry', () => {
  it('has unique slugs', () => {
    const slugs = topics.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('has unique step ids inside each topic', () => {
    for (const t of topics) {
      const ids = t.steps.map((s) => s.id)
      expect(new Set(ids).size, t.slug).toBe(ids.length)
    }
  })
  it('finds cfg and rejects unknown slugs', () => {
    expect(findTopic('cfg')?.title).toContain('Classifier-Free Guidance')
    expect(findTopic('nope')).toBeUndefined()
  })
})
