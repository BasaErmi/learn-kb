import { logSumExp } from './math'

/**
 * 第 2 步“磁铁”例子（二维）：x_0 等概率取自若干个点，
 * x_t = √ᾱ_t·x_0 + √(1−ᾱ_t)·ε，即 q(x_t | x_0) = N(√ᾱ_t·x_0, (1−ᾱ_t)I)
 */
export type Pt = [number, number]

const logTerms = (xt: Pt, pts: Pt[], ab: number) => {
  const r = Math.sqrt(ab), v = 1 - ab
  return pts.map(([a, b]) => -((xt[0] - r * a) ** 2 + (xt[1] - r * b) ** 2) / (2 * v))
}

/** 后验 q(x_0 | x_t)：每个来源的权重 */
export function magnetPosterior(xt: Pt, pts: Pt[], ab: number): number[] {
  const logs = logTerms(xt, pts, ab)
  const lse = logSumExp(logs)
  return logs.map((l) => Math.exp(l - lse))
}

/** 这个来源对应的噪声：ε = (x_t − √ᾱ_t·x_0) / √(1−ᾱ_t) */
export const magnetEps = (xt: Pt, p: Pt, ab: number): Pt => {
  const r = Math.sqrt(ab), s = Math.sqrt(1 - ab)
  return [(xt[0] - r * p[0]) / s, (xt[1] - r * p[1]) / s]
}

/** 单个来源的拉力（单样本 score）：∇ log q(x_t | x_0) = −ε / √(1−ᾱ_t) */
export const magnetPull = (xt: Pt, p: Pt, ab: number): Pt => {
  const e = magnetEps(xt, p, ab), s = Math.sqrt(1 - ab)
  return [-e[0] / s, -e[1] / s]
}

/** score = 按后验加权的拉力平均 */
export function magnetScore(xt: Pt, pts: Pt[], ab: number): Pt {
  const w = magnetPosterior(xt, pts, ab)
  return pts.reduce<Pt>((acc, p, i) => {
    const f = magnetPull(xt, p, ab)
    return [acc[0] + w[i] * f[0], acc[1] + w[i] * f[1]]
  }, [0, 0])
}

/** log p_t(x_t)：等权高斯混合 */
export function magnetLogDensity(xt: Pt, pts: Pt[], ab: number): number {
  return logSumExp(logTerms(xt, pts, ab)) - Math.log(pts.length * 2 * Math.PI * (1 - ab))
}
