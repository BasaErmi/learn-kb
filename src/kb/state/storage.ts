export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** 浏览器 localStorage；不可用（隐私模式、被禁用、非浏览器环境）时返回 null */
export function safeStorage(): KV | null {
  try {
    const s = globalThis.localStorage
    s.getItem('__kb_probe__')
    return s
  } catch {
    return null
  }
}

/** 存储的值与默认值形状一致（同为数组，或同为同一基本类型/非 null 对象）才采用 */
function sameShape(value: unknown, fallback: unknown): boolean {
  if (Array.isArray(fallback)) return Array.isArray(value)
  if (fallback === null) return true
  return typeof value === typeof fallback && value !== null && !Array.isArray(value)
}

export function readJSON<T>(kv: KV | null, key: string, fallback: T): T {
  if (!kv) return fallback
  try {
    const raw = kv.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return sameShape(parsed, fallback) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(kv: KV | null, key: string, value: unknown): void {
  if (!kv) return
  try {
    kv.setItem(key, JSON.stringify(value))
  } catch {
    // 存储失败（配额、隐私模式）时静默忽略，页面状态仍在内存中有效
  }
}
