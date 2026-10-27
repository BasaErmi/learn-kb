import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'cfg',
  title: 'Classifier-Free Guidance',
  summary: '不训练分类器，只用同一个扩散模型的有条件与无条件预测之差，在采样时放大条件，用多样性换质量。',
  area: 'generative/diffusion',
  tags: ['条件生成', '采样'],
  prereqs: ['softmax'],
  updated: '2026-10-14',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 要解决什么问题' },
    { id: 'step-2', title: '2 · 噪声预测就是 score' },
    { id: 'step-3', title: '3 · Classifier guidance' },
    { id: 'step-4', title: '4 · 去掉分类器' },
    { id: 'step-5', title: '5 · 训练：label dropout' },
    { id: 'step-6', title: '6 · 采样' },
    { id: 'step-7', title: '7 · guidance scale 的影响' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
  ],
}
