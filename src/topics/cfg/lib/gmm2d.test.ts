import { describe, expect, it } from 'vitest'
import { classComps, epsilon, noisedLogDensity, noisedScore, sampleData, type Comp2D } from './gmm2d'
import { ALPHA_BAR_MIN } from './schedule'
import { mulberry32 } from './prng'

const comps: Comp2D[] = [
  { mean: [2, 0], std: 0.3, weight: 0.25, label: 0 },
  { mean: [1, 1], std: 0.5, weight: 0.25, label: 0 },
  { mean: [-2, 0], std: 0.3, weight: 0.5, label: 1 },
]

describe('gmm2d', () => {
  it('score equals the numerical gradient of the log density', () => {
    for (const ab of [0.9, 0.4, 0.05]) {
      const x: [number, number] = [0.3, -0.7]
      const h = 1e-5
      const gx = (noisedLogDensity([x[0] + h, x[1]], comps, ab) - noisedLogDensity([x[0] - h, x[1]], comps, ab)) / (2 * h)
      const gy = (noisedLogDensity([x[0], x[1] + h], comps, ab) - noisedLogDensity([x[0], x[1] - h], comps, ab)) / (2 * h)
      const s = noisedScore(x, comps, ab)
      expect(s[0]).toBeCloseTo(gx, 4)
      expect(s[1]).toBeCloseTo(gy, 4)
    }
  })
  it('epsilon = −sqrt(1 − ᾱ) · score', () => {
    const x: [number, number] = [0.5, 0.5], ab = 0.3
    const s = noisedScore(x, comps, ab), e = epsilon(x, comps, ab)
    expect(e[0]).toBeCloseTo(-Math.sqrt(1 - ab) * s[0], 12)
    expect(e[1]).toBeCloseTo(-Math.sqrt(1 - ab) * s[1], 12)
  })
  it('epsilon ≈ x_t when ᾱ → 0 (pure noise)', () => {
    const e = epsilon([0.5, -0.3], comps, ALPHA_BAR_MIN)
    expect(e[0]).toBeCloseTo(0.5, 1)
    expect(e[1]).toBeCloseTo(-0.3, 1)
  })
  it('classComps renormalises weights', () => {
    const c = classComps(comps, 0)
    expect(c).toHaveLength(2)
    expect(c[0].weight + c[1].weight).toBeCloseTo(1, 12)
  })
  it('is finite far from data', () => {
    const s = noisedScore([80, -80], comps, 0.999)
    expect(Number.isFinite(s[0]) && Number.isFinite(s[1])).toBe(true)
  })
  it('sampleData respects weights', () => {
    const d = sampleData(comps, 4000, mulberry32(1))
    const frac1 = d.filter((p) => p.label === 1).length / d.length
    expect(Math.abs(frac1 - 0.5)).toBeLessThan(0.03)
  })
})
