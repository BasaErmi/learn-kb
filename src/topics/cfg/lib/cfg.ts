import { classComps, epsilon, type Comp2D, type Vec2 } from './gmm2d'
import { gaussian, mulberry32 } from './prng'
import { alphaBar, ddimTimes } from './schedule'

/** 第 4 步核心公式：ε̂ = ε∅ + s (ε_y − ε∅) */
export function cfgCombine(eU: Vec2, eC: Vec2, s: number): Vec2 {
  return [eU[0] + s * (eC[0] - eU[0]), eU[1] + s * (eC[1] - eU[1])]
}

export function predictX0(x: Vec2, eps: Vec2, ab: number): Vec2 {
  const a = Math.sqrt(ab), c = Math.sqrt(1 - ab)
  return [(x[0] - c * eps[0]) / a, (x[1] - c * eps[1]) / a]
}

/** 确定性 DDIM（η = 0） */
export function ddimStep(x: Vec2, eps: Vec2, ab: number, abPrev: number): Vec2 {
  const x0 = predictX0(x, eps, ab)
  const a = Math.sqrt(abPrev), c = Math.sqrt(1 - abPrev)
  return [a * x0[0] + c * eps[0], a * x0[1] + c * eps[1]]
}

export interface SampleOptions {
  comps: Comp2D[]
  label: number
  s: number
  n: number
  steps: number
  seed: number
  keepPaths?: number
}
export interface SampleResult { samples: Vec2[]; paths: Vec2[][] }

/** 第 6 步的采样循环：每步算 ε_y 与 ε∅，用 CFG 组合，再交给原样的 DDIM 更新 */
export function sampleCFG(o: SampleOptions): SampleResult {
  const rand = mulberry32(o.seed)
  const cond = classComps(o.comps, o.label)
  const ts = ddimTimes(o.steps)
  const xs: Vec2[] = Array.from({ length: o.n }, () => [gaussian(rand), gaussian(rand)])
  const keep = Math.min(o.keepPaths ?? 0, o.n)
  const paths: Vec2[][] = xs.slice(0, keep).map((x) => [x])
  for (let i = 0; i < o.steps; i++) {
    const ab = alphaBar(ts[i]), abPrev = alphaBar(ts[i + 1])
    for (let k = 0; k < xs.length; k++) {
      const e = cfgCombine(epsilon(xs[k], o.comps, ab), epsilon(xs[k], cond, ab), o.s)
      xs[k] = ddimStep(xs[k], e, ab, abPrev)
      if (k < keep) paths[k].push(xs[k])
    }
  }
  return { samples: xs, paths }
}

/** 类内散度（到质心的平均距离）与“冲出数据范围”（离所有分量都超过 3σ）的比例 */
export function sampleStats(samples: Vec2[], comps: Comp2D[]): { spread: number; outsideFrac: number } {
  const n = samples.length
  const cx = samples.reduce((a, p) => a + p[0], 0) / n
  const cy = samples.reduce((a, p) => a + p[1], 0) / n
  const spread = samples.reduce((a, p) => a + Math.hypot(p[0] - cx, p[1] - cy), 0) / n
  const outside = samples.filter((p) =>
    comps.every((c) => Math.hypot(p[0] - c.mean[0], p[1] - c.mean[1]) > 3 * c.std),
  ).length
  return { spread, outsideFrac: outside / n }
}
