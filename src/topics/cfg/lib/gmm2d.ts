import { logSumExp } from './math'
import { gaussian } from './prng'

export type Vec2 = [number, number]
export interface Comp2D { mean: Vec2; std: number; weight: number; label: number }

/** 加噪到 ᾱ 时，每个高斯分量变成 N(√ᾱ·μ, (ᾱσ² + 1 − ᾱ) I)，所以 p_t 与它的 score 都有解析式 */
function noised(c: Comp2D, ab: number) {
  const a = Math.sqrt(ab)
  return { mu: [a * c.mean[0], a * c.mean[1]] as Vec2, v: ab * c.std ** 2 + (1 - ab) }
}

function logTerms(x: Vec2, comps: Comp2D[], ab: number): number[] {
  return comps.map((c) => {
    const { mu, v } = noised(c, ab)
    const d2 = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2
    return Math.log(c.weight) - d2 / (2 * v) - Math.log(2 * Math.PI * v)
  })
}

export function responsibilities(x: Vec2, comps: Comp2D[], ab: number): number[] {
  const logs = logTerms(x, comps, ab)
  const lse = logSumExp(logs)
  return logs.map((l) => Math.exp(l - lse))
}

export function noisedLogDensity(x: Vec2, comps: Comp2D[], ab: number): number {
  return logSumExp(logTerms(x, comps, ab))
}

export function noisedScore(x: Vec2, comps: Comp2D[], ab: number): Vec2 {
  const r = responsibilities(x, comps, ab)
  let sx = 0, sy = 0
  comps.forEach((c, i) => {
    const { mu, v } = noised(c, ab)
    sx += r[i] * (-(x[0] - mu[0]) / v)
    sy += r[i] * (-(x[1] - mu[1]) / v)
  })
  return [sx, sy]
}

/** 第 2 步的换算关系：ε = −√(1−ᾱ) · score */
export function epsilon(x: Vec2, comps: Comp2D[], ab: number): Vec2 {
  const s = noisedScore(x, comps, ab)
  const c = Math.sqrt(1 - ab)
  return [-c * s[0], -c * s[1]]
}

export function classComps(comps: Comp2D[], label: number): Comp2D[] {
  const sel = comps.filter((c) => c.label === label)
  const z = sel.reduce((a, c) => a + c.weight, 0)
  return sel.map((c) => ({ ...c, weight: c.weight / z }))
}

export function sampleData(comps: Comp2D[], n: number, rand: () => number): { x: Vec2; label: number }[] {
  const total = comps.reduce((a, c) => a + c.weight, 0)
  return Array.from({ length: n }, () => {
    let u = rand() * total, k = 0
    while (k < comps.length - 1 && u > comps[k].weight) { u -= comps[k].weight; k++ }
    const c = comps[k]
    return { x: [c.mean[0] + c.std * gaussian(rand), c.mean[1] + c.std * gaussian(rand)] as Vec2, label: c.label }
  })
}
