/** 第 1、2 步共用的 4 类天气（晴、多云、雨、雪） */
export const WEATHER = ['晴', '多云', '雨', '雪']
/** 演示默认的真实分布 P 和模型分布 Q */
export const P0 = [0.5, 0.25, 0.15, 0.1]
export const Q0 = [0.05, 0.35, 0.3, 0.3]

/** 信息量 −log p；base = 2 时单位是 bit，默认自然对数（nat） */
export function info(p: number, base = Math.E): number {
  return -Math.log(p) / Math.log(base) + 0 // + 0 把 −0 变成 0
}

/** 熵 H(P) = −Σ P_i log P_i，约定 0 log 0 = 0 */
export function entropy(P: readonly number[]): number {
  return 0 - P.reduce((a, v) => (v > 0 ? a + v * Math.log(v) : a), 0)
}

/** 交叉熵 H(P, Q) = −Σ P_i log Q_i；P_i > 0 而 Q_i = 0 时为 +∞ */
export function crossEntropy(P: readonly number[], Q: readonly number[]): number {
  return -P.reduce((a, v, i) => (v > 0 ? a + v * Math.log(Q[i]) : a), 0)
}

/** KL 散度 D_KL(P‖Q) = Σ P_i log(P_i / Q_i)，直接按定义算，用来核对 H(P,Q) − H(P) */
export function kl(P: readonly number[], Q: readonly number[]): number {
  return P.reduce((a, v, i) => (v > 0 ? a + v * Math.log(v / Q[i]) : a), 0)
}

/**
 * 把第 i 类的概率改成 v，其余各类按原来高出下限 lo 的部分按比例分掉剩下的概率；
 * 其余都在下限上时平均分。v 限制在 [lo, 1 − (K−1)·lo]，结果总和恒为 1。
 */
export function setProb(P: readonly number[], i: number, v: number, lo = 0): number[] {
  const K = P.length
  const x = Math.max(lo, Math.min(1 - (K - 1) * lo, v))
  const free = 1 - x - (K - 1) * lo
  const excess = P.map((p, k) => (k === i ? 0 : Math.max(0, p - lo)))
  const tot = excess.reduce((a, e) => a + e, 0)
  return P.map((_, k) => (k === i ? x : lo + free * (tot > 0 ? excess[k] / tot : 1 / (K - 1))))
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** 二分类、p = σ(z)：MSE L = ½(p − y)² 的梯度 (p − y)·p(1 − p) */
export function mseGrad(z: number, y: number): number {
  const p = sigmoid(z)
  return (p - y) * p * (1 - p)
}

/** 二分类交叉熵 L = −[y log p + (1 − y) log(1 − p)] 的梯度 p − y */
export function bceGrad(z: number, y: number): number {
  return sigmoid(z) - y
}

export function mseLoss(z: number, y: number): number {
  return 0.5 * (sigmoid(z) - y) ** 2
}

/** 用 log-sigmoid 写，避免 log 0 */
export function bceLoss(z: number, y: number): number {
  const sp = (t: number) => (t > 0 ? t + Math.log1p(Math.exp(-t)) : Math.log1p(Math.exp(t))) // softplus
  return y * sp(-z) + (1 - y) * sp(z)
}

/** 从 z0 出发做 steps 步梯度下降，返回每一步的 p = σ(z)（含第 0 步） */
export function gdTrajectory(grad: (z: number, y: number) => number, z0: number, y: number, lr: number, steps: number): number[] {
  const out = [sigmoid(z0)]
  let z = z0
  for (let t = 0; t < steps; t++) {
    z -= lr * grad(z, y)
    out.push(sigmoid(z))
  }
  return out
}

/** 第一次达到 p ≥ target 的步数；达不到返回 −1 */
export function stepsToReach(traj: readonly number[], target: number): number {
  return traj.findIndex((p) => p >= target)
}
