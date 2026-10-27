import { gaussian, mulberry32 } from '@/topics/cfg/lib/prng'

/** 正文和演示共用的 5 类 logits（猫、狗、狐狸、兔子、汽车） */
export const Z5 = [2, 1, 0.5, -0.5, -1.5]
/** 第 4、5 步的 3 类例子：取 z = log(7, 2, 1)，softmax 正好是 (0.7, 0.2, 0.1) */
export const Z3 = [Math.log(7), Math.log(2), 0]

export function logSumExp(z: readonly number[]): number {
  const m = Math.max(...z)
  if (m === -Infinity) return -Infinity
  return m + Math.log(z.reduce((a, v) => a + Math.exp(v - m), 0))
}

/** 数值稳定的 softmax（先减最大值）；T 是温度 */
export function softmax(z: readonly number[], T = 1): number[] {
  const m = Math.max(...z)
  const e = z.map((v) => Math.exp((v - m) / T))
  const s = e.reduce((a, v) => a + v, 0)
  return e.map((v) => v / s)
}

/** log p_i = z_i - LSE(z)，不经过 p，避免 log 0 */
export function logSoftmax(z: readonly number[]): number[] {
  const l = logSumExp(z)
  return z.map((v) => v - l)
}

/** 熵（nats），p_i = 0 的项按 0 计 */
export function entropy(p: readonly number[]): number {
  return -p.reduce((a, v) => (v > 0 ? a + v * Math.log(v) : a), 0)
}

/** J_ij = ∂p_i/∂z_j = p_i(δ_ij - p_j)，即 diag(p) - pp^T */
export function jacobian(p: readonly number[]): number[][] {
  return p.map((pi, i) => p.map((pj, j) => pi * ((i === j ? 1 : 0) - pj)))
}

/** 中心差分求 ∂p_i/∂z_j，用来独立核对 jacobian */
export function numericJacobian(z: readonly number[], h = 1e-5): number[][] {
  const cols = z.map((_, j) => {
    const up = softmax(z.map((v, k) => (k === j ? v + h : v)))
    const dn = softmax(z.map((v, k) => (k === j ? v - h : v)))
    return up.map((u, i) => (u - dn[i]) / (2 * h))
  })
  return z.map((_, i) => cols.map((c) => c[i]))
}

export function frobenius(m: readonly number[][]): number {
  return Math.sqrt(m.reduce((a, row) => a + row.reduce((b, v) => b + v * v, 0), 0))
}

export function norm(v: readonly number[]): number {
  return Math.sqrt(v.reduce((a, x) => a + x * x, 0))
}

export function oneHot(k: number, K: number): number[] {
  return Array.from({ length: K }, (_, i) => (i === k ? 1 : 0))
}

/** 交叉熵 L = -log p_y = LSE(z) - z_y */
export function crossEntropy(z: readonly number[], y: number): number {
  return logSumExp(z) - z[y]
}

/** ∂L/∂z = p - y */
export function ceGrad(z: readonly number[], y: number): number[] {
  return softmax(z).map((p, i) => p - (i === y ? 1 : 0))
}

/** 梯度下降一步：z ← z - η(p - y) */
export function gdStep(z: readonly number[], y: number, eta: number): number[] {
  const g = ceGrad(z, y)
  return z.map((v, i) => v - eta * g[i])
}

/** float32 的上溢阈值：e^x 超过它就变成 inf */
export const F32_EXP_MAX = Math.log(3.4028234663852886e38)

/**
 * 用 Math.fround 模拟 float32 逐步计算 softmax。
 * stable = false：直接算 e^{z_i}；stable = true：先减最大值。返回中间量，供演示逐项显示。
 */
export function softmax32(z: readonly number[], stable: boolean): { e: number[]; S: number; p: number[] } {
  const f = Math.fround
  const m = stable ? Math.max(...z) : 0
  const e = z.map((v) => f(Math.exp(f(f(v) - f(m)))))
  const S = e.reduce((a, v) => f(a + v), 0)
  return { e, S, p: e.map((v) => f(v / S)) }
}

/** 按分布 p 抽 n 次，返回每类抽到的次数 */
export function sampleCounts(p: readonly number[], n: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const counts = p.map(() => 0)
  for (let k = 0; k < n; k++) {
    const u = rand()
    let acc = 0, i = 0
    for (; i < p.length - 1; i++) { acc += p[i]; if (u < acc) break }
    counts[i]++
  }
  return counts
}

export interface AttnMode {
  /** 各个 query 的最大注意力权重的平均 */
  meanMaxW: number
  /** 各个 query 的 softmax Jacobian 的 Frobenius 范数的平均 */
  meanJ: number
  /** 第一个 query 对各个 key 的注意力权重，用来画柱状图 */
  first: number[]
}

/**
 * 注意力分数的模拟：q、k 各分量独立取自 N(0, 1)，每个 query 对 nKeys 个 key 做 softmax。
 * 同一批向量分别算“不缩放”和“除以 √d_k”两种情况；scoreVar 是所有点积 q·k（未缩放）的样本方差。
 */
export function attentionSim(dk: number, nKeys = 16, nQueries = 64, seed = 7): { scoreVar: number; raw: AttnMode; scaled: AttnMode } {
  const rand = mulberry32(seed * 1000 + dk)
  const vec = () => Array.from({ length: dk }, () => gaussian(rand))
  const acc = () => ({ maxW: 0, j: 0, first: [] as number[] })
  const raw = acc(), scaled = acc()
  let sum = 0, sum2 = 0
  for (let q = 0; q < nQueries; q++) {
    const qv = vec()
    const s = Array.from({ length: nKeys }, () => {
      const kv = vec()
      return qv.reduce((a, v, i) => a + v * kv[i], 0)
    })
    for (const v of s) { sum += v; sum2 += v * v }
    for (const [m, scores] of [[raw, s], [scaled, s.map((v) => v / Math.sqrt(dk))]] as const) {
      const p = softmax(scores)
      if (q === 0) m.first = p
      m.maxW += Math.max(...p)
      m.j += frobenius(jacobian(p))
    }
  }
  const n = nKeys * nQueries, mean = sum / n
  const out = (m: ReturnType<typeof acc>): AttnMode => ({ meanMaxW: m.maxW / nQueries, meanJ: m.j / nQueries, first: m.first })
  return { scoreVar: sum2 / n - mean * mean, raw: out(raw), scaled: out(scaled) }
}
