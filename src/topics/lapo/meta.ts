import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'lapo',
  title: 'LAPO：从无标签视频学潜在动作',
  summary: '不用任何动作标签，只靠“预测下一帧”加一个信息瓶颈，从纯视频里学出结构接近真实动作的潜在动作 $z$；再对 $z$ 做行为克隆，用少量标签或在线 RL 把它解码成真实动作。',
  area: 'embodied/latent-action',
  tags: ['模仿学习', '强化学习', '向量量化', '世界模型'],
  updated: '2026-11-13',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 要解决什么问题' },
    { id: 'step-2', title: '2 · 没有标签怎么训练 IDM' },
    { id: 'step-3', title: '3 · 信息瓶颈为什么逼出动作' },
    { id: 'step-4', title: '4 · 用 VQ 实现瓶颈' },
    { id: 'step-5', title: '5 · 三阶段流水线' },
    { id: 'step-6', title: '6 · 实验结果' },
    { id: 'step-7', title: '7 · 潜在空间里学到了什么' },
  ],
}
