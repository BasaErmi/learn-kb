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

/**
 * 标签的颜色。每个标签固定一种色调，首页筛选、专题卡片和专题页头都用它；色值在 base.css 的 `[data-tone]` 里。
 * 新标签要先在这里登记（registry.test 会检查），尽量选一个还没用过的色调。
 */
export const TAG_TONES = ['sea', 'moss', 'clay', 'plum', 'ochre', 'teal', 'indigo', 'rose'] as const
export type TagTone = (typeof TAG_TONES)[number]

export const tagTones: Record<string, TagTone> = {
  分类: 'sea',
  注意力: 'indigo',
  采样: 'ochre',
  数值稳定: 'teal',
  条件生成: 'plum',
  图像生成: 'rose',
  'Stable Diffusion': 'moss',
  信息论: 'clay',
}

export const toneOf = (tag: string): TagTone => tagTones[tag] ?? 'clay'
