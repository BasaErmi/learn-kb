/** 第 1 步：按 p^s 重新加权再归一化。在 log 空间计算，s 很大时也不会下溢 */
export function sharpenWeights(probs: number[], s: number): number[] {
  const logs = probs.map((p) => (p === 0 ? (s === 0 ? 0 : -Infinity) : s * Math.log(p)))
  const m = Math.max(...logs)
  const w = logs.map((l) => Math.exp(l - m))
  const z = w.reduce((a, b) => a + b, 0)
  return w.map((x) => x / z)
}

/** 网格上的 p(x)·p(y|x)^s，按梯形法则归一化为密度 */
export function sharpenCurve(xs: number[], px: number[], pyx: number[], s: number): number[] {
  const logs = xs.map((_, i) => Math.log(px[i]) + s * Math.log(pyx[i]))
  const m = Math.max(...logs)
  const u = logs.map((l) => Math.exp(l - m))
  let area = 0
  for (let i = 1; i < xs.length; i++) area += ((u[i] + u[i - 1]) / 2) * (xs[i] - xs[i - 1])
  return u.map((v) => v / area)
}
