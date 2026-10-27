import { describe, expect, it } from 'vitest'
import {
  P0, Q0, bceGrad, bceLoss, crossEntropy, entropy, gdTrajectory, info, kl, mseGrad, mseLoss, setProb, sigmoid, stepsToReach,
} from './crossEntropy'

const sum = (v: number[]) => v.reduce((a, x) => a + x, 0)
const numGrad = (f: (z: number) => number, z: number, h = 1e-5) => (f(z + h) - f(z - h)) / (2 * h)

describe('信息量与熵', () => {
  it('reproduces the step-1 table (bits)', () => {
    expect(info(1, 2)).toBe(0)
    expect(info(0.5, 2)).toBeCloseTo(1, 12)
    expect(+info(0.01, 2).toFixed(2)).toBe(6.64)
  })
  it('information of independent events adds up', () => {
    expect(info(0.5 * 0.01)).toBeCloseTo(info(0.5) + info(0.01), 12)
  })
  it('entropy is ln K for uniform and 0 for one-hot', () => {
    expect(entropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(Math.log(4), 12)
    expect(entropy([0, 1, 0, 0])).toBe(0)
  })
})

describe('交叉熵与 KL', () => {
  it('H(P,Q) = H(P) + KL(P‖Q), KL ≥ 0, equality iff Q = P', () => {
    expect(crossEntropy(P0, Q0)).toBeCloseTo(entropy(P0) + kl(P0, Q0), 12)
    expect(kl(P0, Q0)).toBeGreaterThan(0)
    expect(kl(P0, P0)).toBeCloseTo(0, 12)
    expect(crossEntropy(P0, P0)).toBeCloseTo(entropy(P0), 12)
  })
  it('is not symmetric', () => {
    expect(Math.abs(crossEntropy(P0, Q0) - crossEntropy(Q0, P0))).toBeGreaterThan(0.01)
  })
  it('Q_i = 0 where P_i > 0 gives infinity', () => {
    expect(crossEntropy([0.5, 0.5], [1, 0])).toBe(Infinity)
  })
  it('with one-hot P it is −log Q_c (step-3 numbers)', () => {
    expect(+crossEntropy([0, 1, 0], [0.7, 0.2, 0.1]).toFixed(2)).toBe(1.61)
    expect(+(-Math.log(0.9)).toFixed(3)).toBe(0.105)
    expect(+(-Math.log(0.01)).toFixed(2)).toBe(4.61)
    expect(crossEntropy([0, 1, 0], [0.7, 0.2, 0.1])).toBeCloseTo(kl([0, 1, 0], [0.7, 0.2, 0.1]), 12)
  })
})

describe('setProb', () => {
  it('keeps the sum at 1 and respects the lower bound', () => {
    for (const v of [0, 0.3, 0.9, 1, 1.5, -1]) {
      const P = setProb(P0, 1, v, 0.01)
      expect(sum(P)).toBeCloseTo(1, 12)
      P.forEach((p) => expect(p).toBeGreaterThanOrEqual(0.01 - 1e-12))
    }
    setProb([1, 0, 0, 0], 0, 0.4).forEach((v, i) => expect(v).toBeCloseTo([0.4, 0.2, 0.2, 0.2][i], 12))
  })
  it('splits the rest in the old proportions', () => {
    const P = setProb(P0, 0, 0.2)
    expect(P[1] / P[2]).toBeCloseTo(0.25 / 0.15, 12)
  })
})

describe('MSE 与交叉熵的梯度', () => {
  it('analytic gradients match numeric gradients', () => {
    for (const z of [-6, -1, 0, 2.5]) for (const y of [0, 1]) {
      expect(mseGrad(z, y)).toBeCloseTo(numGrad((t) => mseLoss(t, y), z), 8)
      expect(bceGrad(z, y)).toBeCloseTo(numGrad((t) => bceLoss(t, y), z), 8)
    }
  })
  it('MSE gradient vanishes when badly wrong, CE does not', () => {
    expect(Math.abs(mseGrad(-6, 1))).toBeLessThan(0.003)
    expect(Math.abs(bceGrad(-6, 1))).toBeGreaterThan(0.99)
  })
  it('bceLoss stays finite far out', () => {
    expect(Number.isFinite(bceLoss(-800, 1))).toBe(true)
    expect(bceLoss(-800, 1)).toBeCloseTo(800, 6)
  })
  it('trajectory', () => {
    const ce = gdTrajectory(bceGrad, -6, 1, 1, 200)
    const mse = gdTrajectory(mseGrad, -6, 1, 1, 200)
    expect(ce[0]).toBeCloseTo(sigmoid(-6), 12)
    expect(stepsToReach(ce, 0.9)).toBeGreaterThan(0)
    expect(stepsToReach(ce, 0.9)).toBeLessThan(stepsToReach(mse, 0.9) === -1 ? Infinity : stepsToReach(mse, 0.9))
  })
})
