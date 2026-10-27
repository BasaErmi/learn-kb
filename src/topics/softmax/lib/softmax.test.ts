import { describe, expect, it } from 'vitest'
import {
  F32_EXP_MAX, Z3, Z5, ceGrad, crossEntropy, entropy, frobenius, gdStep, jacobian, logSoftmax,
  logSumExp, norm, numericJacobian, oneHot, sampleCounts, softmax, softmax32,
} from './softmax'

const sum = (v: number[]) => v.reduce((a, x) => a + x, 0)

describe('softmax', () => {
  it('reproduces the step-1 example', () => {
    const p = softmax(Z5)
    expect(p.map((v) => +v.toFixed(3))).toEqual([0.587, 0.216, 0.131, 0.048, 0.018])
    expect(sum(Z5.map(Math.exp))).toBeCloseTo(12.586, 3)
    expect(sum(p)).toBeCloseTo(1, 12)
  })
  it('Z3 gives exactly (0.7, 0.2, 0.1)', () => {
    softmax(Z3).forEach((v, i) => expect(v).toBeCloseTo([0.7, 0.2, 0.1][i], 12))
  })
  it('is invariant to adding a constant', () => {
    const p = softmax(Z5)
    for (const c of [-500, -3, 7, 900]) softmax(Z5.map((v) => v + c)).forEach((v, i) => expect(v).toBeCloseTo(p[i], 12))
  })
})

describe('temperature', () => {
  it('reproduces the step-2 table', () => {
    expect(+softmax(Z5, 0.5)[0].toFixed(3)).toBe(0.838)
    expect(+softmax(Z5, 2)[0].toFixed(3)).toBe(0.394)
    expect(+softmax(Z5, 10)[0].toFixed(3)).toBe(0.235)
    expect(+entropy(softmax(Z5)).toFixed(3)).toBe(1.128)
  })
  it('tends to argmax as T → 0 and to uniform as T → ∞', () => {
    softmax(Z5, 0.01).forEach((v, i) => expect(v).toBeCloseTo(i === 0 ? 1 : 0, 9))
    softmax(Z5, 1e6).forEach((v) => expect(v).toBeCloseTo(0.2, 5))
    expect(entropy(softmax(Z5, 1e6))).toBeCloseTo(Math.log(5), 6)
  })
  it('softmax is the gradient of log S (appendix B)', () => {
    const h = 1e-6
    const g = Z5.map((_, j) => (logSumExp(Z5.map((v, k) => (k === j ? v + h : v))) - logSumExp(Z5.map((v, k) => (k === j ? v - h : v)))) / (2 * h))
    softmax(Z5).forEach((p, i) => expect(g[i]).toBeCloseTo(p, 7))
  })
  it('sampling is reproducible and follows p', () => {
    expect(sampleCounts(softmax(Z5), 100, 3)).toEqual(sampleCounts(softmax(Z5), 100, 3))
    expect(sum(sampleCounts(softmax(Z5), 100, 3))).toBe(100)
    expect(sampleCounts(softmax(Z5, 0.05), 100, 3)).toEqual([100, 0, 0, 0, 0])
    const big = sampleCounts(softmax(Z5), 20000, 1)
    big.forEach((c, i) => expect(c / 20000).toBeCloseTo(softmax(Z5)[i], 1))
  })
})

describe('float32 stability', () => {
  it('naive overflows past the float32 exp limit, stable does not', () => {
    expect(F32_EXP_MAX).toBeCloseTo(88.7228, 4)
    const z = Z5.map((v) => v + 100)
    const naive = softmax32(z, false)
    expect(naive.e[0]).toBe(Infinity)
    expect(naive.p[0]).toBeNaN()
    softmax32(z, true).p.forEach((v, i) => expect(v).toBeCloseTo(softmax(Z5)[i], 5))
  })
  it('naive is fine just below the limit', () => {
    const p = softmax32(Z5.map((v) => v + 86), false).p
    p.forEach((v, i) => expect(v).toBeCloseTo(softmax(Z5)[i], 5))
  })
  it('naive underflows to 0 / 0 for very negative logits', () => {
    expect(softmax32(Z5.map((v) => v - 110), false).p.every(Number.isNaN)).toBe(true)
    expect(softmax32(Z5.map((v) => v - 110), true).p.every(Number.isFinite)).toBe(true)
  })
})

