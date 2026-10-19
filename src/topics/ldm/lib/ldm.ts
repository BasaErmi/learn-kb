/** Stable Diffusion 的 scaled-linear 噪声调度：β 在 √β 空间线性插值，T = 1000 */
export const T = 1000
const B0 = 0.00085
const B1 = 0.012

let cache: Float64Array | null = null
/** ᾱ_t，t = 0 … T−1（与 diffusers 的 alphas_cumprod 下标一致） */
export function alphaBars(): Float64Array {
  if (cache) return cache
  const out = new Float64Array(T)
  let prod = 1
  const a = Math.sqrt(B0), b = Math.sqrt(B1)
  for (let t = 0; t < T; t++) {
    const beta = (a + ((b - a) * t) / (T - 1)) ** 2
    prod *= 1 - beta
    out[t] = prod
  }
  cache = out
  return out
}
export const alphaBar = (t: number) => alphaBars()[Math.min(T - 1, Math.max(0, Math.round(t)))]

/** VP 前向过程下 z_t 的方差：ᾱ·Var(z₀) + (1 − ᾱ) */
export const varZt = (ab: number, stdZ0: number) => ab * stdZ0 * stdZ0 + (1 - ab)
/** 信噪比 SNR(t) = ᾱ·Var(z₀) / (1 − ᾱ) */
export const snr = (ab: number, stdZ0: number) => (ab * stdZ0 * stdZ0) / (1 - ab)
/** z_t 中残留信号的标准差 √ᾱ·std(z₀) */
export const residual = (ab: number, stdZ0: number) => Math.sqrt(ab) * stdZ0

/** 第一阶段的形状与压缩率 */
export function compression(H: number, f: number, c: number) {
  const h = H / f
  const pixel = H * H * 3
  const latent = h * h * c
  return {
    h,
    pixel,
    latent,
    ratio: pixel / latent, // = 3f²/c
    tokens: h * h,
    /** 按空间位置做注意力时，注意力矩阵相对像素空间缩小的倍数 (H²/h²)² = f⁴ */
    attnSaving: f ** 4,
    downsamples: Math.log2(f),
  }
}

/** SD VAE encoder：ch_mult = (1, 2, 4, 4)，基础通道 128；除最后一级外每级末尾下采样一次 */
export const CH_MULT = [1, 2, 4, 4]
export function encoderStages(H: number, base = 128) {
  return CH_MULT.map((m, i) => ({ level: i + 1, res: H / 2 ** i, ch: base * m, down: i < CH_MULT.length - 1 }))
}

/** 卷积参数量（不含偏置）：普通卷积 k²·C_in·C_out，depthwise k²·C_in */
export function convParams(k: number, cin: number, cout: number, depthwise = false) {
  return depthwise ? k * k * cin : k * k * cin * cout
}

/** SD 1.x SpatialTransformer 各部分参数量（不含偏置和 LayerNorm），文本维度 d_τ */
export function transformerParams(C: number, dTau = 768) {
  const proj = 2 * C * C
  const self = 4 * C * C
  const cross = 2 * C * C + 2 * dTau * C
  const ffn = 12 * C * C // GEGLU：C→8C，再 4C→C
  return { proj, self, cross, ffn, total: proj + self + cross + ffn }
}

/** 注意力矩阵的元素个数 */
export const selfAttnSize = (n: number) => n * n
export const crossAttnSize = (n: number, m: number) => n * m

/** patchify：I×I×C 的 latent 切成 p×p 的 patch */
export function patchify(I: number, C: number, p: number) {
  return { tokens: (I / p) ** 2, patchDim: p * p * C }
}

/** 1×1 卷积 = 逐位置线性层：y_ij = W h_ij + b */
export function pointwise(W: number[][], b: number[], h: number[]) {
  return W.map((row, k) => row.reduce((s, w, m) => s + w * h[m], b[k]))
}

/** 对 H×W×C_in 的特征图做 k×k 卷积（零填充，步长 1），返回 H×W×C_out；W[k_out][m][dy][dx] */
export function conv2d(x: number[][][], w: number[][][][], b: number[]) {
  const H = x.length, Wd = x[0].length
  const k = w[0][0].length, r = (k - 1) / 2
  const out: number[][][] = []
  for (let i = 0; i < H; i++) {
    const row: number[][] = []
    for (let j = 0; j < Wd; j++) {
      row.push(w.map((wk, o) => {
        let s = b[o]
        for (let m = 0; m < wk.length; m++)
          for (let dy = 0; dy < k; dy++)
            for (let dx = 0; dx < k; dx++) {
              const ii = i + dy - r, jj = j + dx - r
              if (ii >= 0 && ii < H && jj >= 0 && jj < Wd) s += wk[m][dy][dx] * x[ii][jj][m]
            }
        return s
      }))
    }
    out.push(row)
  }
  return out
}
