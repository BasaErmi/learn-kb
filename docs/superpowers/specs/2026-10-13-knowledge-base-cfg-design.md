# 个人知识库骨架 + CFG 学习页 设计文档

- 日期：2026-10-13
- 状态：待 Guanlin 审阅
- 内容来源：`learnHtml/CFG/CFG学习对话记录.md`（只读，不修改）

## 1. 目标

1. 搭建一个可扩展的个人知识库网站骨架，后续每个学习主题是其中一个页面。
2. 第一个主题：Classifier-Free Guidance（CFG），覆盖对话记录中的第 1～7 步，**不含第 8 步（DiT 实现）**。
3. 页面同时服务**首次学习**与**日后复习**：学术笔记风，可视化充分且多样，交互演示基于真实计算。

### 成功标准

- `npm run dev` 本地可打开首页 → 进入 CFG 页面，所有公式正确渲染、交互演示可用、浏览器控制台无报错。
- 复习模式下，一屏内能快速浏览每一步的要点、核心公式与自测题。
- 新增一个主题只需：在 `src/topics/` 下建文件夹 + 在注册表里加一条。
- `npm run build` 产物可直接部署到 GitHub Pages（本次不部署）。

### 非目标（YAGNI）

- 不做全文搜索、标签筛选、账号、评论、后端。
- 不做暗色模式。
- 不部署、不配置 CI。
- 不讲 CFG 第 8 步。

## 2. 技术选型

| 项 | 选择 | 理由 |
| --- | --- | --- |
| 构建 | Vite + React 18 + TypeScript | 用户选定；组件化便于知识库扩展 |
| 内容 | MDX（`@mdx-js/rollup`） | 正文用 Markdown + LaTeX 书写，交互处插入 React 组件；与对话记录格式一致，便于 Claude 从记录生成 |
| 公式 | `remark-math` + `rehype-katex`，KaTeX CSS 本地打包 | 构建期渲染，断网可用 |
| 代码高亮 | `@shikijs/rehype`（构建期） | 无运行时开销 |
| 路由 | `react-router` HashRouter，Vite `base: './'` | 兼容 GitHub Pages 静态托管 |
| 样式 | 全局 CSS 变量（design tokens）+ 组件级 CSS Modules | 不引入 UI 框架，保持学术笔记风格可控 |
| 图表 | 手写 SVG / Canvas，按需用 `d3-scale`、`d3-shape` | 轻量；交互演示需要精细控制 |
| 测试 | Vitest（数值纯函数 TDD）+ Playwright（`webapp-testing` skill，端到端检查） | |

## 3. 目录结构

```
learnHtml/
├─ CFG/CFG学习对话记录.md        原始资料，不动
├─ docs/
│  ├─ ADR/ADR-001-选择Vite-React-MDX.md
│  └─ superpowers/specs/          本文件
├─ PROJECT_OVERVIEW.md / CHANGELOG.md / CURRENT_STATUS.md
├─ public/images/cfg/             下载到本地的图片 + 来源说明 SOURCES.md
├─ src/
│  ├─ main.tsx
│  ├─ styles/                     tokens.css（颜色/字体/间距）、prose.css（正文排版）
│  ├─ app/                        Router、Layout（侧栏目录+顶栏）、HomePage（主题卡片）
│  ├─ kb/                         所有主题共用
│  │  ├─ components/              见第 4 节
│  │  ├─ state/                   ReviewModeContext、useProgress（localStorage）
│  │  └─ mdx-components.tsx       MDX 标签 → 组件映射（h2 自动锚点等）
│  └─ topics/
│     ├─ registry.ts              主题注册表
│     └─ cfg/
│        ├─ index.mdx             正文
│        ├─ meta.ts               标题、简介、标签、日期
│        ├─ demos/*.tsx           CFG 专属交互演示
│        └─ lib/*.ts (+ *.test.ts) 演示背后的数值计算，纯函数
└─ tests/e2e/                     Playwright 脚本
```

边界约定：`kb/` 不依赖任何具体主题；`topics/xxx/` 只依赖 `kb/` 与通用库；`demos/` 只负责绘制和交互，计算全部放在 `lib/`。

## 4. 共用组件（`src/kb/components`）

| 组件 | 作用 | 复习模式下 |
| --- | --- | --- |
| `Step` | 包裹一个学习步骤：编号、标题、一句话结论；向目录注册锚点 | 显示，内部只保留"复习可见"的子元素 |
| `KeyPoint` | 要点框（结论 + 核心公式） | 显示 |
| `Detail` | 讲解正文容器（MDX 普通段落默认放在这里） | 折叠为"展开讲解" |
| `Pitfall` | 正文中的"注意/易错"旁注，融合在讲解里 | 显示 |
| `Quiz` | 单个检验题，点击显示参考答案 | 显示 |
| `Flashcards` | 自测卡片组，"已掌握"状态存 localStorage | 显示 |
| `Roadmap` | 步骤路线图（SVG），节点可点击跳转 | 显示 |
| `Figure` | 图片 + 图注 + 来源；无图时显示虚线占位框和建议内容 | 隐藏 |
| `Demo` | 交互演示外框：标题、说明、"重置"按钮、统一控件样式（滑块/按钮） | 隐藏 |
| `Derivation` | 推导分步展开器，每点一次显示下一行 | 显示最终结果行 |
| `ReviewToggle` | 顶栏"学习 / 复习"切换，状态存 localStorage | — |

