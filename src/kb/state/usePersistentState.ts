import { useCallback, useState } from 'react'
import { readJSON, safeStorage, writeJSON } from './storage'

export function usePersistentState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON(safeStorage(), key, fallback))
  const set = useCallback(
    (v: T) => {
      setValue(v)
      writeJSON(safeStorage(), key, v)
    },
    [key],
  )
  return [value, set]
}
