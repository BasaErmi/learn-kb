/** cosine schedule（Nichol & Dhariwal 2021），t ∈ [0, 1] */
const S = 0.008
const f = (t: number) => Math.cos(((t + S) / (1 + S)) * (Math.PI / 2)) ** 2

export const ALPHA_BAR_MIN = 1e-4

export function alphaBar(t: number): number {
  return Math.min(1, Math.max(ALPHA_BAR_MIN, f(t) / f(0)))
}

/** DDIM 采样用的时间点，从 1（纯噪声）到 0（数据） */
export function ddimTimes(steps: number): number[] {
  return Array.from({ length: steps + 1 }, (_, i) => 1 - i / steps)
}
