# 变更日志

## [2026-10-14] - Added
- GitHub Pages 部署：公开仓库 BasaErmi/learn-kb + Actions 工作流，`npm run publish` 一键同步发布（排除对话记录）。相关文件：`.github/workflows/deploy.yml`、`scripts/publish.sh`、`README.md`。

## [2026-10-14] - Changed
- 第 1 步的「非典型」「低质量」金毛示例由占位框换成真实图片，「典型」示例换成无水印的全身照（均来自 dog.ceo / Stanford Dogs）；修复图片行被误设为 16:7 比例的问题。相关文件：`src/topics/cfg/index.mdx`、`public/images/cfg/`。

## [2026-10-14] - Added
- **CFG 学习页**（`src/topics/cfg/`）：包括第 1～7 步讲解、公式速查、15 条易错点、19 张自测卡片、7 道检验题。
  - 学习过程中的疑问都融入了讲解和复习区，没有单独成节。
  - 11 个可视化：锐化分布、前向加噪（真实照片）、磁铁 score、score 向量场、classifier guidance 流程、分类器梯度强度（玩具模型真实计算）、CFG 外推、label dropout、采样循环、二维真实 CFG 采样、指标趋势（示意）。
- **数值计算库**（`src/topics/cfg/lib/`，37 个单元测试）：用于驱动上面的演示。
- **知识库共用组件**（`src/kb/`）：Step、KeyPoint、Detail、Pitfall、Quiz、Derivation、Figure、Demo、Slider、Tex、SvgSub、Flashcards、Roadmap、TopicToc、ReviewToggle。
- **页面功能**：学习 / 复习两种模式、阅读进度、自测"已掌握"记录（都存在 localStorage）。
- **本地图片**（`public/images/cfg/`）：DiT 官方样例、金毛、萨摩耶，来源见 `SOURCES.md`。
- **端到端测试**（`tests/e2e/kb.spec.ts`）：共 12 项。

## [2026-10-14] - Changed
- KaTeX 固定为 0.16.47，与 rehype-katex 内置的版本一致。版本不一致会导致所有下标渲染错位。
- 图表角色色改为经 dataviz 校验通过的一组颜色：有条件 #2468b8、引导结果 #d9582a、无条件 #159a6b。

## [2026-10-14] - Added
- 搭建知识库脚手架（Vite + React + MDX + KaTeX + Vitest + Playwright）。影响范围：整个项目。相关文件：package.json、vite.config.ts、tsconfig.json。
