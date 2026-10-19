export const img = (p: string) => import.meta.env.BASE_URL + 'images/ldm/' + p

export const fmt = (n: number) => n.toLocaleString('en-US')
/** 大数写成“约 X 万 / 亿” */
export function wan(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(n >= 1e9 ? 1 : 2)} 亿`
  if (n >= 1e4) return `${(n / 1e4).toFixed(n >= 1e6 ? 0 : 1)} 万`
  return fmt(n)
}
