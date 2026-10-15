# learn-kb · Guanlin 的知识库

按主题整理的学习笔记网站，每篇都可以在「学习」和「复习」两种模式间切换：讲解、可交互的演示、要点、易错点和自测卡片。

在线访问：https://basaermi.github.io/learn-kb/

## 目前的主题
- **Classifier-Free Guidance**：从锐化目标分布、score 视角、classifier guidance，一步步推到 CFG 公式、训练、采样与 guidance scale 的取舍，配 11 个可视化。

## 本地运行
```bash
npm install
npm run dev      # http://localhost:5173/#/
npm test         # 单元测试
npm run e2e      # 端到端测试（首次需 npx playwright install chromium）
```

## 技术栈
Vite + React + TypeScript + MDX，公式由 KaTeX 在构建期渲染。结构说明见 `PROJECT_OVERVIEW.md`。
