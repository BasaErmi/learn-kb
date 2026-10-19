import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'ldm',
  title: 'Latent Diffusion Model',
  summary: '先用 autoencoder 把图像压到感知上等价的低维 latent，再在 latent 上做标准扩散：前者负责高频细节，后者负责语义和结构。',
  tags: ['扩散模型', '图像生成', 'Stable Diffusion'],
  updated: '2026-10-19',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 为什么在 latent 里扩散' },
    { id: 'step-2', title: '2 · 第一阶段：autoencoder' },
    { id: 'step-3', title: '3 · 缩放系数 s' },
    { id: 'step-4', title: '4 · 在 latent 上训练与采样' },
    { id: 'step-5', title: '5 · 条件生成' },
    { id: 'step-6', title: '6 · 从 LDM 到 DiT' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
  ],
}
