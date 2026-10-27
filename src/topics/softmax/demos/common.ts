/** 第 1、2、3、6 步共用的 5 个类别，对应 lib 里的 Z5 */
export const CLASSES = ['猫', '狗', '狐狸', '兔子', '汽车']

export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`

/** 定点小数，去掉 -0.000 这种负号 */
export function fix(v: number, d = 3): string {
  const s = v.toFixed(d)
  return Number(s) === 0 ? (0).toFixed(d) : s
}

