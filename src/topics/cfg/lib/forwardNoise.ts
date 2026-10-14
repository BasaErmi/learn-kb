import { gaussian, mulberry32 } from './prng'

/** RGBA [0,255] → RGB [-1,1]（每像素 3 个数） */
export function toSigned(rgba: Uint8ClampedArray): Float32Array {
  const n = rgba.length / 4
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] = rgba[i * 4 + c] / 127.5 - 1
  return out
}

export function toRGBA(signed: Float32Array): Uint8ClampedArray {
  const n = signed.length / 3
  const out = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round((signed[i * 3 + c] + 1) * 127.5)
    out[i * 4 + 3] = 255
  }
  return out
}

/** x_t = √ᾱ · x_0 + √(1−ᾱ) · ε */
export function forwardNoise(x0: Float32Array, noise: Float32Array, ab: number): Float32Array {
  const a = Math.sqrt(ab), c = Math.sqrt(1 - ab)
  const out = new Float32Array(x0.length)
  for (let i = 0; i < x0.length; i++) out[i] = a * x0[i] + c * noise[i]
  return out
}

export function gaussianField(n: number, seed: number): Float32Array {
  const rand = mulberry32(seed)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = gaussian(rand)
  return out
}
