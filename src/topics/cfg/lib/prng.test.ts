import { describe, expect, it } from 'vitest'
import { gaussian, mulberry32 } from './prng'

describe('prng', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(5), b = mulberry32(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('uniform values lie in [0, 1)', () => {
    const r = mulberry32(1)
    for (let i = 0; i < 10000; i++) { const v = r(); expect(v >= 0 && v < 1).toBe(true) }
  })
  it('gaussian has mean ≈ 0 and variance ≈ 1', () => {
    const r = mulberry32(2), n = 40000
    const xs = Array.from({ length: n }, () => gaussian(r))
    const m = xs.reduce((a, b) => a + b, 0) / n
    const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / n
    expect(Math.abs(m)).toBeLessThan(0.03)
    expect(Math.abs(v - 1)).toBeLessThan(0.05)
  })
})
