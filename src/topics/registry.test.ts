import { describe, expect, it } from 'vitest'
import { findTopic, topics, usedBy } from './registry'
import { findArea, inArea } from './taxonomy'

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
  it('puts every topic in a known sub-area', () => {
    for (const t of topics) expect(findArea(t.area), `${t.slug}: ${t.area}`).toBeDefined()
  })
  it('area filter matches a whole area or one sub-area', () => {
    expect(inArea('ml-basics/prob-output', 'ml-basics')).toBe(true)
    expect(inArea('ml-basics/prob-output', 'ml-basics/prob-output')).toBe(true)
    expect(inArea('ml-basics/prob-output', 'ml')).toBe(false)
  })
  it('prereqs point to existing topics without cycles', () => {
    for (const t of topics) for (const p of t.prereqs ?? []) {
      expect(findTopic(p), `${t.slug} → ${p}`).toBeDefined()
      expect(p).not.toBe(t.slug)
    }
    // 沿前置关系一直往回走，不能回到自己
    const reaches = (from: string, target: string, seen = new Set<string>()): boolean =>
      (findTopic(from)?.prereqs ?? []).some((p) => p === target || (!seen.has(p) && (seen.add(p), reaches(p, target, seen))))
    for (const t of topics) expect(reaches(t.slug, t.slug), t.slug).toBe(false)
  })
  it('derives used-by from prereqs', () => {
    expect(usedBy('softmax').map((t) => t.slug)).toEqual(['cfg', 'ldm'])
    expect(usedBy('ldm')).toEqual([])
  })
})
