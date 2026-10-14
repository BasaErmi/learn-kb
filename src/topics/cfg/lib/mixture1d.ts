import { logSumExp } from './math'

/** 第 2 步“磁铁”例子：x_t = x_0 + σ·ε，x_0 取自若干个点 */
const uniform = (n: number) => Array.from({ length: n }, () => 1 / n)

function logTerms(xt: number, centers: number[], sigma: number, weights: number[]): number[] {
  return centers.map((c, i) => Math.log(weights[i]) - (xt - c) ** 2 / (2 * sigma ** 2))
}

export function mixturePosterior(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number[] {
  const logs = logTerms(xt, centers, sigma, weights)
  const lse = logSumExp(logs)
  return logs.map((l) => Math.exp(l - lse))
}

export function mixtureScore(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number {
  const post = mixturePosterior(xt, centers, sigma, weights)
  return post.reduce((acc, r, i) => acc + r * (-(xt - centers[i]) / sigma ** 2), 0)
}

export function mixtureLogDensity(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number {
  return logSumExp(logTerms(xt, centers, sigma, weights)) - Math.log(sigma * Math.sqrt(2 * Math.PI))
}
