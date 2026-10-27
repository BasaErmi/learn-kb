/**
 * 知识库的领域树：领域 › 子领域。专题在 meta.area 里写 `领域id/子领域id`（如 'ml-basics/prob-output'）。
 * 数组顺序就是首页的显示顺序，没有专题的子领域不显示。
 * id 会出现在首页筛选链接 `#/?area=...` 里，发布后不要改名；标题可以随时改。
 */
export interface SubArea { id: string; title: string }
export interface Area { id: string; title: string; subs: SubArea[] }

export const areas: Area[] = [
  {
    id: 'ml-basics',
    title: '机器学习基础',
    subs: [{ id: 'prob-output', title: '概率输出与损失' }],
  },
  {
    id: 'generative',
    title: '生成模型',
    subs: [{ id: 'diffusion', title: '扩散模型' }],
  },
]

/** 'ml-basics/prob-output' → 领域和子领域；写错时返回 undefined */
export function findArea(path: string): { area: Area; sub: SubArea } | undefined {
  const [a, s] = path.split('/')
  const area = areas.find((x) => x.id === a)
  const sub = area?.subs.find((x) => x.id === s)
  return area && sub ? { area, sub } : undefined
}

/** 首页的领域筛选：只写领域 id 时匹配它下面所有子领域 */
export function inArea(topicArea: string, filter: string): boolean {
  return topicArea === filter || topicArea.startsWith(`${filter}/`)
}
