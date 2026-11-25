import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'univla',
  title: 'UniVLA：以任务为中心的潜动作',
  summary: '在 DINOv2 特征空间里学潜动作，并用两阶段语言条件把“语言解释不了的变化”和任务相关的变化分到两套码本里；VLM 只学 task-centric 潜动作（$16^4$ 种），再用约 12.6M 参数的解码头适配到具体机器人。',
  area: 'embodied/latent-action',
  tags: ['VLA', '模仿学习', '向量量化', '世界模型'],
  prereqs: ['lapa'],
  updated: '2026-11-24',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 动机与三阶段框架' },
    { id: 'step-2', title: '2 · LAM 骨架与 DINOv2 特征空间' },
    { id: 'step-3', title: '3 · 两阶段语言解耦' },
    { id: 'step-4', title: '4 · 策略预训练' },
    { id: 'step-5', title: '5 · 下游适配' },
    { id: 'step-6', title: '6 · 主要实验结果' },
    { id: 'step-7', title: '7 · LAM 的证据与消融' },
  ],
}
