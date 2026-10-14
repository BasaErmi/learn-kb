# ADR-001：知识库采用 Vite + React + MDX

- 日期：2026-10-14
- 状态：已采纳

## 背景
需要一个可持续扩展的个人知识库，第一篇是 CFG 学习页。页面需要大量公式和可交互演示，并兼顾学习与复习。

## 考虑的方案
1. 单个自包含 HTML：最简单，但每个主题都要复制公共代码，无法复用组件。
2. Vite + React，正文写 TSX：完全可控，但大段中文与公式写在 JSX 里很繁琐。
3. **Vite + React + MDX（采纳）**：正文用 Markdown + LaTeX 书写，与学习对话记录格式相同，便于从记录生成；交互处插入 React 组件。

## 决定
采用方案 3。
- 路由用 HashRouter + `base: './'`，便于将来直接部署到 GitHub Pages。
- 公式在构建期用 KaTeX 渲染，CSS 本地打包，可离线使用。

## 后果
- 新主题 = `src/topics/<slug>/` 文件夹 + 注册表一行。
- 页内锚点不能用 `href="#id"`，统一用 `scrollToId()`。
- 本地查看需要 Node 工具链（`npm run dev`）。
