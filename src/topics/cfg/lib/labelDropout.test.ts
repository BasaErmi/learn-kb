import { describe, expect, it } from 'vitest'
import { dropLabels } from './labelDropout'
import { mulberry32 } from './prng'

describe('dropLabels', () => {
  const labels = Array.from({ length: 10000 }, (_, i) => i % 7)
  it('p = 0 keeps all, p = 1 drops all', () => {
    expect(dropLabels(labels, 0, mulberry32(1)).every((l) => l !== null)).toBe(true)
    expect(dropLabels(labels, 1, mulberry32(1)).every((l) => l === null)).toBe(true)
  })
  it('p = 0.1 drops ≈ 10%', () => {
    const out = dropLabels(labels, 0.1, mulberry32(2))
    const frac = out.filter((l) => l === null).length / out.length
    expect(Math.abs(frac - 0.1)).toBeLessThan(0.015)
  })
})
