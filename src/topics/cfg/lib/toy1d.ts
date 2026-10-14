import { sigmoid } from './math'
import { alphaBar } from './schedule'

/**
 * 一维双类玩具模型：两类分别在 ±1，类内标准差 sigma0，等权重。
 * 返回类别 +1 的样本在噪声水平 t 时 |∇ log p_t(y=+1 | x_t)| 的期望。
 * 等方差两类的对数几率是线性的：log p(+|x) − log p(−|x) = 2√ᾱ·x / v。
 */
export function classifierGradStrength(t: number, sigma0 = 0.2): number {
  const ab = alphaBar(t)
  const a = Math.sqrt(ab)
  const v = ab * sigma0 ** 2 + (1 - ab)
  const sd = Math.sqrt(v)
  const k = (2 * a) / v
  const N = 2001
  let acc = 0, wsum = 0
  for (let i = 0; i < N; i++) {
    const x = a - 8 * sd + (16 * sd * i) / (N - 1)
    const w = Math.exp(-((x - a) ** 2) / (2 * v))
    acc += w * k * (1 - sigmoid(k * x))
    wsum += w
  }
  return acc / wsum
}
