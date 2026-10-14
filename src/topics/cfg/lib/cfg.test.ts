import { describe, expect, it } from 'vitest'
import { cfgCombine, predictX0, sampleCFG, sampleStats } from './cfg'
import type { Comp2D, Vec2 } from './gmm2d'

const two: Comp2D[] = [
  { mean: [2, 0], std: 0.3, weight: 0.5, label: 0 },
  { mean: [-2, 0], std: 0.3, weight: 0.5, label: 1 },
]
const meanOf = (xs: Vec2[], k: 0 | 1) => xs.reduce((a, p) => a + p[k], 0) / xs.length
const stdOf = (xs: Vec2[], k: 0 | 1) => { const m = meanOf(xs, k); return Math.sqrt(xs.reduce((a, p) => a + (p[k] - m) ** 2, 0) / xs.length) }

describe('cfgCombine', () => {
  const eU: Vec2 = [1, 2], eC: Vec2 = [3, 1]
  it('s = 0 → unconditional, s = 1 → conditional', () => {
    expect(cfgCombine(eU, eC, 0)).toEqual(eU)
    expect(cfgCombine(eU, eC, 1)).toEqual(eC)
  })
  it('extrapolates beyond ε_y when s > 1', () => {
    expect(cfgCombine(eU, eC, 3)).toEqual([7, -1])
  })
})

describe('predictX0 (第 6 步检验题)', () => {
  it('combining x̂0 equals x̂0 of the combined ε', () => {
    const x: Vec2 = [0.4, -1.2], ab = 0.37, s = 2.5
    const eU: Vec2 = [0.3, 0.1], eC: Vec2 = [-0.2, 0.9]
    const a = predictX0(x, eU, ab), b = predictX0(x, eC, ab)
    const viaX0: Vec2 = [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])]
    const viaEps = predictX0(x, cfgCombine(eU, eC, s), ab)
    expect(viaX0[0]).toBeCloseTo(viaEps[0], 12)
    expect(viaX0[1]).toBeCloseTo(viaEps[1], 12)
  })
})

describe('sampleCFG', () => {
  it('s = 1 recovers the class distribution', () => {
    const { samples } = sampleCFG({ comps: two, label: 0, s: 1, n: 2000, steps: 100, seed: 1 })
    expect(meanOf(samples, 0)).toBeCloseTo(2, 1)
    expect(Math.abs(meanOf(samples, 1))).toBeLessThan(0.05)
    expect(stdOf(samples, 0)).toBeGreaterThan(0.2)
    expect(stdOf(samples, 0)).toBeLessThan(0.4)
  })
  it('s = 0 ignores the label (≈ half on each side)', () => {
    const { samples } = sampleCFG({ comps: two, label: 0, s: 0, n: 2000, steps: 100, seed: 2 })
    const right = samples.filter((p) => p[0] > 0).length / samples.length
    expect(right).toBeGreaterThan(0.4)
    expect(right).toBeLessThan(0.6)
  })
  it('larger s pushes samples away from the other class', () => {
    const m1 = meanOf(sampleCFG({ comps: two, label: 0, s: 1, n: 1500, steps: 60, seed: 3 }).samples, 0)
    const m4 = meanOf(sampleCFG({ comps: two, label: 0, s: 4, n: 1500, steps: 60, seed: 3 }).samples, 0)
    expect(m4).toBeGreaterThan(m1 + 0.05)
  })
  it('stays finite for extreme s and is deterministic', () => {
    const a = sampleCFG({ comps: two, label: 1, s: 12, n: 300, steps: 40, seed: 9, keepPaths: 5 })
    const b = sampleCFG({ comps: two, label: 1, s: 12, n: 300, steps: 40, seed: 9, keepPaths: 5 })
    expect(a.samples.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))).toBe(true)
    expect(a.samples).toEqual(b.samples)
    expect(a.paths).toHaveLength(5)
    expect(a.paths[0]).toHaveLength(41)
  })
})

describe('sampleStats', () => {
  it('spread is 0 for identical points; outside counts far points', () => {
    expect(sampleStats([[2, 0], [2, 0]], two).spread).toBe(0)
    expect(sampleStats([[2, 0]], two).outsideFrac).toBe(0)
    expect(sampleStats([[9, 9]], two).outsideFrac).toBe(1)
  })
})
