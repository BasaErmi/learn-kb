# 项目概览：个人知识库（learnHtml）

## 是什么
基于 Vite + React + MDX 的个人学习知识库。每个学习主题一个页面，页面里有讲解、交互演示和复习工具。

## 目录结构
- `CFG/`、`LDM/`：原始学习对话记录（只读资料，不发布）
- `src/app/`：路由、整体布局、首页
- `src/kb/`：与主题无关的共用组件和状态（复习模式、要点框、测验、卡片、演示外框）
- `src/topics/registry.ts`：主题注册表
- `src/topics/<slug>/`：一个主题。`index.mdx` 是正文，`demos/` 放交互演示，`lib/` 放数值计算（纯函数，有单元测试）
- `public/images/<slug>/`：主题图片
- `tests/e2e/`：Playwright 端到端测试
- `docs/ADR/`：架构决策；`docs/superpowers/`：设计 spec 与实现计划

## 技术栈
Vite 8、React 19、TypeScript 5.9、MDX 3、KaTeX、Shiki、react-router 7（HashRouter）、d3-scale/d3-shape、Vitest、Playwright

## 常用命令
- `npm run dev`：本地预览（http://localhost:5173/#/）
- `npm run publish -- "说明"`：同步到公开仓库 BasaErmi/learn-kb 并推送，GitHub Actions 自动部署到 https://basaermi.github.io/learn-kb/
- `npm run test`：单元测试
- `npm run e2e`：端到端测试
- `npm run build`：打包到 `dist/`

## 数据流
1. registry 注册主题
2. TopicPage 懒加载该主题的 `index.mdx`
3. MDXProvider 注入 kb 组件
4. 演示组件调用 `lib/` 里的纯函数计算并绘制

复习模式和阅读进度存在 localStorage（键名以 `kb:` 开头）。

## 共用组件（MDX 中可直接使用）
| 组件 | 用途 | 复习模式下 |
| --- | --- | --- |
| `Step` | 一个学习步骤（编号、标题、一句话结论） | 显示 |
| `KeyPoint` | 要点与核心公式 | 显示 |
| `Detail` | 讲解正文 | 折叠为“展开讲解” |
| `Pitfall` | 易错旁注 | 显示 |
| `Quiz` + `Answer` | 检验题 | 显示 |
| `Derivation` | 推导逐步展开 | 只显示最后一行 |
| `Figure` | 图片 / 占位框 | 隐藏 |
| `Flashcards` + `Card`/`Front`/`Back` | 自测卡片 | 显示 |
| `Roadmap` | 步骤路线图 | 显示 |

演示组件（需在 MDX 中 import）里使用 `Demo`（`schematic` 标“示意”角标，`note` 写底部说明）、`Seg`（分段按钮）、`Slider`、`Tex`、`SvgSub`（`Sub`、`SvgTex`）。图片条用 `.kb-strip` + `.kb-tag`（左上角叠字标签）；宽 SVG 外面包 `.kb-svg-scroll`，手机上在框内横向滚动。演示要用的实测数据可以放在专题的 `lib/*.json` 里直接 import。
`Roadmap` 的 `legend` 参数可以覆盖图例文字（默认是 CFG 的分类）。

## localStorage 键
- `kb:reviewMode`：是否处于复习模式
- ~~`kb:<slug>:visited`~~：已停用，目录阅读进度只存在内存（每次访问重新计算）
- `kb:<slug>:mastered`：已掌握的卡片 id（卡片 id 发布后不要改）

## 发布流程
- 源码在私有仓库 personalDocument/learnHtml 中维护；公开仓库 `~/Github/learn-kb` 只是发布副本，不要直接在那里改。
- `scripts/publish.sh` 用 rsync 同步，`scripts/publish-exclude.txt` 排除 `CFG/` 对话记录、node_modules、dist 等。
- 部署工作流：`.github/workflows/deploy.yml`（只在公开仓库根目录生效）。

## 注意事项
- 页内跳转用 `scrollToId()`，不要写 `href="#id"`（会破坏 HashRouter）
- 讲解（`<Detail>`）里的 `###` 小标题会自动编号为“步号.节号”，只用于主线内容；顺带一提、可以跳过的内容用 `<Aside title="...">`（标题里可以写 `$...$`），它会弱化显示，不参与编号。宽屏（≥ 1380px）下旁注浮到右侧边栏，和它在源码中的位置对齐，所以要把 `<Aside>` 写在相关段落之后；旁注只放短内容（不放展示公式和表格）
- 正文里的交叉引用：在目标前放 `<Anchor id="..." />`，引用处写 `<Ref to="...">第 3 步的贝叶斯公式</Ref>`（也可以直接用 Step 的 id，如 `step-4`）。跨专题引用写 `<Ref topic="cfg" to="step-2">`，会打开目标专题并定位，返回按钮回到原专题的阅读位置；深链接格式为 `#/t/<slug>?at=<锚点>`。锚点 id 一旦发布不要改名。跳转前的位置会被记下，右下角出现「回到刚才读的位置」按钮（`src/kb/jump.tsx`）。复习模式下，如果目标在折叠的讲解块里，会自动展开该讲解块
- `katex` 版本必须与 `rehype-katex` 内置版本一致（目前是 0.16.47）
- MDX 正文里不要直接写 `<` 和 `{`（公式里可以）；GFM 表格的公式里用 `\mid`，不要用 `|`

## 如何新增主题
做新专题时使用项目 skill `learn-topic-page`（`.claude/skills/learn-topic-page/`）：里面有完整流程、页面结构、写作规范、演示规范、交付前自查清单和截图自查模板。下面是最少步骤：

1. 新建 `src/topics/<slug>/meta.ts` 和 `index.mdx`
2. 在 `registry.ts` 里加一条
3. 需要交互时在 `demos/` 写组件，计算逻辑放 `lib/` 并配测试