阅读进度：侧栏目录高亮当前步骤，并显示已读步骤（IntersectionObserver）。

## 5. CFG 页面内容

用户在学习过程中提出的疑问**不单独成节**，答案融入对应讲解（用 `Pitfall` 或正文段落），并在复习区转化为易错点与自测题。

### 5.0 开篇
- 一句话概述 CFG。
- `Roadmap`：目标 → 工具 → 前身 → CFG → 训练 → 采样 → 调参，并标注"第 2 步属于扩散基础，第 3 步是前身，第 4 步起是 CFG 本身"。
- 记号表：$p(x_0)$、$p_t(x_t)$（等于 DDPM 记号中的 $q(x_t)$）、$\epsilon_\varnothing$、$\epsilon_y$、$c=\sqrt{1-\bar\alpha_t}$、$s$ 与 $w$（$s=1+w$）。

### 5.1 第 1 步：要解决什么问题
- 条件模型学到 $p(x\mid y)$ 却生成不够好：真实分布宽 + 模型误差。
- 目标分布 $\tilde p \propto p(x)\,p(y\mid x)^s$；temperature / truncation 类比。
- 融入：指数让每个值变小但归一化后比例放大（$Z$ 抵消）；$s$ 只影响采样不影响训练；$s=0,1,>1,\to\infty$ 四档。
- 演示 `SharpenDemo`：拖动 $s$，① 一维分布曲线实时变尖；② A(0.9)/B(0.3) 归一化概率柱状图，$s=1,2,4$ 时为 75% / 90% / 98.8%。
- 图：典型 / 非典型 / 低质量的狗照片三联（来自 GitHub 可下载图片，取不到则占位）。

### 5.2 第 2 步：噪声预测就是 score
- score 定义与五条性质（相对变化率、$Z$ 消失、乘法变加法、高斯 score 线性、Langevin 可采样）。
- 单样本高斯 score → 事实 1（MSE 学条件期望）+ 事实 2（边缘 score 是后验加权平均）→ $\nabla\log p_t \approx -\epsilon_\theta / c$。
- 融入：期望下标为何不能省（随机性藏在 $\epsilon$ 中）；$\bar\alpha_t\to0$ 时 $\epsilon_\theta\approx x_t$；Langevin、多噪声水平与逆向 SDE 的关系；"第 2 步只证明了一句话"的定位。
- 演示 `ForwardNoiseDemo`：真实照片，拖动 $\bar\alpha_t$ 在浏览器内实时按 $\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\epsilon$ 加噪。
- 演示 `MagnetDemo`：数据点 $\pm1$，拖动 $x_t$ 与噪声大小，显示后验权重、各自拉力、加权平均 score；$x_t=1.5,\sigma=1$ 时为 −0.595。
- 演示 `ScoreFieldDemo`：二维高斯混合的 score 向量场，可切换噪声水平 $t$，看分布被"抹开"。

### 5.3 第 3 步：classifier guidance
- 贝叶斯分解 → 第二项由噪声感知分类器 $p_\phi(y\mid x_t,t)$ 提供 → 反向换算得 $\hat\epsilon=\epsilon_\theta - s\,c\,\nabla\log p_\phi$。
- 融入："词典反向换算"是单位换算而非随意缩放；梯度只对输入求、两个模型都冻结（附代码）；$p_t$ 下标的含义。
- 三个缺点 → 引出第 4 步。
- 图 `CGPipeline`（SVG）：扩散模型与分类器两条并行支路，梯度只回到 $x_t$。
- 示意曲线：分类器梯度强度随 $t$ 的变化（两端小、中段大），标注"示意"。

### 5.4 第 4 步：去掉分类器
- 移项：$\nabla\log p_t(y\mid x_t)=\nabla\log p_t(x_t\mid y)-\nabla\log p_t(x_t)$。
- 融入：左边是锐化后的 $\tilde p_t$ 而非 $p_t(x_t\mid y)$。
- `Derivation`：代入词典 → 同乘 $-c$ → 核心公式。
- 演示 `ExtrapolationDemo`：二维平面上 $\epsilon_\varnothing$、$\epsilon_y$、$\hat\epsilon$，拖动 $s$ 看外推。
- CG vs CFG 对比表；融入"为何不易被骗"（生成模型前向差 vs 判别模型输入梯度）、"文本条件可用"。

