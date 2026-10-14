export function logSumExp(xs: number[]): number {
  const m = Math.max(...xs)
  if (m === -Infinity) return -Infinity
  return m + Math.log(xs.reduce((a, x) => a + Math.exp(x - m), 0))
}

export function sigmoid(x: number): number {
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x))
}
