import { describe, expect, it } from 'vitest'
import { forwardNoise, gaussianField, toRGBA, toSigned } from './forwardNoise'

describe('forwardNoise', () => {
  const rgba = new Uint8ClampedArray([0, 128, 255, 255, 10, 20, 30, 255])
  it('toSigned/toRGBA round-trip within 1 level', () => {
    const back = toRGBA(toSigned(rgba))
    for (let i = 0; i < rgba.length; i++) expect(Math.abs(back[i] - rgba[i])).toBeLessThanOrEqual(1)
  })
  it('ᾱ = 1 returns the image, ᾱ = 0 returns the noise', () => {
    const x0 = toSigned(rgba), n = gaussianField(x0.length, 1)
    expect(Array.from(forwardNoise(x0, n, 1))).toEqual(Array.from(x0))
    expect(Array.from(forwardNoise(x0, n, 0))).toEqual(Array.from(n))
  })
  it('toRGBA clamps out-of-range values', () => {
    const out = toRGBA(new Float32Array([-5, 5, 0]))
    expect([out[0], out[1], out[3]]).toEqual([0, 255, 255])
  })
})
