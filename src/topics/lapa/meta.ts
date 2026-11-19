import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'lapa',
  title: 'LAPA：用潜在动作预训练 VLA',
  summary: '用 VQ-VAE 从相邻帧学出离散潜在动作（$8^4$ 种，约 12 bit），给无标签视频打伪标签，让 VLM 在潜在空间里做行为克隆；只在最后换一层动作头，用少量真实动作微调。',
  area: 'embodied/latent-action',
  tags: ['VLA', '模仿学习', '向量量化', '世界模型'],
  prereqs: ['lapo'],
  updated: '2026-11-19',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 问题与核心思路' },
    { id: 'step-2', title: '2 · LAQ：学离散潜在动作' },
    { id: 'step-3', title: '3 · 潜在预训练与动作微调' },
    { id: 'step-4', title: '4 · 实验设置与主结果' },
    { id: 'step-5', title: '5 · 消融与潜在动作分析' },
  ],
}
