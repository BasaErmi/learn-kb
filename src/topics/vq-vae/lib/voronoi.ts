import type { Pt } from './vq'

/** 用半平面 {p : (p − m)·n ≤ 0} 裁剪凸多边形（Sutherland–Hodgman） */
function clip(poly: Pt[], m: Pt, n: Pt): Pt[] {
  const f = (p: Pt) => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1]
  const out: Pt[] = []
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length]
    const fa = f(a), fb = f(b)
    if (fa <= 0) out.push(a)
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  })
  return out
}

/** 每个码字的 Voronoi 区域（裁剪到 [−r, r]² 方框内）：离它比离其他码字都近的点 */
export function voronoiCells(codes: Pt[], r: number): Pt[][] {
  const box: Pt[] = [[-r, -r], [r, -r], [r, r], [-r, r]]
  return codes.map((c, i) => {
    let poly = box
    codes.forEach((d, j) => {
      if (j === i) return
      const m: Pt = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2]
      poly = clip(poly, m, [d[0] - c[0], d[1] - c[1]])
    })
    return poly
  })
}

export const polygonArea = (p: Pt[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0)) / 2
