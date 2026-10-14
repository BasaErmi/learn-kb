import { describe, expect, it } from 'vitest'
import { readJSON, writeJSON, type KV } from './storage'

function memory(init: Record<string, string> = {}): KV & { data: Record<string, string> } {
  const data = { ...init }
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v } }
}
const throwing: KV = {
  getItem: () => { throw new Error('denied') },
  setItem: () => { throw new Error('denied') },
}

describe('readJSON / writeJSON', () => {
  it('round-trips values', () => {
    const kv = memory()
    writeJSON(kv, 'k', { a: [1, 2] })
    expect(readJSON(kv, 'k', null)).toEqual({ a: [1, 2] })
  })
  it('returns fallback when key missing', () => {
    expect(readJSON(memory(), 'k', 42)).toBe(42)
  })
  it('returns fallback on corrupted JSON', () => {
    expect(readJSON(memory({ k: '{oops' }), 'k', 'fb')).toBe('fb')
  })
  it('returns fallback when storage is null or throws', () => {
    expect(readJSON(null, 'k', 1)).toBe(1)
    expect(readJSON(throwing, 'k', 1)).toBe(1)
  })
  it('returns fallback when stored JSON has the wrong shape', () => {
    expect(readJSON(memory({ k: '{}' }), 'k', [] as string[])).toEqual([])
    expect(readJSON(memory({ k: 'null' }), 'k', [] as string[])).toEqual([])
    expect(readJSON(memory({ k: '"x"' }), 'k', false)).toBe(false)
    expect(readJSON(memory({ k: '["a"]' }), 'k', [] as string[])).toEqual(['a'])
    expect(readJSON(memory({ k: 'true' }), 'k', false)).toBe(true)
  })
  it('write never throws', () => {
    expect(() => writeJSON(throwing, 'k', 1)).not.toThrow()
    expect(() => writeJSON(null, 'k', 1)).not.toThrow()
  })
})
