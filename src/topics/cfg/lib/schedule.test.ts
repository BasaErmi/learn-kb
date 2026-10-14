import { describe, expect, it } from 'vitest'
import { ALPHA_BAR_MIN, alphaBar, ddimTimes } from './schedule'

describe('schedule', () => {
  it('starts at 1 and ends at the floor', () => {
    expect(alphaBar(0)).toBeCloseTo(1, 12)
    expect(alphaBar(1)).toBe(ALPHA_BAR_MIN)
  })
  it('is non-increasing', () => {
    let prev = 2
    for (let i = 0; i <= 100; i++) { const v = alphaBar(i / 100); expect(v).toBeLessThanOrEqual(prev); prev = v }
  })
  it('ddimTimes goes from 1 to 0', () => {
    expect(ddimTimes(4)).toEqual([1, 0.75, 0.5, 0.25, 0])
  })
})
