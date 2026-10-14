import { describe, expect, it } from 'vitest'
import { sharpenCurve, sharpenWeights } from './sharpen'

describe('sharpenWeights', () => {
  it('reproduces the 75% / 90% / 98.8% table', () => {
    expect(sharpenWeights([0.9, 0.3], 1)[0]).toBeCloseTo(0.75, 3)
    expect(sharpenWeights([0.9, 0.3], 2)[0]).toBeCloseTo(0.9, 3)
    expect(sharpenWeights([0.9, 0.3], 4)[0]).toBeCloseTo(0.9878, 3)
  })
  it('s = 0 gives uniform weights', () => {
    const w = sharpenWeights([0.9, 0.3], 0)
    expect(w[0]).toBeCloseTo(0.5, 9)
    expect(w[1]).toBeCloseTo(0.5, 9)
  })
  it('stays finite for very large s', () => {
    const w = sharpenWeights([0.9, 0.3], 500)
    expect(w[0]).toBeCloseTo(1, 6)
    expect(Number.isFinite(w[1])).toBe(true)
  })
  it('handles zero probabilities', () => {
    expect(sharpenWeights([0, 1], 2)).toEqual([0, 1])
    expect(sharpenWeights([0, 1], 0)).toEqual([0.5, 0.5])
  })
})

describe('sharpenCurve', () => {
  const xs = Array.from({ length: 401 }, (_, i) => -4 + i * 0.02)
  const px = xs.map((x) => Math.exp(-(x * x) / 2))
  const pyx = xs.map((x) => 1 / (1 + Math.exp(-2 * x)))
  const trapz = (ys: number[]) => ys.slice(1).reduce((a, y, i) => a + ((y + ys[i]) / 2) * 0.02, 0)
  const mean = (ys: number[]) => trapz(ys.map((y, i) => y * xs[i]))
  it('integrates to 1 for any s', () => {
    for (const s of [0, 1, 4, 30]) expect(trapz(sharpenCurve(xs, px, pyx, s))).toBeCloseTo(1, 6)
  })
  it('moves mass toward high p(y|x) as s grows', () => {
    expect(mean(sharpenCurve(xs, px, pyx, 4))).toBeGreaterThan(mean(sharpenCurve(xs, px, pyx, 1)))
    expect(mean(sharpenCurve(xs, px, pyx, 1))).toBeGreaterThan(mean(sharpenCurve(xs, px, pyx, 0)))
  })
})
