/** VQ-VAE 专题里演示用到的计算：最近邻量化、STE 的一维例子、码本损失与 commitment 的梯度步、困惑度 */

export type Pt = [number, number]

export const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)

/** 最近码字的编号：k = argmin_j ||z - e_j||²（距离相同时取编号小的） */
export function nearest(z: number[], codes: number[][]): number {
  let best = 0, bd = Infinity
  codes.forEach((e, j) => {
    const d = dist2(z, e)
    if (d < bd) { bd = d; best = j }
  })
  return best
}

// ---------- 第 3 步：一维 STE 例子 ----------

/** 一维码本 {0, 1, 2} 的量化：最近的整数，截到 [0, 2] */
export const CODES_1D = [0, 1, 2]
export const quantize1d = (z: number) => CODES_1D[nearest([z], CODES_1D.map((c) => [c]))]

export interface SteRow { step: number; ze: number; zq: number; dLdzq: number; trueGrad: number; steGrad: number; next: number }

/**
 * 解码器想要 z_q = target，损失 L = (z_q − target)²，学习率 lr，从 z0 出发跑 steps 步。
 * mode = 'ste'：编码器收到 ∂L/∂z_q；mode = 'true'：真实梯度 ∂L/∂z_q · dz_q/dz_e = 0
 */
export function runSte(z0: number, target: number, lr: number, steps: number, mode: 'ste' | 'true'): SteRow[] {
  const rows: SteRow[] = []
  let ze = z0
  for (let s = 1; s <= steps; s++) {
    const zq = quantize1d(ze)
    const dLdzq = 2 * (zq - target)
    const steGrad = dLdzq
    const g = mode === 'ste' ? steGrad : 0
    const next = ze - lr * g
    rows.push({ step: s, ze, zq, dLdzq, trueGrad: 0, steGrad, next })
    ze = next
  }
  return rows
}

// ---------- 第 4 步：码本损失与 commitment ----------

export interface PullState { codes: Pt[]; zs: Pt[] }

/** 每个 z_e 分到最近的码字 */
export const assign = (s: PullState) => s.zs.map((z) => nearest(z, s.codes))

/** 平均量化误差 mean ||z_e − e_k||² */
export function quantError(s: PullState): number {
  const a = assign(s)
  return s.zs.reduce((t, z, i) => t + dist2(z, s.codes[a[i]]), 0) / s.zs.length
}

/**
 * 一步梯度下降（演示里两项都按“每个码字 / 每个样本”平均，权重之比就是 1 : β）：
 *   ② 码本损失 ||sg[z_e] − e_k||²：只动码字，梯度 2(e_k − 均值_k)，均值取分给 k 的那些 z_e
 *   ③ commitment β||z_e − sg[e_k]||²：只动 z_e，梯度 2β(z_e − e_k)
 *   重建损失用 ||z_e − z_e⁰||² 代替：把 z_e 拉回重建最需要的位置 z_e⁰，梯度 2(z_e − z_e⁰)
 * 没分到样本的码字不动（死码字）
 */
export function pullStep(s: PullState, opts: { lr: number; beta: number; codebook: boolean; commit: boolean; anchor?: Pt[] }): PullState {
  const a = assign(s)
  const codes = s.codes.map((e, k): Pt => {
    const m = clusterMean(s, k)
    if (!opts.codebook || !m) return e
    return [e[0] - opts.lr * 2 * (e[0] - m[0]), e[1] - opts.lr * 2 * (e[1] - m[1])]
  })
  const zs = s.zs.map((z, i): Pt => {
    const e = s.codes[a[i]]
    const z0 = opts.anchor?.[i]
    const g = [0, 1].map((d) => (opts.commit ? 2 * opts.beta * (z[d] - e[d]) : 0) + (z0 ? 2 * (z[d] - z0[d]) : 0))
    return [z[0] - opts.lr * g[0], z[1] - opts.lr * g[1]]
  })
  return { codes, zs }
}

/** 分给码字 k 的 z_e 的均值（码本损失的最优解）；没有样本时返回 null */
export function clusterMean(s: PullState, k: number): Pt | null {
  const a = assign(s)
  const mine = s.zs.filter((_, i) => a[i] === k)
  if (!mine.length) return null
  return [mine.reduce((t, z) => t + z[0], 0) / mine.length, mine.reduce((t, z) => t + z[1], 0) / mine.length]
}

// ---------- 第 7 步：码本使用情况 ----------

/** 困惑度 exp(−Σ p̄_k log p̄_k)；均匀使用时为 K，只用一个时为 1 */
export function perplexity(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0)
  if (n === 0) return 0
  let h = 0
  for (const c of counts) if (c > 0) { const p = c / n; h -= p * Math.log(p) }
  return Math.exp(h)
}

/** 压缩比：原图比特数 / 索引网格比特数 */
export const compressionRatio = (h: number, w: number, c: number, hq: number, wq: number, K: number) => (h * w * c * 8) / (hq * wq * Math.log2(K))

// ---------- 第 3 步：把量化误差当噪声 ----------

/** 示意用的一维“解码器损失”：L(z) = (z − 1.6)² + 0.25 sin 4z，二阶导 |L''| ≤ 6 */
export const decLoss = (z: number) => (z - 1.6) ** 2 + 0.25 * Math.sin(4 * z)
export const decGrad = (z: number) => 2 * (z - 1.6) + Math.cos(4 * z)
export const DEC_LIP = 6

/** 间距为 delta 的一维码本（0, ±delta, ±2delta, …）上的最近码字 */
export const quantizeGrid = (z: number, delta: number) => Math.round(z / delta) * delta

/** 某个 z_e 处：量化误差 ε、直线（理想）梯度 L'(z_e)、STE 梯度 L'(z_q) 及两者之差 */
export function steGap(ze: number, delta: number) {
  const zq = quantizeGrid(ze, delta)
  const eps = zq - ze
  const ideal = decGrad(ze), ste = decGrad(zq)
  return { zq, eps, ideal, ste, gap: ste - ideal }
}

/** z_e 在 [a, b] 上均匀取点时 |STE 梯度 − 理想梯度| 的平均 */
export function meanGap(delta: number, a = 0, b = 3, n = 3000) {
  let t = 0
  for (let i = 0; i < n; i++) t += Math.abs(steGap(a + ((i + 0.5) * (b - a)) / n, delta).gap)
  return t / n
}