### 5.5 第 5 步：训练
- label dropout 公式；为何 $\varnothing$ 学到的就是无条件 score（事实 1）。
- 融入：$p_{\text{uncond}}=0$ 时无法用 CFG；negative prompt 是把 $\epsilon_\varnothing$ 换成 $\epsilon_{\text{neg}}$。
- 演示 `LabelDropoutDemo`：可调 $p_{\text{uncond}}$，点击抽一个 batch，查看被替换为 $\varnothing$ 的样本。

### 5.6 第 6 步：采样
- 单步四件事；代入 DDIM；batch 拼接代码（高亮）。
- 融入：在 $\hat x_0$ 上组合等价（仿射组合系数和为 1），非线性操作（clipping）后不等价。
- 演示 `SamplingLoopDemo`：动画演示一步内的数据流（复制 → 一次前向 → 拆开 → 组合 → 更新），可逐步播放。

### 5.7 第 7 步：guidance scale 的影响
- 好的一面 / 过大的三层原因 / dynamic thresholding 与 CFG rescale。
- 演示 `GuidedSamplingDemo`（核心）：二维高斯混合数据（若干类别簇），解析计算 $\epsilon_y$、$\epsilon_\varnothing$，按真实 CFG 公式跑 DDIM 采样数百个粒子；拖动 $s$ 观察多样性下降、样本冲出数据范围；同时显示数据真实分布作对照。
- 图：IS / FID / Precision / Recall 随 $s$ 的变化曲线，标注"示意，非真实数据"。
- 图：DiT 官方仓库样例图（`facebookresearch/DiT` 的 `visuals/`），注明 $s=4.0$。
- 取值参考：DiT FID 9.62 → 2.27（$s=1.5$）；Stable Diffusion 默认 7.5。

### 5.8 复习区
- 公式速查卡（目标分布、词典、CG 公式、CFG 公式、$s$/$w$ 换算、DDIM 代入）。
- 易错点汇总（来自对话中的疑问）。
- `Flashcards`：每步的检验题 + 对话中的追问，附参考答案。

## 6. 数值计算模块（`topics/cfg/lib`，TDD）

| 函数 | 测试用例 |
| --- | --- |
| `sharpenWeights(probs, s)` | [0.9,0.3] 在 s=1,2,4 → A 占 0.75 / 0.9 / 0.988 |
| `mixturePosterior(xt, centers, sigma)` | xt=1.5, ±1, σ=1 → [0.953, 0.047] |
| `mixtureScore(xt, centers, sigma)` | 同上 → −0.595；与数值微分 log 密度一致 |
| `gmm2d`：`noisedDensity / score / epsilon(x, t, y?)` | 条件与无条件 ε 与 score 满足 ε = −c·score；t→T 时 ε≈x |
| `cfgEpsilon(epsUncond, epsCond, s)` | s=0 → ε∅；s=1 → εy；线性 |
| `ddimStep(x, eps, t, tPrev)` | s=1、无引导时采样分布均值方差接近数据（统计容差） |
| `noiseSchedule(T)` | ᾱ 单调递减、端点范围正确 |
| `forwardNoise(pixels, alphaBar, noise)` | ᾱ=1 原图；ᾱ=0 纯噪声 |

随机数统一用可设种子的 PRNG，保证测试与演示可复现。

## 7. 视觉风格

- 学术笔记风（参考 distill.pub）：米白纸张底色、衬线正文（中文用思源宋体/系统宋体回退）、无衬线标题与 UI、窄正文栏 + 左侧固定目录 + 右侧边注区（宽屏）。
- 图表配色遵循 `dataviz` skill：条件 / 无条件 / 引导结果三种角色固定颜色，全页一致。
- 交互控件统一：滑块显示当前数值，演示均有"重置"。
- 实现阶段使用 `frontend-design` skill 把控整体视觉质量。

## 8. 图片

- 来源：GitHub 上可直接下载的图片（DiT 官方 `visuals/`、开源仓库中的狗照片等），下载到 `public/images/cfg/`，在 `SOURCES.md` 记录原始链接与许可。
- 维基共享资源当前网络不可达，不依赖它。
- 取不到合适图片的位置用 `Figure` 的占位模式，写明建议内容，日后手动替换。

## 9. 验证

1. `npm run test`：lib 单元测试全部通过。
2. `npm run build`：无类型错误、无构建警告。
3. `webapp-testing`（Playwright）：打开首页与 CFG 页，截图；检查控制台零报错；逐个操作每个演示（拖滑块、点按钮）；切换复习模式并截图；KaTeX 无渲染错误（无 `.katex-error`）。
4. 交付前向 Guanlin 展示关键截图。

## 10. 项目文档

在 `learnHtml/` 下创建并维护 `PROJECT_OVERVIEW.md`、`CHANGELOG.md`、`CURRENT_STATUS.md`、`docs/ADR/ADR-001-选择Vite-React-MDX.md`（记录：为何不用单 HTML、为何不用纯 TSX、为何 HashRouter）。
