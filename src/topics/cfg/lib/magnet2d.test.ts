import { describe, expect, it } from 'vitest'
import { magnetEps, magnetLogDensity, magnetPosterior, magnetScore, type Pt } from './magnet2d'
import { alphaBar } from './schedule'

const P: Pt[] = [[-1.8, 1.2], [-1.2, 1.7], [-1.5, 0.5], [1.3, 1.4], [2.0, 0.6], [0.7, -1.6], [-0.3, -1.9]]
const AB = alphaBar(0.45)
describe('magnet2d', () => {
  it('default t = 0.45, x_t = (0.6, 0.3): D / E / F carry most weight', () => {
    const w = magnetPosterior([0.6, 0.3], P, AB)
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
    expect(w[3]).toBeCloseTo(0.457, 3)
    expect(w[4]).toBeCloseTo(0.391, 3)
    expect(w[5]).toBeCloseTo(0.074, 3)
    const s = magnetScore([0.6, 0.3], P, AB)
    expect(s[0]).toBeCloseTo(0.953, 3)
    expect(s[1]).toBeCloseTo(0.704, 3)
  })
  it('score equals the numerical gradient of the log density', () => {
    for (const [x, ab] of [[[0.6, 0.3], AB], [[-2, 2.5], 0.95], [[0.1, -0.3], 0.05]] as [Pt, number][]) {
      const h = 1e-5
      const s = magnetScore(x, P, ab)
      const gx = (magnetLogDensity([x[0] + h, x[1]], P, ab) - magnetLogDensity([x[0] - h, x[1]], P, ab)) / (2 * h)
      const gy = (magnetLogDensity([x[0], x[1] + h], P, ab) - magnetLogDensity([x[0], x[1] - h], P, ab)) / (2 * h)
      expect(s[0]).toBeCloseTo(gx, 5)
      expect(s[1]).toBeCloseTo(gy, 5)
    }
  })
  it('score = −E[ε | x_t] / √(1−ᾱ_t), and (1−ᾱ_t)·score points at √ᾱ_t·E[x_0 | x_t]', () => {
    const xt: Pt = [0.2, 0.2]
    const w = magnetPosterior(xt, P, AB)
    const eps = P.map((p) => magnetEps(xt, p, AB))
    const eBar = eps.reduce<Pt>((a, e, i) => [a[0] + w[i] * e[0], a[1] + w[i] * e[1]], [0, 0])
    const mean = P.reduce<Pt>((a, p, i) => [a[0] + w[i] * p[0], a[1] + w[i] * p[1]], [0, 0])
    const s = magnetScore(xt, P, AB)
    for (const k of [0, 1]) {
      expect(s[k]).toBeCloseTo(-eBar[k] / Math.sqrt(1 - AB), 12)
      expect(xt[k] + (1 - AB) * s[k]).toBeCloseTo(Math.sqrt(AB) * mean[k], 12)
    }
  })
  it('stays finite far from the data and at tiny noise', () => {
    for (const ab of [0.999, 1e-4]) {
      expect(magnetPosterior([60, -60], P, ab).every(Number.isFinite)).toBe(true)
      expect(magnetScore([60, -60], P, ab).every(Number.isFinite)).toBe(true)
    }
  })
})
