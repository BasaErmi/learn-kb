import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'softmax',
  title: 'Softmax',
  summary: '用指数把 logits 变成正数、再归一化成概率分布；它是 argmax 的平滑版本，和交叉熵合用时对 logits 的梯度只剩 $p - y$。',
  area: 'ml-basics/prob-output',
  tags: ['分类', '注意力', '采样', '数值稳定'],
  updated: '2026-10-27',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 从 logits 到概率' },
    { id: 'step-2', title: '2 · 温度：为什么叫 soft max' },
    { id: 'step-3', title: '3 · 平移不变与数值稳定' },
    { id: 'step-4', title: '4 · 接上交叉熵：$p - y$' },
    { id: 'step-5', title: '5 · softmax 的饱和' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
    { id: 'appendix', title: '附录：梯度的推导' },
  ],
}
