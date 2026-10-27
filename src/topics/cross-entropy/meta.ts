import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'cross-entropy',
  title: '交叉熵',
  summary: '用模型分布 $Q$ 算信息量、按真实分布 $P$ 加权平均：$H(P, Q) = H(P) + D_{\\text{KL}}(P \\,\\|\\, Q)$。分类时它就是 $-\\log p_c$，等价于最大似然，和 sigmoid、softmax 配合时梯度是 $p - y$。',
  area: 'ml-basics/prob-output',
  tags: ['分类', '信息论'],
  prereqs: ['softmax'],
  updated: '2026-10-27',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 信息量与熵' },
    { id: 'step-2', title: '2 · 交叉熵与 KL 散度' },
    { id: 'step-3', title: '3 · 用在分类上' },
    { id: 'step-4', title: '4 · 为什么不用 MSE' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
  ],
}
