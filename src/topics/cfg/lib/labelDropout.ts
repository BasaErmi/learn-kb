/** 第 5 步：每个样本独立地以概率 p 把条件换成空标记（null 表示 ∅） */
export function dropLabels<T>(labels: T[], p: number, rand: () => number): (T | null)[] {
  return labels.map((l) => (rand() < p ? null : l))
}
