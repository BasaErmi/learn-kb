import { describe, expect, it } from 'vitest'
import { classifierGradStrength } from './toy1d'

describe('classifierGradStrength', () => {
  it('is small at both ends and peaks in the middle', () => {
    const mid = Math.max(...[0.3, 0.4, 0.5, 0.6, 0.7].map((t) => classifierGradStrength(t)))
    expect(classifierGradStrength(0.02)).toBeLessThan(mid / 3)
    expect(classifierGradStrength(0.99)).toBeLessThan(mid / 3)
  })
  it('is finite and non-negative on [0, 1]', () => {
    for (let i = 0; i <= 50; i++) {
      const g = classifierGradStrength(i / 50)
      expect(Number.isFinite(g) && g >= 0).toBe(true)
    }
  })
})
