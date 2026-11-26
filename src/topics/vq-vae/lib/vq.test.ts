import { describe, expect, it } from 'vitest'
import { assign, clusterMean, compressionRatio, nearest, perplexity, pullStep, quantError, quantize1d, runSte } from './vq'
import { PULL_CODES, PULL_ZS, QUANT_CODES, QUANT_Z0 } from './data'

describe('nearest / quantize', () => {
  it('picks the closest codeword', () => {
    expect(nearest([0.9, 0], [[0, 0], [1, 0], [2, 0]])).toBe(1)
    expect(nearest(QUANT_Z0, QUANT_CODES)).toBe(4)
  })
  it('1-D staircase has boundaries at 0.5 and 1.5', () => {
    expect([-1, 0.49, 0.51, 1.49, 1.51, 9].map(quantize1d)).toEqual([0, 0, 1, 1, 2, 2])
  })
})

describe('STE worked example', () => {
  it('0.8 → 1.3 → 1.8, then stops at z_q = 2', () => {
    const rows = runSte(0.8, 2, 0.25, 3, 'ste')
    expect(rows.map((r) => r.ze)).toEqual([0.8, 1.3, 1.8])
    expect(rows.map((r) => r.zq)).toEqual([1, 1, 2])
    expect(rows.map((r) => r.steGrad)).toEqual([-2, -2, 0])
    expect(rows[2].next).toBeCloseTo(1.8)
  })
  it('the true gradient never moves z_e', () => {
    const rows = runSte(0.8, 2, 0.25, 5, 'true')
    expect(rows.every((r) => r.ze === 0.8 && r.zq === 1)).toBe(true)
  })
})

describe('codebook loss and commitment', () => {
  const s0 = { codes: PULL_CODES, zs: PULL_ZS }
  it('assigns three clusters and leaves the far code dead', () => {
    expect(assign(s0)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2])
  })
  it('codebook-only steps converge to the cluster means (k-means centre update)', () => {
    let s = s0
    for (let i = 0; i < 60; i++) s = pullStep(s, { lr: 0.15, beta: 0.25, codebook: true, commit: false })
    for (const k of [0, 1, 2]) {
      const m = clusterMean(s, k)!
      expect(s.codes[k][0]).toBeCloseTo(m[0], 6)
      expect(s.codes[k][1]).toBeCloseTo(m[1], 6)
    }
    expect(s.codes[3]).toEqual(PULL_CODES[3])
    expect(s.zs).toEqual(PULL_ZS)
  })
  it('commitment moves only z_e, with step β times the codebook rate', () => {
    const s = pullStep(s0, { lr: 0.1, beta: 0.25, codebook: false, commit: true })
    expect(s.codes).toEqual(PULL_CODES)
    expect(s.zs[0][0]).toBeCloseTo(-1.9 - 0.1 * 2 * 0.25 * (-1.9 + 0.6))
  })
  it('with the reconstruction anchor, z_e settles at (z⁰ + β e)/(1 + β) instead of collapsing', () => {
    let s = s0
    for (let i = 0; i < 200; i++) s = pullStep(s, { lr: 0.15, beta: 0.25, codebook: true, commit: true, anchor: PULL_ZS })
    const e = s.codes[0], z0 = PULL_ZS[0]
    expect(s.zs[0][0]).toBeCloseTo((z0[0] + 0.25 * e[0]) / 1.25, 6)
    expect(quantError(s)).toBeGreaterThan(0.1)
  })
  it('both terms reduce the quantisation error', () => {
    const s = pullStep(s0, { lr: 0.15, beta: 0.25, codebook: true, commit: true })
    expect(quantError(s)).toBeLessThan(quantError(s0))
  })
})

describe('misc', () => {
  it('perplexity is K for uniform use and 1 for a single code', () => {
    expect(perplexity([5, 5, 5, 5])).toBeCloseTo(4)
    expect(perplexity([9, 0, 0, 0])).toBeCloseTo(1)
    expect(perplexity([0, 0])).toBe(0)
  })
  it('ImageNet 128×128 → 32×32, K = 512 compresses about 42.7×', () => {
    expect(compressionRatio(128, 128, 3, 32, 32, 512)).toBeCloseTo(42.67, 2)
  })
})

import { polygonArea, voronoiCells } from './voronoi'

describe('voronoi cells', () => {
  it('tile the box and contain their own codeword', () => {
    const cells = voronoiCells(QUANT_CODES, 3)
    const total = cells.reduce((s, c) => s + polygonArea(c), 0)
    expect(total).toBeCloseTo(36, 6)
    // 每个区域的顶点重心离自己的码字最近
    cells.forEach((c, i) => {
      const g: [number, number] = [c.reduce((s, p) => s + p[0], 0) / c.length, c.reduce((s, p) => s + p[1], 0) / c.length]
      expect(nearest(g, QUANT_CODES)).toBe(i)
    })
  })
})

import { DEC_LIP, decGrad, decLoss, meanGap, steGap } from './vq'

describe('quantisation error as noise', () => {
  it('decGrad is the derivative of decLoss', () => {
    for (const z of [0.1, 0.9, 1.7, 2.6]) expect(decGrad(z)).toBeCloseTo((decLoss(z + 1e-6) - decLoss(z - 1e-6)) / 2e-6, 5)
  })
  it('the STE gap obeys the Lipschitz bound |gap| ≤ 6|ε|', () => {
    for (const d of [1, 0.5, 0.25]) for (let z = 0; z <= 3; z += 0.013) {
      const g = steGap(z, d)
      expect(Math.abs(g.gap)).toBeLessThanOrEqual(DEC_LIP * Math.abs(g.eps) + 1e-9)
    }
  })
  it('a finer codebook shrinks the average gap', () => {
    const [a, b, c] = [1, 0.5, 0.25].map((d) => meanGap(d))
    expect(a).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(c)
  })
})
