import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'vq-vae',
  title: 'VQ-VAE：离散潜变量的自编码器',
  summary: '编码器输出逐位置吸附到共享码本里最近的码字，把图像变成离散索引网格；用 STE 让梯度穿过量化，用码本损失和 commitment 训练码本；均匀先验下 KL 是常数，生成时再用自回归模型学一个先验。',
  area: 'generative/autoencoder',
  tags: ['向量量化', '图像生成', '信息论'],
  prereqs: [],
  updated: '2026-11-26',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 为什么要离散潜变量' },
    { id: 'step-2', title: '2 · 码本与最近邻量化' },
    { id: 'step-3', title: '3 · Straight-Through Estimator' },
    { id: 'step-4', title: '4 · 损失函数的三项' },
    { id: 'step-5', title: '5 · KL 项去哪了' },
    { id: 'step-6', title: '6 · 学习先验并生成' },
    { id: 'step-7', title: '7 · 死码字与 EMA' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
  ],
}
