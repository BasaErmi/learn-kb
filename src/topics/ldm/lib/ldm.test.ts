import { describe, expect, it } from 'vitest'
import { alphaBar, alphaBars, compression, conv2d, convParams, crossAttnSize, encoderStages, patchify, pointwise, residual, selfAttnSize, snr, T, transformerParams, varZt } from './ldm'

describe('SD scaled-linear schedule', () => {
  it('ᾱ_T ≈ 0.0047，√ᾱ_T ≈ 0.068', () => {
    expect(alphaBar(T - 1)).toBeCloseTo(0.00466, 4)
    expect(Math.sqrt(alphaBar(T - 1))).toBeCloseTo(0.068, 3)
  })
  it('单调递减且在 (0, 1) 内', () => {
    const a = alphaBars()
    for (let t = 1; t < T; t++) expect(a[t]).toBeLessThan(a[t - 1])
    expect(a[0]).toBeCloseTo(1 - 0.00085, 8)
  })
})

describe('缩放', () => {
  const s = 0.18215
  it('残留信号：缩放后 0.068，不缩放 0.37', () => {
    const ab = alphaBar(T - 1)
    expect(residual(ab, 1)).toBeCloseTo(0.068, 3)
    expect(residual(ab, 1 / s)).toBeCloseTo(0.37, 2)
  })
  it('Var(z₀) = 1 时方差处处为 1', () => {
    for (const t of [0, 100, 500, 999]) expect(varZt(alphaBar(t), 1)).toBeCloseTo(1, 12)
  })
  it('不缩放时 SNR 整体放大 1/s² ≈ 30 倍', () => {
    const ab = alphaBar(500)
    expect(snr(ab, 1 / s) / snr(ab, 1)).toBeCloseTo(1 / (s * s), 6)
    expect(1 / (s * s)).toBeCloseTo(30.1, 1)
  })
})

describe('压缩与形状', () => {
  it('256、f = 8、c = 4：32×32×4，48 倍，attention 4096 倍', () => {
    const r = compression(256, 8, 4)
    expect(r).toMatchObject({ h: 32, pixel: 196608, latent: 4096, ratio: 48, tokens: 1024, attnSaving: 4096, downsamples: 3 })
  })
  it('压缩率 = 3f²/c', () => {
    for (const [f, c] of [[4, 3], [8, 4], [8, 16], [16, 8]]) expect(compression(512, f, c).ratio).toBeCloseTo((3 * f * f) / c, 10)
  })
  it('encoder 四级：256→128→64→32，通道 128/256/512/512', () => {
    expect(encoderStages(256).map((s) => [s.res, s.ch])).toEqual([[256, 128], [128, 256], [64, 512], [32, 512]])
  })
  it('patchify：32×32×4 的 p = 2/4/8', () => {
    expect([2, 4, 8].map((p) => patchify(32, 4, p))).toEqual([{ tokens: 256, patchDim: 16 }, { tokens: 64, patchDim: 64 }, { tokens: 16, patchDim: 256 }])
  })
  it('注意力矩阵：4096² 约 1677 万，cross 4096×77', () => {
    expect(selfAttnSize(4096)).toBe(16777216)
    expect(crossAttnSize(4096, 77)).toBe(315392)
  })
})

describe('卷积参数量', () => {
  it('C_in = 4、C_out = 5 的 1×1 卷积有 20 个权重', () => expect(convParams(1, 4, 5)).toBe(20))
  it('3×3 是 1×1 的 9 倍；depthwise 不乘 C_out', () => {
    expect(convParams(3, 320, 320) / convParams(1, 320, 320)).toBe(9)
    expect(convParams(3, 4, 4, true)).toBe(36)
  })
  it('SD 1.x block：C = 320 时 proj 约 20 万、FFN 是 6 倍', () => {
    const p = transformerParams(320)
    expect(p.proj).toBe(204800)
    expect(p.ffn / p.proj).toBe(6)
    expect(p.cross).toBe(2 * 320 * 320 + 2 * 768 * 320)
  })
})

describe('1×1 卷积 = 逐位置线性层', () => {
  it('conv2d(k = 1) 与逐位置矩阵乘法逐元素相等', () => {
    const x = [[[1, 2, 3, 4], [0, -1, 2, 0.5]], [[3, 1, -2, 1], [2, 2, 2, 2]]]
    const W = [[0.5, -1, 0, 2], [1, 1, 1, 1], [0, 0.25, -0.5, 1], [2, 0, 0, -1], [-1, 0.5, 0.5, 0]]
    const b = [0.1, 0, -0.2, 0.3, 1]
    const conv = conv2d(x, W.map((r) => r.map((w) => [[w]])), b)
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const lin = pointwise(W, b, x[i][j])
      lin.forEach((v, k) => expect(conv[i][j][k]).toBeCloseTo(v, 12))
    }
  })
  it('3×3 卷积会混合邻居：中心以外的位置改变会影响输出', () => {
    const x = [[[0], [0], [0]], [[0], [1], [0]], [[0], [0], [0]]]
    const w = [[[[1, 1, 1], [1, 1, 1], [1, 1, 1]]]]
    const y = conv2d(x, w, [0])
    expect(y[0][0][0]).toBe(1)
    expect(y[1][1][0]).toBe(1)
  })
})
