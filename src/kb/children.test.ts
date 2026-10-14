import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { meaningfulChildren } from './children'

describe('meaningfulChildren', () => {
  it('drops whitespace-only strings and keeps elements', () => {
    const kids = ['\n', createElement('p', { key: 'a' }, 'x'), '  ', 'text']
    const out = meaningfulChildren(kids)
    expect(out).toHaveLength(2)
    expect(out[1]).toBe('text')
  })
})
