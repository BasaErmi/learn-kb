/** 第 1、2、3、6 步共用的 5 个类别，对应 lib 里的 Z5 */
export const CLASSES = ['猫', '狗', '狐狸', '兔子', '汽车']

export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`

/** 定点小数，去掉 -0.000 这种负号 */
export function fix(v: number, d = 3): string {
  const s = v.toFixed(d)
  return Number(s) === 0 ? (0).toFixed(d) : s
}

/** PyTorch 的打印习惯：inf、nan，很大或很小的数用科学计数 */
export function torchNum(v: number): string {
  if (Number.isNaN(v)) return 'nan'
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf'
  if (v === 0) return '0'
  const a = Math.abs(v)
  return a >= 1e4 || a < 1e-3 ? v.toExponential(2).replace('e+', 'e') : v.toFixed(3)
}
