# 当前状态

最后更新：2026-10-27

## 进行中
- 新增《交叉熵》专题，等待 Guanlin 阅读反馈。已发布 Softmax、CFG、LDM 三个专题：https://basaermi.github.io/learn-kb/
- 知识库已按“领域树 + 标签 + 前置关系”组织（ADR-003）

## 待解决
- Softmax 专题按反馈精简后（5 步 + 推导附录），等待 Guanlin 再读一遍

## 技术债务
- 图表没有悬停提示（tooltip），目前靠滑块和数值读数查看数据。
- 站内有两种分段按钮：复习开关用的药丸形 `.kb-seg`（base.css）和演示里的方块形 `Seg`（`.kb-segctl`），视觉上可以考虑统一。

## 下一步
- 交叉熵专题后续：框架为什么把 softmax 和交叉熵合成一个接收 logits 的算子、`log(softmax)` 下溢与 `log_softmax`；label smoothing（换一个软标签 $P$）；forward / reverse KL 的区别。
- 原 Softmax 记录里提到但这次没讲的方向：online softmax / FlashAttention 的分块计算、sparsemax、Gumbel-softmax，可以作为后续专题，放在“机器学习基础”或新的“网络结构 › 注意力”子领域下
- DiT 专题（LDM 第 6 步是它的过渡，可以用跨专题链接衔接 `ldm` 的 `step-6`、`adagn`、`flatten-attn` 锚点）