describe('jacobian', () => {
  it('matches diag(p) - pp^T at (0.7, 0.2, 0.1)', () => {
    const J = jacobian(softmax(Z3))
    const want = [[0.21, -0.14, -0.07], [-0.14, 0.16, -0.02], [-0.07, -0.02, 0.09]]
    J.forEach((r, i) => r.forEach((v, j) => expect(v).toBeCloseTo(want[i][j], 12)))
  })
  it('matches central differences', () => {
    for (const z of [Z3, Z5, [3, -2, 0.4, 1]]) {
      const J = jacobian(softmax(z)), N = numericJacobian(z)
      J.forEach((r, i) => r.forEach((v, j) => expect(N[i][j]).toBeCloseTo(v, 8)))
    }
  })
  it('rows sum to zero (shift invariance)', () => {
    for (const r of jacobian(softmax(Z5))) expect(sum(r)).toBeCloseTo(0, 12)
  })
  it('vanishes as the distribution saturates', () => {
    expect(frobenius(jacobian(softmax(Z5.map((v) => v * 0))))).toBeCloseTo(0.4, 10)
    expect(+frobenius(jacobian(softmax(Z5))).toFixed(3)).toBe(0.388)
    expect(frobenius(jacobian(softmax(Z5.map((v) => v * 8))))).toBeLessThan(1e-3)
  })
})

describe('cross-entropy', () => {
  it('reproduces p - y = (0.7, -0.8, 0.1)', () => {
    ceGrad(Z3, 1).forEach((v, i) => expect(v).toBeCloseTo([0.7, -0.8, 0.1][i], 12))
    expect(crossEntropy(Z3, 1)).toBeCloseTo(-Math.log(0.2), 12)
  })
  it('gradient matches central differences of the loss', () => {
    const h = 1e-6
    for (const y of [0, 1, 2]) {
      const g = ceGrad(Z3, y)
      Z3.forEach((_, j) => {
        const up = crossEntropy(Z3.map((v, k) => (k === j ? v + h : v)), y)
        const dn = crossEntropy(Z3.map((v, k) => (k === j ? v - h : v)), y)
        expect((up - dn) / (2 * h)).toBeCloseTo(g[j], 7)
      })
    }
  })
  it('one gradient step with η = 1 gives the step-5 numbers', () => {
    const z1 = gdStep(Z3, 1, 1)
    expect(z1.map((v) => +v.toFixed(3))).toEqual([1.246, 1.493, -0.1])
    expect(softmax(z1).map((v) => +v.toFixed(3))).toEqual([0.394, 0.504, 0.102])
    expect(+crossEntropy(z1, 1).toFixed(3)).toBe(0.685)
  })
  it('log-softmax stays finite where log(p) would be -inf', () => {
    const z = [0, -2000]
    expect(Math.log(softmax(z)[1])).toBe(-Infinity)
    expect(logSoftmax(z)[1]).toBeCloseTo(-2000, 9)
  })
  it('confidently wrong keeps a large gradient, confidently right does not', () => {
    const z = Z5.map((v) => v * 8)
    expect(norm(ceGrad(z, 2))).toBeCloseTo(Math.SQRT2, 3)
    expect(norm(ceGrad(z, 0))).toBeLessThan(1e-3)
    expect(oneHot(2, 4)).toEqual([0, 0, 1, 0])
  })
})

describe('step 5: absolute differences decide saturation', () => {
  it('(1002, 980) is nearly one-hot, (1.002, 0.980) nearly uniform', () => {
    const hard = softmax([1002, 980]), soft = softmax([1.002, 0.98])
    expect(1 - hard[0]).toBeCloseTo(2.8e-10, 11)
    softmax([22, 0]).forEach((v, i) => expect(v).toBeCloseTo(hard[i], 12))
    expect(soft.map((v) => +v.toFixed(3))).toEqual([0.505, 0.495])
    expect(jacobian(hard)[0][0]).toBeCloseTo(2.8e-10, 11)
    expect(jacobian(soft)[0][0]).toBeCloseTo(0.25, 4)
  })
  it('reproduces the quiz Jacobian for p = (0.98, 0.01, 0.01)', () => {
    const J = jacobian([0.98, 0.01, 0.01])
    expect(J.map((r, i) => +r[i].toFixed(4))).toEqual([0.0196, 0.0099, 0.0099])
    expect(+J[0][1].toFixed(4)).toBe(-0.0098)
    expect(+J[1][2].toFixed(4)).toBe(-0.0001)
  })
})
