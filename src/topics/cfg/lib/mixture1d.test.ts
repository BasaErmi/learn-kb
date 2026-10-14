import { describe, expect, it } from 'vitest'
import { mixtureLogDensity, mixturePosterior, mixtureScore } from './mixture1d'

const C = [1, -1]
describe('mixture1d', () => {
  it('posterior at x_t = 1.5 is 95.3% / 4.7%', () => {
    const p = mixturePosterior(1.5, C, 1)
    expect(p[0]).toBeCloseTo(0.953, 3)
    expect(p[1]).toBeCloseTo(0.047, 3)
  })
  it('score at x_t = 1.5 is −0.595', () => {
    expect(mixtureScore(1.5, C, 1)).toBeCloseTo(-0.595, 3)
  })
  it('score equals the numerical derivative of the log density', () => {
    for (const [x, s] of [[1.5, 1], [0.2, 0.5], [-2, 1.7]] as const) {
      const h = 1e-5
      const num = (mixtureLogDensity(x + h, C, s) - mixtureLogDensity(x - h, C, s)) / (2 * h)
      expect(mixtureScore(x, C, s)).toBeCloseTo(num, 5)
    }
  })
  it('stays finite far from the data', () => {
    const p = mixturePosterior(60, C, 0.3)
    expect(p[0]).toBeCloseTo(1, 9)
    expect(Number.isFinite(mixtureScore(60, C, 0.3))).toBe(true)
  })
})
