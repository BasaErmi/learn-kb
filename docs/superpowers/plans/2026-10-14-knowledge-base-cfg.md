# 知识库骨架 + CFG 学习页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `learnHtml/` 下建立一个 Vite + React + MDX 的个人知识库，并完成第一个主题页面「Classifier-Free Guidance」（第 1～7 步，学习 + 复习兼顾）。

**Architecture:** `src/kb/` 是与主题无关的共用层（布局、复习模式、要点框、测验、卡片、演示外框等）；`src/topics/<slug>/` 是一个主题（`index.mdx` 正文 + `demos/` 交互演示 + `lib/` 纯函数数值计算）；`src/topics/registry.ts` 把主题注册到首页和路由。正文用 MDX 写，公式在构建期由 KaTeX 渲染，演示的计算全部是可测试的纯函数。

**Tech Stack:** Vite 8、React 19、TypeScript 5.9、@mdx-js/rollup 3、remark-math 6 + rehype-katex 7（KaTeX 0.19）、remark-gfm、rehype-slug、@shikijs/rehype 4、react-router-dom 7（HashRouter）、d3-scale / d3-shape、Vitest 5、@playwright/test 1.64。

**Spec:** `learnHtml/docs/superpowers/specs/2026-10-13-knowledge-base-cfg-design.md`（执行者必须同时阅读）。内容来源：`learnHtml/CFG/CFG学习对话记录.md`（只读）。

## Global Constraints

- 项目根目录：`/Users/liuguanlin/Github/personalDocument/learnHtml`，所有命令在此目录执行。
- `CFG/CFG学习对话记录.md` 只读，不得修改或移动。
- 只讲 CFG 第 1～7 步，**不含第 8 步（DiT 实现细节）**。
- 用户在对话中提过的疑问**不单独成节**，融入讲解（正文或 `Pitfall`），并在复习区转化为易错点 / 自测卡片。
- 不做：全文搜索、标签筛选、暗色模式、部署、CI、后端。
- 路由：`HashRouter`；Vite `base: './'`；页内跳转一律用 `scrollToId()`，**不得**使用 `href="#id"`（会破坏 hash 路由）。
- 静态资源只用本地文件：KaTeX CSS 打包进来，图片放 `public/images/cfg/`，不引用外链图片或 CDN。
- 视觉：学术笔记风（米白底、衬线正文、左侧目录），不引入 UI 框架。
- 图表角色颜色全站固定：无条件 `--c-uncond`、有条件 `--c-cond`、引导结果 `--c-guided`、数据 `--c-data`。
- 示意性（非真实计算）的图必须标注「示意」。
- 随机数一律用可设种子的 `mulberry32`，保证可复现。
- 用户界面文案用中文。
- **Git：未经 Guanlin 明确同意不 commit。** 每个任务末尾的 "Checkpoint" 步骤只运行检查，不提交；如果 Guanlin 同意按任务提交，再在 Checkpoint 执行 `git add learnHtml && git commit`。

## Review Focus

1. **localStorage 不可用或内容损坏**（隐私模式抛异常、手动改坏 JSON）→ 页面照常工作，回落到默认值。测试：Task 2 `storage.test.ts`。
2. **hash 路由下的页内跳转**：点击目录或路线图后，URL 必须保持 `#/t/cfg`，不能跳回首页或出现 404。测试：Task 11 e2e `toc keeps route`。
3. **滑块拉到极端值**（$s=0$、$s$ 很大、$\bar\alpha\to0$ 或 1、$x_t$ 远离数据）→ 不出现 NaN 或 Infinity，演示不白屏。测试：Task 3 的 `sharpen`、`mixture1d`、`gmm2d`、`cfg` 极端值用例，以及 Task 11 e2e `sliders at extremes`。
4. **访问不存在的主题 slug** → 显示「未找到」和返回首页链接，不白屏。测试：Task 2 `registry.test.ts` 和 Task 11 e2e `unknown slug`。
5. **复习模式和"已掌握"刷新后保持**。测试：Task 11 e2e `review mode persists`、`flashcard mastered persists`。

---

## File Structure

```
learnHtml/
├─ .gitignore
├─ package.json / tsconfig.json / vite.config.ts / playwright.config.ts / index.html
├─ PROJECT_OVERVIEW.md / CHANGELOG.md / CURRENT_STATUS.md
├─ docs/ADR/ADR-001-选择Vite-React-MDX.md
├─ public/images/cfg/{golden-retriever.jpg, samoyed.jpg, dit-samples-0.jpg, dit-samples-1.jpg, SOURCES.md}
├─ src/
│  ├─ main.tsx                    入口：引入全局 CSS，挂载 <App/>
│  ├─ mdx.d.ts                    *.mdx 模块类型
│  ├─ styles/tokens.css           设计变量
│  ├─ styles/base.css             reset + 页面骨架 + 顶栏 + 首页
│  ├─ styles/prose.css            正文排版、KaTeX、表格、代码
│  ├─ styles/kb.css               共用组件样式
│  ├─ styles/demo.css             演示与图表样式
│  ├─ app/App.tsx                 路由
│  ├─ app/Shell.tsx               顶栏 + <Outlet/>
│  ├─ app/HomePage.tsx            主题卡片列表
│  ├─ app/TopicPage.tsx           加载主题 MDX + 目录
│  ├─ app/NotFound.tsx
│  ├─ kb/scroll.ts                scrollToId
│  ├─ kb/children.ts (+ .test.ts) meaningfulChildren
│  ├─ kb/state/storage.ts (+ .test.ts)
│  ├─ kb/state/usePersistentState.ts
│  ├─ kb/state/ReviewMode.tsx
│  ├─ kb/components/{Step,KeyPoint,Detail,Pitfall,Quiz,Derivation,Figure,Demo,Slider,Tex,Flashcards,Roadmap,ReviewToggle,TopicToc}.tsx
│  ├─ kb/mdx-components.tsx
│  └─ topics/
│     ├─ registry.ts (+ .test.ts)
│     └─ cfg/
│        ├─ meta.ts
│        ├─ index.mdx
│        ├─ lib/{math,prng,sharpen,mixture1d,schedule,gmm2d,cfg,toy1d,forwardNoise,labelDropout}.ts (+ 各自 .test.ts)
│        └─ demos/{SharpenDemo,ForwardNoiseDemo,MagnetDemo,ScoreFieldDemo,CGPipeline,GradStrengthChart,
│                  ExtrapolationDemo,LabelDropoutDemo,SamplingLoopDemo,GuidedSamplingDemo,MetricsChart}.tsx
└─ tests/e2e/kb.spec.ts
```

---

### Task 1: 项目脚手架 + 项目文档

**Files:**
- Create: `.gitignore`、`package.json`、`tsconfig.json`、`vite.config.ts`、`index.html`、`src/main.tsx`、`src/mdx.d.ts`、`src/app/App.tsx`（临时）、`src/smoke.test.ts`（临时）
- Create: `PROJECT_OVERVIEW.md`、`CHANGELOG.md`、`CURRENT_STATUS.md`、`docs/ADR/ADR-001-选择Vite-React-MDX.md`

**Interfaces:**
- Produces: 路径别名 `@/` → `src/`；`npm run dev|build|test|e2e` 四个脚本；`*.mdx` 可作为 React 组件导入。

- [ ] **Step 1: 初始化 package.json 并安装依赖**

```bash
cd /Users/liuguanlin/Github/personalDocument/learnHtml
npm init -y
npm pkg set name=learn-kb private=true type=module
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview" scripts.test="vitest run" scripts.e2e="playwright test"
npm pkg delete main scripts.test-old
npm i react@19 react-dom@19 react-router-dom@7 @mdx-js/react@3 katex@0.19 d3-scale@4 d3-shape@3
npm i -D vite@8 @vitejs/plugin-react@6 typescript@5.9 @types/react@19 @types/react-dom@19 @mdx-js/rollup@3 remark-math@6 remark-gfm@4 rehype-katex@7 rehype-slug@6 @shikijs/rehype@4 shiki@4 @types/d3-scale @types/d3-shape @types/mdx @types/node vitest@5 @playwright/test@1.64
```

- [ ] **Step 2: 写配置文件**

`.gitignore`:
```
node_modules/
dist/
test-results/
playwright-report/
.DS_Store
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'

export default defineConfig({
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex, rehypeSlug, [rehypeShiki, { theme: 'github-light' }]],
      }),
    },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

`index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>知识库</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/mdx.d.ts`:
```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXContent: ComponentType<Record<string, unknown>>
  export default MDXContent
}
```

`src/main.tsx`（临时版本，Task 2 会替换 App 内容）:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import { App } from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/app/App.tsx`（临时）:
```tsx
export function App() {
  return <p>知识库脚手架已就绪</p>
}
```

`src/smoke.test.ts`（临时，Task 3 删除）:
```ts
import { expect, it } from 'vitest'
it('vitest runs', () => expect(1 + 1).toBe(2))
```

- [ ] **Step 3: 验证脚手架**

Run: `npm run test` → Expected: 1 passed
Run: `npm run build` → Expected: 无错误，生成 `dist/index.html`
Run: `npx playwright install chromium` → Expected: 下载完成

- [ ] **Step 4: 写项目文档**

`docs/ADR/ADR-001-选择Vite-React-MDX.md`:
```markdown
# ADR-001：知识库采用 Vite + React + MDX

- 日期：2026-10-14
- 状态：已采纳

## 背景
需要一个可持续扩展的个人知识库，第一篇是 CFG 学习页。页面需要大量公式、可交互演示，并兼顾学习与复习。

## 考虑的方案
1. 单个自包含 HTML：最简单，但每个主题都要复制公共代码，无法复用组件。
2. Vite + React，正文写 TSX：完全可控，但大段中文与公式写在 JSX 里很繁琐。
3. **Vite + React + MDX（采纳）**：正文用 Markdown + LaTeX（与学习对话记录同格式，便于从记录生成），交互处插入 React 组件。

## 决定
采用方案 3。路由用 HashRouter + `base: './'`，便于将来直接部署到 GitHub Pages；公式在构建期用 KaTeX 渲染，CSS 本地打包，可离线。

## 后果
- 新主题 = `src/topics/<slug>/` 文件夹 + 注册表一行。
- 页内锚点不能用 `href="#id"`，统一用 `scrollToId()`。
- 需要 Node 工具链（npm run dev）才能本地查看。
```

`PROJECT_OVERVIEW.md`:
```markdown
# 项目概览：个人知识库（learnHtml）

## 是什么
基于 Vite + React + MDX 的个人学习知识库。每个学习主题一个页面，包含讲解、交互演示和复习工具。

## 目录结构
- `CFG/`：原始学习对话记录（只读资料）
- `src/app/`：路由、整体布局、首页
- `src/kb/`：与主题无关的共用组件和状态（复习模式、要点框、测验、卡片、演示外框）
- `src/topics/registry.ts`：主题注册表
- `src/topics/<slug>/`：一个主题，包括 `index.mdx` 正文、`demos/` 交互演示和 `lib/` 数值计算（纯函数，有单元测试）
- `public/images/<slug>/`：主题图片及 `SOURCES.md` 来源说明
- `tests/e2e/`：Playwright 端到端测试
- `docs/ADR/`：架构决策；`docs/superpowers/`：设计 spec 与实现计划

## 常用命令
- `npm run dev`：本地预览
- `npm run test`：单元测试
- `npm run e2e`：端到端测试
- `npm run build`：打包到 `dist/`

## 数据流
registry → TopicPage 懒加载 `index.mdx` → MDXProvider 注入 kb 组件 → 演示组件调用 `lib/` 纯函数计算并绘制。复习模式和进度存在 localStorage（`kb:*` 键）。

## 如何新增主题
1. 新建 `src/topics/<slug>/meta.ts` 和 `index.mdx`
2. 在 `registry.ts` 加一条
3. 需要交互时在 `demos/` 写组件，计算放 `lib/` 并配测试
```

`CHANGELOG.md`:
```markdown
# 变更日志

## [2026-10-14] - Added
- 搭建知识库脚手架（Vite + React + MDX + KaTeX）。影响范围：整个项目。相关文件：package.json、vite.config.ts。
```

`CURRENT_STATUS.md`:
```markdown
# 当前状态

最后更新：2026-10-14

## 进行中
- 按 `docs/superpowers/plans/2026-10-14-knowledge-base-cfg.md` 实现知识库骨架与 CFG 页面

## 待解决
- 「非典型 / 低质量的狗」示例图暂用占位框，待补真实图片

## 技术债务
- 无

## 下一步
- 完成 CFG 页面后，考虑下一个主题
```

- [ ] **Step 5: Checkpoint** — `npm run test && npm run build` 通过。

---

### Task 2: 共用状态 + 路由骨架 + 主题注册表

**Files:**
- Create: `src/kb/state/storage.ts`、`src/kb/state/storage.test.ts`、`src/kb/state/usePersistentState.ts`、`src/kb/state/ReviewMode.tsx`、`src/kb/scroll.ts`
- Create: `src/topics/registry.ts`、`src/topics/registry.test.ts`、`src/topics/cfg/meta.ts`、`src/topics/cfg/index.mdx`（临时一行）
- Create: `src/app/{Shell,HomePage,TopicPage,NotFound}.tsx`、`src/kb/components/{ReviewToggle,TopicToc}.tsx`
- Modify: `src/app/App.tsx`（替换为路由）

**Interfaces:**
- Produces:
  - `interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }`
  - `safeStorage(): KV | null`、`readJSON<T>(kv: KV | null, key: string, fallback: T): T`、`writeJSON(kv: KV | null, key: string, value: unknown): void`
  - `usePersistentState<T>(key: string, fallback: T): [T, (v: T) => void]`
  - `ReviewModeProvider`、`useReviewMode(): { review: boolean; setReview(v: boolean): void }`
  - `scrollToId(id: string): void`
  - `interface TopicStep { id: string; title: string }`、`interface TopicMeta { slug; title; summary; tags: string[]; updated: string; steps: TopicStep[] }`、`interface Topic extends TopicMeta { load(): Promise<{ default: ComponentType }> }`、`topics: Topic[]`、`findTopic(slug: string): Topic | undefined`
  - localStorage 键：`kb:reviewMode`、`kb:<slug>:visited`、`kb:<slug>:mastered`

- [ ] **Step 1: 写 storage 失败测试**

`src/kb/state/storage.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { readJSON, writeJSON, type KV } from './storage'

function memory(init: Record<string, string> = {}): KV & { data: Record<string, string> } {
  const data = { ...init }
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v } }
}
const throwing: KV = {
  getItem: () => { throw new Error('denied') },
  setItem: () => { throw new Error('denied') },
}

describe('readJSON / writeJSON', () => {
  it('round-trips values', () => {
    const kv = memory()
    writeJSON(kv, 'k', { a: [1, 2] })
    expect(readJSON(kv, 'k', null)).toEqual({ a: [1, 2] })
  })
  it('returns fallback when key missing', () => {
    expect(readJSON(memory(), 'k', 42)).toBe(42)
  })
  it('returns fallback on corrupted JSON', () => {
    expect(readJSON(memory({ k: '{oops' }), 'k', 'fb')).toBe('fb')
  })
  it('returns fallback when storage is null or throws', () => {
    expect(readJSON(null, 'k', 1)).toBe(1)
    expect(readJSON(throwing, 'k', 1)).toBe(1)
  })
  it('write never throws', () => {
    expect(() => writeJSON(throwing, 'k', 1)).not.toThrow()
    expect(() => writeJSON(null, 'k', 1)).not.toThrow()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run src/kb/state/storage.test.ts` → Expected: FAIL（找不到 `./storage`）

- [ ] **Step 3: 实现 storage**

`src/kb/state/storage.ts`:
```ts
export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** 浏览器 localStorage；不可用（隐私模式、被禁用、非浏览器环境）时返回 null */
export function safeStorage(): KV | null {
  try {
    const s = globalThis.localStorage
    s.getItem('__kb_probe__')
    return s
  } catch {
    return null
  }
}

export function readJSON<T>(kv: KV | null, key: string, fallback: T): T {
  if (!kv) return fallback
  try {
    const raw = kv.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON(kv: KV | null, key: string, value: unknown): void {
  if (!kv) return
  try {
    kv.setItem(key, JSON.stringify(value))
  } catch {
    // 存储失败（配额、隐私模式）时静默忽略，页面状态仍在内存中有效
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run src/kb/state/storage.test.ts` → Expected: 5 passed

- [ ] **Step 5: 写 registry 失败测试**

`src/topics/registry.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { findTopic, topics } from './registry'

describe('registry', () => {
  it('has unique slugs', () => {
    const slugs = topics.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('has unique step ids inside each topic', () => {
    for (const t of topics) {
      const ids = t.steps.map((s) => s.id)
      expect(new Set(ids).size, t.slug).toBe(ids.length)
    }
  })
  it('finds cfg and rejects unknown slugs', () => {
    expect(findTopic('cfg')?.title).toContain('Classifier-Free Guidance')
    expect(findTopic('nope')).toBeUndefined()
  })
})
```

- [ ] **Step 6: 运行确认失败**

Run: `npx vitest run src/topics/registry.test.ts` → Expected: FAIL（找不到 `./registry`）

- [ ] **Step 7: 实现 registry 与 cfg meta**

`src/topics/registry.ts`:
```ts
import type { ComponentType } from 'react'
import { meta as cfgMeta } from './cfg/meta'

export interface TopicStep { id: string; title: string }
export interface TopicMeta {
  slug: string
  title: string
  summary: string
  tags: string[]
  updated: string
  steps: TopicStep[]
}
export interface Topic extends TopicMeta {
  load: () => Promise<{ default: ComponentType }>
}

export const topics: Topic[] = [{ ...cfgMeta, load: () => import('./cfg/index.mdx') }]

export function findTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug)
}
```

`src/topics/cfg/meta.ts`:
```ts
import type { TopicMeta } from '../registry'

export const meta: TopicMeta = {
  slug: 'cfg',
  title: 'Classifier-Free Guidance',
  summary: '不训练分类器，只用同一个扩散模型的有条件与无条件预测之差，在采样时放大条件，用多样性换质量。',
  tags: ['扩散模型', '条件生成'],
  updated: '2026-10-14',
  steps: [
    { id: 'overview', title: '总览与记号' },
    { id: 'step-1', title: '1 · 要解决什么问题' },
    { id: 'step-2', title: '2 · 噪声预测就是 score' },
    { id: 'step-3', title: '3 · Classifier guidance' },
    { id: 'step-4', title: '4 · 去掉分类器' },
    { id: 'step-5', title: '5 · 训练：label dropout' },
    { id: 'step-6', title: '6 · 采样' },
    { id: 'step-7', title: '7 · guidance scale 的影响' },
    { id: 'cheatsheet', title: '公式速查' },
    { id: 'pitfalls', title: '易错点' },
    { id: 'flashcards', title: '自测卡片' },
  ],
}
```
（`import type` 循环引用只在类型层，不影响运行。）

`src/topics/cfg/index.mdx`（临时）:
```mdx
CFG 页面占位
```

- [ ] **Step 8: 运行确认通过**

Run: `npx vitest run src/topics/registry.test.ts` → Expected: 3 passed

- [ ] **Step 9: 实现 hook、复习模式、scroll**

`src/kb/state/usePersistentState.ts`:
```ts
import { useCallback, useState } from 'react'
import { readJSON, safeStorage, writeJSON } from './storage'

export function usePersistentState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON(safeStorage(), key, fallback))
  const set = useCallback(
    (v: T) => {
      setValue(v)
      writeJSON(safeStorage(), key, v)
    },
    [key],
  )
  return [value, set]
}
```

`src/kb/state/ReviewMode.tsx`:
```tsx
import { createContext, useContext, type ReactNode } from 'react'
import { usePersistentState } from './usePersistentState'

interface ReviewModeValue { review: boolean; setReview: (v: boolean) => void }
const Ctx = createContext<ReviewModeValue>({ review: false, setReview: () => {} })

export function ReviewModeProvider({ children }: { children: ReactNode }) {
  const [review, setReview] = usePersistentState('kb:reviewMode', false)
  return (
    <Ctx.Provider value={{ review, setReview }}>
      <div className="kb-root" data-review={review ? 'on' : 'off'}>{children}</div>
    </Ctx.Provider>
  )
}

export const useReviewMode = () => useContext(Ctx)
```

`src/kb/scroll.ts`:
```ts
/** 页内跳转。HashRouter 占用了 location.hash，不能用 href="#id" */
export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

- [ ] **Step 10: 实现 ReviewToggle 与 TopicToc**

`src/kb/components/ReviewToggle.tsx`:
```tsx
import { useReviewMode } from '@/kb/state/ReviewMode'

export function ReviewToggle() {
  const { review, setReview } = useReviewMode()
  return (
    <div className="kb-seg" role="group" aria-label="阅读模式">
      <button type="button" aria-pressed={!review} onClick={() => setReview(false)}>学习</button>
      <button type="button" aria-pressed={review} onClick={() => setReview(true)}>复习</button>
    </div>
  )
}
```

`src/kb/components/TopicToc.tsx`:
```tsx
import { useEffect, useState } from 'react'
import type { TopicStep } from '@/topics/registry'
import { scrollToId } from '@/kb/scroll'
import { usePersistentState } from '@/kb/state/usePersistentState'

export function TopicToc({ topic, steps }: { topic: string; steps: TopicStep[] }) {
  const [active, setActive] = useState(steps[0]?.id ?? '')
  const [visited, setVisited] = usePersistentState<string[]>(`kb:${topic}:visited`, [])

  useEffect(() => {
    const els = steps.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [steps])

  useEffect(() => {
    if (active && !visited.includes(active)) setVisited([...visited, active])
  }, [active, visited, setVisited])

  const readCount = steps.filter((s) => visited.includes(s.id)).length
  return (
    <nav className="kb-toc" aria-label="目录">
      <div className="kb-toc-title">目录</div>
      <ol>
        {steps.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={s.id === active ? 'is-active' : undefined}
              onClick={() => scrollToId(s.id)}
            >
              <span className={visited.includes(s.id) ? 'kb-toc-dot is-read' : 'kb-toc-dot'} aria-hidden />
              {s.title}
            </button>
          </li>
        ))}
      </ol>
      <div className="kb-toc-progress">
        已读 {readCount} / {steps.length}
        <div className="kb-meter"><div style={{ width: `${(readCount / steps.length) * 100}%` }} /></div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 11: 实现 app 页面与路由**

`src/app/App.tsx`:
```tsx
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ReviewModeProvider } from '@/kb/state/ReviewMode'
import { Shell } from './Shell'
import { HomePage } from './HomePage'
import { TopicPage } from './TopicPage'
import { NotFound } from './NotFound'

export function App() {
  return (
    <HashRouter>
      <ReviewModeProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/t/:slug" element={<TopicPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ReviewModeProvider>
    </HashRouter>
  )
}
```

`src/app/Shell.tsx`:
```tsx
import { Link, Outlet } from 'react-router-dom'
import { ReviewToggle } from '@/kb/components/ReviewToggle'

export function Shell() {
  return (
    <>
      <header className="kb-topbar">
        <Link to="/" className="kb-brand">Guanlin 的知识库</Link>
        <ReviewToggle />
      </header>
      <main className="kb-main">
        <Outlet />
      </main>
    </>
  )
}
```

`src/app/HomePage.tsx`:
```tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { topics } from '@/topics/registry'
import { readJSON, safeStorage } from '@/kb/state/storage'

export function HomePage() {
  useEffect(() => { document.title = '知识库' }, [])
  return (
    <div className="kb-home">
      <header className="kb-home-head">
        <h1>知识库</h1>
        <p className="kb-lede">按主题整理的学习笔记，每篇都可以在「学习」和「复习」两种模式间切换。</p>
      </header>
      <ul className="kb-topic-list">
        {topics.map((t) => {
          const visited = readJSON<string[]>(safeStorage(), `kb:${t.slug}:visited`, [])
          const read = t.steps.filter((s) => visited.includes(s.id)).length
          return (
            <li key={t.slug}>
              <Link to={`/t/${t.slug}`} className="kb-topic-card">
                <span className="kb-eyebrow">{t.tags.join(' · ')}</span>
                <h2>{t.title}</h2>
                <p>{t.summary}</p>
                <span className="kb-card-meta">
                  更新于 {t.updated} · 已读 {read}/{t.steps.length}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

`src/app/NotFound.tsx`:
```tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function NotFound() {
  useEffect(() => { document.title = '未找到 · 知识库' }, [])
  return (
    <div className="kb-notfound">
      <h1>没有找到这个页面</h1>
      <p><Link to="/">返回知识库首页</Link></p>
    </div>
  )
}
```

`src/app/TopicPage.tsx`:
```tsx
import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { findTopic } from '@/topics/registry'
import { TopicToc } from '@/kb/components/TopicToc'
import { mdxComponents } from '@/kb/mdx-components'
import { NotFound } from './NotFound'

export function TopicPage() {
  const { slug = '' } = useParams()
  const topic = findTopic(slug)
  const Content = useMemo(() => (topic ? lazy(topic.load) : null), [topic])

  useEffect(() => {
    if (topic) document.title = `${topic.title} · 知识库`
    window.scrollTo(0, 0)
  }, [topic])

  if (!topic || !Content) return <NotFound />
  return (
    <Suspense fallback={<p className="kb-loading">加载中…</p>}>
      <div className="kb-topic">
        <aside className="kb-topic-side">
          <TopicToc topic={topic.slug} steps={topic.steps} />
        </aside>
        <article className="kb-prose">
          <header className="kb-topic-head">
            <p className="kb-eyebrow">{topic.tags.join(' · ')}</p>
            <h1>{topic.title}</h1>
            <p className="kb-lede">{topic.summary}</p>
          </header>
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </article>
      </div>
    </Suspense>
  )
}
```

`src/kb/mdx-components.tsx`（本任务先放最小版本，Task 4 补全）:
```tsx
import type { MDXComponents } from 'mdx/types'

export const mdxComponents: MDXComponents = {
  a: (props) => <a {...props} target={props.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" />,
}
```

- [ ] **Step 12: Checkpoint**

Run: `npm run test` → Expected: 全部通过
Run: `npm run build` → Expected: 无类型错误
Run: `npm run dev`，打开 `http://localhost:5173/#/` 能看到主题卡片；`#/t/cfg` 显示「CFG 页面占位」；`#/t/nope` 显示「没有找到这个页面」。

---

### Task 3: CFG 数值计算库（TDD）

**Files:**
- Delete: `src/smoke.test.ts`
- Create: `src/topics/cfg/lib/{math,prng,sharpen,mixture1d,schedule,gmm2d,cfg,toy1d,forwardNoise,labelDropout}.ts`
- Test: 同目录 `*.test.ts`

**Interfaces:**
- Produces（后续演示只通过这些签名调用）:
  - `math.ts`: `logSumExp(xs: number[]): number`、`sigmoid(x: number): number`
  - `prng.ts`: `mulberry32(seed: number): () => number`、`gaussian(rand: () => number): number`
  - `sharpen.ts`: `sharpenWeights(probs: number[], s: number): number[]`、`sharpenCurve(xs: number[], px: number[], pyx: number[], s: number): number[]`
  - `mixture1d.ts`: `mixturePosterior(xt, centers, sigma, weights?) : number[]`、`mixtureScore(...) : number`、`mixtureLogDensity(...) : number`
  - `schedule.ts`: `ALPHA_BAR_MIN = 1e-4`、`alphaBar(t: number): number`（t∈[0,1]）、`ddimTimes(steps: number): number[]`（1 → 0）
  - `gmm2d.ts`: `type Vec2 = [number, number]`、`interface Comp2D { mean: Vec2; std: number; weight: number; label: number }`、`responsibilities`、`noisedLogDensity(x, comps, ab)`、`noisedScore(x, comps, ab): Vec2`、`epsilon(x, comps, ab): Vec2`、`classComps(comps, label): Comp2D[]`、`sampleData(comps, n, rand): { x: Vec2; label: number }[]`
  - `cfg.ts`: `cfgCombine(eU, eC, s): Vec2`、`predictX0(x, eps, ab): Vec2`、`ddimStep(x, eps, ab, abPrev): Vec2`、`sampleCFG(o: SampleOptions): SampleResult`、`sampleStats(samples, comps): { spread: number; outsideFrac: number }`
  - `toy1d.ts`: `classifierGradStrength(t: number, sigma0?: number): number`
  - `forwardNoise.ts`: `toSigned(rgba: Uint8ClampedArray): Float32Array`、`toRGBA(signed: Float32Array): Uint8ClampedArray`、`forwardNoise(x0, noise, ab): Float32Array`、`gaussianField(n: number, seed: number): Float32Array`
  - `labelDropout.ts`: `dropLabels<T>(labels: T[], p: number, rand: () => number): (T | null)[]`

- [ ] **Step 1: 写全部失败测试**

`src/topics/cfg/lib/prng.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { gaussian, mulberry32 } from './prng'

describe('prng', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(5), b = mulberry32(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('uniform values lie in [0, 1)', () => {
    const r = mulberry32(1)
    for (let i = 0; i < 10000; i++) { const v = r(); expect(v >= 0 && v < 1).toBe(true) }
  })
  it('gaussian has mean ≈ 0 and variance ≈ 1', () => {
    const r = mulberry32(2), n = 40000
    const xs = Array.from({ length: n }, () => gaussian(r))
    const m = xs.reduce((a, b) => a + b, 0) / n
    const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / n
    expect(Math.abs(m)).toBeLessThan(0.03)
    expect(Math.abs(v - 1)).toBeLessThan(0.05)
  })
})
```

`src/topics/cfg/lib/sharpen.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { sharpenCurve, sharpenWeights } from './sharpen'

describe('sharpenWeights', () => {
  it('reproduces the 75% / 90% / 98.8% table', () => {
    expect(sharpenWeights([0.9, 0.3], 1)[0]).toBeCloseTo(0.75, 3)
    expect(sharpenWeights([0.9, 0.3], 2)[0]).toBeCloseTo(0.9, 3)
    expect(sharpenWeights([0.9, 0.3], 4)[0]).toBeCloseTo(0.9878, 3)
  })
  it('s = 0 gives uniform weights', () => {
    const w = sharpenWeights([0.9, 0.3], 0)
    expect(w[0]).toBeCloseTo(0.5, 9)
    expect(w[1]).toBeCloseTo(0.5, 9)
  })
  it('stays finite for very large s', () => {
    const w = sharpenWeights([0.9, 0.3], 500)
    expect(w[0]).toBeCloseTo(1, 6)
    expect(Number.isFinite(w[1])).toBe(true)
  })
  it('handles zero probabilities', () => {
    expect(sharpenWeights([0, 1], 2)).toEqual([0, 1])
    expect(sharpenWeights([0, 1], 0)).toEqual([0.5, 0.5])
  })
})

describe('sharpenCurve', () => {
  const xs = Array.from({ length: 401 }, (_, i) => -4 + i * 0.02)
  const px = xs.map((x) => Math.exp(-(x * x) / 2))
  const pyx = xs.map((x) => 1 / (1 + Math.exp(-2 * x)))
  const trapz = (ys: number[]) => ys.slice(1).reduce((a, y, i) => a + ((y + ys[i]) / 2) * 0.02, 0)
  const mean = (ys: number[]) => trapz(ys.map((y, i) => y * xs[i]))
  it('integrates to 1 for any s', () => {
    for (const s of [0, 1, 4, 30]) expect(trapz(sharpenCurve(xs, px, pyx, s))).toBeCloseTo(1, 6)
  })
  it('moves mass toward high p(y|x) as s grows', () => {
    expect(mean(sharpenCurve(xs, px, pyx, 4))).toBeGreaterThan(mean(sharpenCurve(xs, px, pyx, 1)))
    expect(mean(sharpenCurve(xs, px, pyx, 1))).toBeGreaterThan(mean(sharpenCurve(xs, px, pyx, 0)))
  })
})
```

`src/topics/cfg/lib/mixture1d.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { mixtureLogDensity, mixturePosterior, mixtureScore } from './mixture1d'

const C = [1, -1]
describe('mixture1d', () => {
  it('posterior at x_t = 1.5 is 95.3% / 4.7%', () => {
    const p = mixturePosterior(1.5, C, 1)
    expect(p[0]).toBeCloseTo(0.953, 3)
    expect(p[1]).toBeCloseTo(0.047, 3)
  })
  it('score at x_t = 1.5 is −0.595', () => {
    expect(mixtureScore(1.5, C, 1)).toBeCloseTo(-0.595, 3)
  })
  it('score equals the numerical derivative of the log density', () => {
    for (const [x, s] of [[1.5, 1], [0.2, 0.5], [-2, 1.7]] as const) {
      const h = 1e-5
      const num = (mixtureLogDensity(x + h, C, s) - mixtureLogDensity(x - h, C, s)) / (2 * h)
      expect(mixtureScore(x, C, s)).toBeCloseTo(num, 5)
    }
  })
  it('stays finite far from the data', () => {
    const p = mixturePosterior(60, C, 0.3)
    expect(p[0]).toBeCloseTo(1, 9)
    expect(Number.isFinite(mixtureScore(60, C, 0.3))).toBe(true)
  })
})
```

`src/topics/cfg/lib/schedule.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { ALPHA_BAR_MIN, alphaBar, ddimTimes } from './schedule'

describe('schedule', () => {
  it('starts at 1 and ends at the floor', () => {
    expect(alphaBar(0)).toBeCloseTo(1, 12)
    expect(alphaBar(1)).toBe(ALPHA_BAR_MIN)
  })
  it('is non-increasing', () => {
    let prev = 2
    for (let i = 0; i <= 100; i++) { const v = alphaBar(i / 100); expect(v).toBeLessThanOrEqual(prev); prev = v }
  })
  it('ddimTimes goes from 1 to 0', () => {
    expect(ddimTimes(4)).toEqual([1, 0.75, 0.5, 0.25, 0])
  })
})
```

`src/topics/cfg/lib/gmm2d.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { classComps, epsilon, noisedLogDensity, noisedScore, sampleData, type Comp2D } from './gmm2d'
import { ALPHA_BAR_MIN } from './schedule'
import { mulberry32 } from './prng'

const comps: Comp2D[] = [
  { mean: [2, 0], std: 0.3, weight: 0.25, label: 0 },
  { mean: [1, 1], std: 0.5, weight: 0.25, label: 0 },
  { mean: [-2, 0], std: 0.3, weight: 0.5, label: 1 },
]

describe('gmm2d', () => {
  it('score equals the numerical gradient of the log density', () => {
    for (const ab of [0.9, 0.4, 0.05]) {
      const x: [number, number] = [0.3, -0.7]
      const h = 1e-5
      const gx = (noisedLogDensity([x[0] + h, x[1]], comps, ab) - noisedLogDensity([x[0] - h, x[1]], comps, ab)) / (2 * h)
      const gy = (noisedLogDensity([x[0], x[1] + h], comps, ab) - noisedLogDensity([x[0], x[1] - h], comps, ab)) / (2 * h)
      const s = noisedScore(x, comps, ab)
      expect(s[0]).toBeCloseTo(gx, 4)
      expect(s[1]).toBeCloseTo(gy, 4)
    }
  })
  it('epsilon = −sqrt(1 − ᾱ) · score', () => {
    const x: [number, number] = [0.5, 0.5], ab = 0.3
    const s = noisedScore(x, comps, ab), e = epsilon(x, comps, ab)
    expect(e[0]).toBeCloseTo(-Math.sqrt(1 - ab) * s[0], 12)
    expect(e[1]).toBeCloseTo(-Math.sqrt(1 - ab) * s[1], 12)
  })
  it('epsilon ≈ x_t when ᾱ → 0 (pure noise)', () => {
    const e = epsilon([0.5, -0.3], comps, ALPHA_BAR_MIN)
    expect(e[0]).toBeCloseTo(0.5, 1)
    expect(e[1]).toBeCloseTo(-0.3, 1)
  })
  it('classComps renormalises weights', () => {
    const c = classComps(comps, 0)
    expect(c).toHaveLength(2)
    expect(c[0].weight + c[1].weight).toBeCloseTo(1, 12)
  })
  it('is finite far from data', () => {
    const s = noisedScore([80, -80], comps, 0.999)
    expect(Number.isFinite(s[0]) && Number.isFinite(s[1])).toBe(true)
  })
  it('sampleData respects weights', () => {
    const d = sampleData(comps, 4000, mulberry32(1))
    const frac1 = d.filter((p) => p.label === 1).length / d.length
    expect(Math.abs(frac1 - 0.5)).toBeLessThan(0.03)
  })
})
```

`src/topics/cfg/lib/cfg.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { cfgCombine, predictX0, sampleCFG, sampleStats } from './cfg'
import type { Comp2D, Vec2 } from './gmm2d'

const two: Comp2D[] = [
  { mean: [2, 0], std: 0.3, weight: 0.5, label: 0 },
  { mean: [-2, 0], std: 0.3, weight: 0.5, label: 1 },
]
const meanOf = (xs: Vec2[], k: 0 | 1) => xs.reduce((a, p) => a + p[k], 0) / xs.length
const stdOf = (xs: Vec2[], k: 0 | 1) => { const m = meanOf(xs, k); return Math.sqrt(xs.reduce((a, p) => a + (p[k] - m) ** 2, 0) / xs.length) }

describe('cfgCombine', () => {
  const eU: Vec2 = [1, 2], eC: Vec2 = [3, 1]
  it('s = 0 → unconditional, s = 1 → conditional', () => {
    expect(cfgCombine(eU, eC, 0)).toEqual(eU)
    expect(cfgCombine(eU, eC, 1)).toEqual(eC)
  })
  it('extrapolates beyond ε_y when s > 1', () => {
    expect(cfgCombine(eU, eC, 3)).toEqual([7, -1])
  })
})

describe('predictX0 (第 6 步检验题)', () => {
  it('combining x̂0 equals x̂0 of the combined ε', () => {
    const x: Vec2 = [0.4, -1.2], ab = 0.37, s = 2.5
    const eU: Vec2 = [0.3, 0.1], eC: Vec2 = [-0.2, 0.9]
    const a = predictX0(x, eU, ab), b = predictX0(x, eC, ab)
    const viaX0: Vec2 = [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])]
    const viaEps = predictX0(x, cfgCombine(eU, eC, s), ab)
    expect(viaX0[0]).toBeCloseTo(viaEps[0], 12)
    expect(viaX0[1]).toBeCloseTo(viaEps[1], 12)
  })
})

describe('sampleCFG', () => {
  it('s = 1 recovers the class distribution', () => {
    const { samples } = sampleCFG({ comps: two, label: 0, s: 1, n: 2000, steps: 100, seed: 1 })
    expect(meanOf(samples, 0)).toBeCloseTo(2, 1)
    expect(Math.abs(meanOf(samples, 1))).toBeLessThan(0.05)
    expect(stdOf(samples, 0)).toBeGreaterThan(0.2)
    expect(stdOf(samples, 0)).toBeLessThan(0.4)
  })
  it('s = 0 ignores the label (≈ half on each side)', () => {
    const { samples } = sampleCFG({ comps: two, label: 0, s: 0, n: 2000, steps: 100, seed: 2 })
    const right = samples.filter((p) => p[0] > 0).length / samples.length
    expect(right).toBeGreaterThan(0.4)
    expect(right).toBeLessThan(0.6)
  })
  it('larger s pushes samples away from the other class', () => {
    const m1 = meanOf(sampleCFG({ comps: two, label: 0, s: 1, n: 1500, steps: 60, seed: 3 }).samples, 0)
    const m4 = meanOf(sampleCFG({ comps: two, label: 0, s: 4, n: 1500, steps: 60, seed: 3 }).samples, 0)
    expect(m4).toBeGreaterThan(m1 + 0.05)
  })
  it('stays finite for extreme s and is deterministic', () => {
    const a = sampleCFG({ comps: two, label: 1, s: 12, n: 300, steps: 40, seed: 9, keepPaths: 5 })
    const b = sampleCFG({ comps: two, label: 1, s: 12, n: 300, steps: 40, seed: 9, keepPaths: 5 })
    expect(a.samples.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))).toBe(true)
    expect(a.samples).toEqual(b.samples)
    expect(a.paths).toHaveLength(5)
    expect(a.paths[0]).toHaveLength(41)
  })
})

describe('sampleStats', () => {
  it('spread is 0 for identical points; outside counts far points', () => {
    expect(sampleStats([[2, 0], [2, 0]], two).spread).toBe(0)
    expect(sampleStats([[2, 0]], two).outsideFrac).toBe(0)
    expect(sampleStats([[9, 9]], two).outsideFrac).toBe(1)
  })
})
```

`src/topics/cfg/lib/toy1d.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { classifierGradStrength } from './toy1d'

describe('classifierGradStrength', () => {
  it('is small at both ends and peaks in the middle', () => {
    const mid = Math.max(...[0.3, 0.4, 0.5, 0.6, 0.7].map((t) => classifierGradStrength(t)))
    expect(classifierGradStrength(0.02)).toBeLessThan(mid / 3)
    expect(classifierGradStrength(0.99)).toBeLessThan(mid / 3)
  })
  it('is finite and non-negative on [0, 1]', () => {
    for (let i = 0; i <= 50; i++) {
      const g = classifierGradStrength(i / 50)
      expect(Number.isFinite(g) && g >= 0).toBe(true)
    }
  })
})
```

`src/topics/cfg/lib/forwardNoise.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { forwardNoise, gaussianField, toRGBA, toSigned } from './forwardNoise'

describe('forwardNoise', () => {
  const rgba = new Uint8ClampedArray([0, 128, 255, 255, 10, 20, 30, 255])
  it('toSigned/toRGBA round-trip within 1 level', () => {
    const back = toRGBA(toSigned(rgba))
    for (let i = 0; i < rgba.length; i++) expect(Math.abs(back[i] - rgba[i])).toBeLessThanOrEqual(1)
  })
  it('ᾱ = 1 returns the image, ᾱ = 0 returns the noise', () => {
    const x0 = toSigned(rgba), n = gaussianField(x0.length, 1)
    expect(Array.from(forwardNoise(x0, n, 1))).toEqual(Array.from(x0))
    expect(Array.from(forwardNoise(x0, n, 0))).toEqual(Array.from(n))
  })
  it('toRGBA clamps out-of-range values', () => {
    const out = toRGBA(new Float32Array([-5, 5, 0]))
    expect([out[0], out[1], out[3]]).toEqual([0, 255, 255])
  })
})
```

`src/topics/cfg/lib/labelDropout.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { dropLabels } from './labelDropout'
import { mulberry32 } from './prng'

describe('dropLabels', () => {
  const labels = Array.from({ length: 10000 }, (_, i) => i % 7)
  it('p = 0 keeps all, p = 1 drops all', () => {
    expect(dropLabels(labels, 0, mulberry32(1)).every((l) => l !== null)).toBe(true)
    expect(dropLabels(labels, 1, mulberry32(1)).every((l) => l === null)).toBe(true)
  })
  it('p = 0.1 drops ≈ 10%', () => {
    const out = dropLabels(labels, 0.1, mulberry32(2))
    const frac = out.filter((l) => l === null).length / out.length
    expect(Math.abs(frac - 0.1)).toBeLessThan(0.015)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `rm src/smoke.test.ts && npx vitest run src/topics/cfg/lib` → Expected: 全部 FAIL（模块不存在）

- [ ] **Step 3: 实现**

`src/topics/cfg/lib/math.ts`:
```ts
export function logSumExp(xs: number[]): number {
  const m = Math.max(...xs)
  if (m === -Infinity) return -Infinity
  return m + Math.log(xs.reduce((a, x) => a + Math.exp(x - m), 0))
}

export function sigmoid(x: number): number {
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x))
}
```

`src/topics/cfg/lib/prng.ts`:
```ts
/** 可设种子的均匀随机数，返回 [0, 1) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box–Muller 标准正态 */
export function gaussian(rand: () => number): number {
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}
```

`src/topics/cfg/lib/sharpen.ts`:
```ts
/** 第 1 步：按 p^s 重新加权再归一化。在 log 空间计算，s 很大时也不会下溢 */
export function sharpenWeights(probs: number[], s: number): number[] {
  const logs = probs.map((p) => (p === 0 ? (s === 0 ? 0 : -Infinity) : s * Math.log(p)))
  const m = Math.max(...logs)
  const w = logs.map((l) => Math.exp(l - m))
  const z = w.reduce((a, b) => a + b, 0)
  return w.map((x) => x / z)
}

/** 网格上的 p(x)·p(y|x)^s，按梯形法则归一化为密度 */
export function sharpenCurve(xs: number[], px: number[], pyx: number[], s: number): number[] {
  const logs = xs.map((_, i) => Math.log(px[i]) + s * Math.log(pyx[i]))
  const m = Math.max(...logs)
  const u = logs.map((l) => Math.exp(l - m))
  let area = 0
  for (let i = 1; i < xs.length; i++) area += ((u[i] + u[i - 1]) / 2) * (xs[i] - xs[i - 1])
  return u.map((v) => v / area)
}
```

`src/topics/cfg/lib/mixture1d.ts`:
```ts
import { logSumExp } from './math'

/** 第 2 步“磁铁”例子：x_t = x_0 + σ·ε，x_0 取自若干个点 */
const uniform = (n: number) => Array.from({ length: n }, () => 1 / n)

function logTerms(xt: number, centers: number[], sigma: number, weights: number[]): number[] {
  return centers.map((c, i) => Math.log(weights[i]) - (xt - c) ** 2 / (2 * sigma ** 2))
}

export function mixturePosterior(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number[] {
  const logs = logTerms(xt, centers, sigma, weights)
  const lse = logSumExp(logs)
  return logs.map((l) => Math.exp(l - lse))
}

export function mixtureScore(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number {
  const post = mixturePosterior(xt, centers, sigma, weights)
  return post.reduce((acc, r, i) => acc + r * (-(xt - centers[i]) / sigma ** 2), 0)
}

export function mixtureLogDensity(xt: number, centers: number[], sigma: number, weights = uniform(centers.length)): number {
  return logSumExp(logTerms(xt, centers, sigma, weights)) - Math.log(sigma * Math.sqrt(2 * Math.PI))
}
```

`src/topics/cfg/lib/schedule.ts`:
```ts
/** cosine schedule（Nichol & Dhariwal 2021），t ∈ [0, 1] */
const S = 0.008
const f = (t: number) => Math.cos(((t + S) / (1 + S)) * (Math.PI / 2)) ** 2

export const ALPHA_BAR_MIN = 1e-4

export function alphaBar(t: number): number {
  return Math.min(1, Math.max(ALPHA_BAR_MIN, f(t) / f(0)))
}

/** DDIM 采样用的时间点，从 1（纯噪声）到 0（数据） */
export function ddimTimes(steps: number): number[] {
  return Array.from({ length: steps + 1 }, (_, i) => 1 - i / steps)
}
```

`src/topics/cfg/lib/gmm2d.ts`:
```ts
import { logSumExp } from './math'
import { gaussian } from './prng'

export type Vec2 = [number, number]
export interface Comp2D { mean: Vec2; std: number; weight: number; label: number }

/** 加噪到 ᾱ 时，每个高斯分量变成 N(√ᾱ·μ, (ᾱσ² + 1 − ᾱ) I)，所以 p_t 与它的 score 都有解析式 */
function noised(c: Comp2D, ab: number) {
  const a = Math.sqrt(ab)
  return { mu: [a * c.mean[0], a * c.mean[1]] as Vec2, v: ab * c.std ** 2 + (1 - ab) }
}

function logTerms(x: Vec2, comps: Comp2D[], ab: number): number[] {
  return comps.map((c) => {
    const { mu, v } = noised(c, ab)
    const d2 = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2
    return Math.log(c.weight) - d2 / (2 * v) - Math.log(2 * Math.PI * v)
  })
}

export function responsibilities(x: Vec2, comps: Comp2D[], ab: number): number[] {
  const logs = logTerms(x, comps, ab)
  const lse = logSumExp(logs)
  return logs.map((l) => Math.exp(l - lse))
}

export function noisedLogDensity(x: Vec2, comps: Comp2D[], ab: number): number {
  return logSumExp(logTerms(x, comps, ab))
}

export function noisedScore(x: Vec2, comps: Comp2D[], ab: number): Vec2 {
  const r = responsibilities(x, comps, ab)
  let sx = 0, sy = 0
  comps.forEach((c, i) => {
    const { mu, v } = noised(c, ab)
    sx += r[i] * (-(x[0] - mu[0]) / v)
    sy += r[i] * (-(x[1] - mu[1]) / v)
  })
  return [sx, sy]
}

/** 第 2 步的“词典”：ε = −√(1−ᾱ) · score */
export function epsilon(x: Vec2, comps: Comp2D[], ab: number): Vec2 {
  const s = noisedScore(x, comps, ab)
  const c = Math.sqrt(1 - ab)
  return [-c * s[0], -c * s[1]]
}

export function classComps(comps: Comp2D[], label: number): Comp2D[] {
  const sel = comps.filter((c) => c.label === label)
  const z = sel.reduce((a, c) => a + c.weight, 0)
  return sel.map((c) => ({ ...c, weight: c.weight / z }))
}

export function sampleData(comps: Comp2D[], n: number, rand: () => number): { x: Vec2; label: number }[] {
  const total = comps.reduce((a, c) => a + c.weight, 0)
  return Array.from({ length: n }, () => {
    let u = rand() * total, k = 0
    while (k < comps.length - 1 && u > comps[k].weight) { u -= comps[k].weight; k++ }
    const c = comps[k]
    return { x: [c.mean[0] + c.std * gaussian(rand), c.mean[1] + c.std * gaussian(rand)] as Vec2, label: c.label }
  })
}
```

`src/topics/cfg/lib/cfg.ts`:
```ts
import { classComps, epsilon, type Comp2D, type Vec2 } from './gmm2d'
import { gaussian, mulberry32 } from './prng'
import { alphaBar, ddimTimes } from './schedule'

/** 第 4 步核心公式：ε̂ = ε∅ + s (ε_y − ε∅) */
export function cfgCombine(eU: Vec2, eC: Vec2, s: number): Vec2 {
  return [eU[0] + s * (eC[0] - eU[0]), eU[1] + s * (eC[1] - eU[1])]
}

export function predictX0(x: Vec2, eps: Vec2, ab: number): Vec2 {
  const a = Math.sqrt(ab), c = Math.sqrt(1 - ab)
  return [(x[0] - c * eps[0]) / a, (x[1] - c * eps[1]) / a]
}

/** 确定性 DDIM（η = 0） */
export function ddimStep(x: Vec2, eps: Vec2, ab: number, abPrev: number): Vec2 {
  const x0 = predictX0(x, eps, ab)
  const a = Math.sqrt(abPrev), c = Math.sqrt(1 - abPrev)
  return [a * x0[0] + c * eps[0], a * x0[1] + c * eps[1]]
}

export interface SampleOptions {
  comps: Comp2D[]
  label: number
  s: number
  n: number
  steps: number
  seed: number
  keepPaths?: number
}
export interface SampleResult { samples: Vec2[]; paths: Vec2[][] }

/** 第 6 步的采样循环：每步算 ε_y 与 ε∅，用 CFG 组合，再交给原样的 DDIM 更新 */
export function sampleCFG(o: SampleOptions): SampleResult {
  const rand = mulberry32(o.seed)
  const cond = classComps(o.comps, o.label)
  const ts = ddimTimes(o.steps)
  const xs: Vec2[] = Array.from({ length: o.n }, () => [gaussian(rand), gaussian(rand)])
  const keep = Math.min(o.keepPaths ?? 0, o.n)
  const paths: Vec2[][] = xs.slice(0, keep).map((x) => [x])
  for (let i = 0; i < o.steps; i++) {
    const ab = alphaBar(ts[i]), abPrev = alphaBar(ts[i + 1])
    for (let k = 0; k < xs.length; k++) {
      const e = cfgCombine(epsilon(xs[k], o.comps, ab), epsilon(xs[k], cond, ab), o.s)
      xs[k] = ddimStep(xs[k], e, ab, abPrev)
      if (k < keep) paths[k].push(xs[k])
    }
  }
  return { samples: xs, paths }
}

/** 类内散度（到质心的平均距离）与“冲出数据范围”（离所有分量都超过 3σ）的比例 */
export function sampleStats(samples: Vec2[], comps: Comp2D[]): { spread: number; outsideFrac: number } {
  const n = samples.length
  const cx = samples.reduce((a, p) => a + p[0], 0) / n
  const cy = samples.reduce((a, p) => a + p[1], 0) / n
  const spread = samples.reduce((a, p) => a + Math.hypot(p[0] - cx, p[1] - cy), 0) / n
  const outside = samples.filter((p) =>
    comps.every((c) => Math.hypot(p[0] - c.mean[0], p[1] - c.mean[1]) > 3 * c.std),
  ).length
  return { spread, outsideFrac: outside / n }
}
```

`src/topics/cfg/lib/toy1d.ts`:
```ts
import { sigmoid } from './math'
import { alphaBar } from './schedule'

/**
 * 一维双类玩具模型：两类分别在 ±1，类内标准差 sigma0，等权重。
 * 返回类别 +1 的样本在噪声水平 t 时 |∇ log p_t(y=+1 | x_t)| 的期望。
 * 等方差两类的对数几率是线性的：log p(+|x) − log p(−|x) = 2√ᾱ·x / v。
 */
export function classifierGradStrength(t: number, sigma0 = 0.2): number {
  const ab = alphaBar(t)
  const a = Math.sqrt(ab)
  const v = ab * sigma0 ** 2 + (1 - ab)
  const sd = Math.sqrt(v)
  const k = (2 * a) / v
  const N = 2001
  let acc = 0, wsum = 0
  for (let i = 0; i < N; i++) {
    const x = a - 8 * sd + (16 * sd * i) / (N - 1)
    const w = Math.exp(-((x - a) ** 2) / (2 * v))
    acc += w * k * (1 - sigmoid(k * x))
    wsum += w
  }
  return acc / wsum
}
```

`src/topics/cfg/lib/forwardNoise.ts`:
```ts
import { gaussian, mulberry32 } from './prng'

/** RGBA [0,255] → RGB [-1,1]（每像素 3 个数） */
export function toSigned(rgba: Uint8ClampedArray): Float32Array {
  const n = rgba.length / 4
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] = rgba[i * 4 + c] / 127.5 - 1
  return out
}

export function toRGBA(signed: Float32Array): Uint8ClampedArray {
  const n = signed.length / 3
  const out = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round((signed[i * 3 + c] + 1) * 127.5)
    out[i * 4 + 3] = 255
  }
  return out
}

/** x_t = √ᾱ · x_0 + √(1−ᾱ) · ε */
export function forwardNoise(x0: Float32Array, noise: Float32Array, ab: number): Float32Array {
  const a = Math.sqrt(ab), c = Math.sqrt(1 - ab)
  const out = new Float32Array(x0.length)
  for (let i = 0; i < x0.length; i++) out[i] = a * x0[i] + c * noise[i]
  return out
}

export function gaussianField(n: number, seed: number): Float32Array {
  const rand = mulberry32(seed)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = gaussian(rand)
  return out
}
```

`src/topics/cfg/lib/labelDropout.ts`:
```ts
/** 第 5 步：每个样本独立地以概率 p 把条件换成空标记（null 表示 ∅） */
export function dropLabels<T>(labels: T[], p: number, rand: () => number): (T | null)[] {
  return labels.map((l) => (rand() < p ? null : l))
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run src/topics/cfg/lib` → Expected: 全部 PASS。若 `sampleCFG` 统计用例失败，先检查 `ddimTimes` 方向（必须从 1 到 0）和 `alphaBar` 截断，**不要放宽容差**；确属离散化误差时可把 `steps` 提高到 200 再验证。

- [ ] **Step 5: Checkpoint** — `npm run test` 全部通过。

---

### Task 4: 共用内容组件 + 全站样式

**Files:**
- Create: `src/kb/children.ts`、`src/kb/children.test.ts`
- Create: `src/kb/components/{Step,KeyPoint,Detail,Pitfall,Quiz,Derivation,Figure,Demo,Slider,Tex,Flashcards,Roadmap}.tsx`
- Modify: `src/kb/mdx-components.tsx`（注册全部组件）
- Create: `src/styles/{tokens,base,prose,kb,demo}.css`；Modify: `src/main.tsx`（引入 CSS）
- Modify: `src/topics/cfg/index.mdx`（临时样例：每个组件用一次，用于肉眼检查）

**Interfaces:**
- Consumes: `useReviewMode`、`usePersistentState`、`scrollToId`（Task 2）
- Produces（MDX 中可直接使用，无需 import）:
  - `<Step id n title gist>` — `n: number`，`gist: string`
  - `<KeyPoint>`、`<Detail>`、`<Pitfall title?>`
  - `<Quiz title?>…<Answer>…</Answer></Quiz>`
  - `<Derivation>`：每个直接子元素是一步
  - `<Figure src? alt? caption? source?={{label, href}} placeholder? wide?>`
  - `<Flashcards topic>` 内含 `<Card id><Front>…</Front><Back>…</Back></Card>`
  - `<Roadmap nodes={RoadNode[]}>`，`RoadNode = { id: string; label: string; sub: string; kind: 'goal' | 'basis' | 'pre' | 'core' }`
  - 演示组件使用（需 import）：`<Demo title hint? onReset?>`、`<Slider label value min max step onChange format?>`、`<Tex block?>{string}</Tex>`

- [ ] **Step 0: 加载设计 skill**

先调用 `frontend-design` skill 和 `dataviz` skill 并阅读，按其要求校准下面 `tokens.css` 的配色、字体与图表规范（例如用 dataviz 自带的校验脚本检查四个角色色的可区分性和对比度）。如有调整，只改 `tokens.css` 里的变量值，不改变量名。

- [ ] **Step 1: 写 children 失败测试**

`src/kb/children.test.ts`:
```ts
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { meaningfulChildren } from './children'

describe('meaningfulChildren', () => {
  it('drops whitespace-only strings and keeps elements', () => {
    const kids = ['\n', createElement('p', { key: 'a' }, 'x'), '  ', 'text']
    const out = meaningfulChildren(kids)
    expect(out).toHaveLength(2)
    expect(out[1]).toBe('text')
  })
})
```

- [ ] **Step 2: 运行确认失败** — `npx vitest run src/kb/children.test.ts` → FAIL

- [ ] **Step 3: 实现 children + 组件**

`src/kb/children.ts`:
```ts
import { Children, type ReactNode } from 'react'

/** MDX 会把换行当作文本子节点，按“每个子元素是一项”处理前先去掉 */
export function meaningfulChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).filter((c) => !(typeof c === 'string' && c.trim() === ''))
}
```

`src/kb/components/Step.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Step({ id, n, title, gist, children }: { id: string; n: number; title: string; gist: string; children: ReactNode }) {
  return (
    <section id={id} className="kb-step">
      <header className="kb-step-head">
        <span className="kb-step-num">第 {n} 步</span>
        <h2>{title}</h2>
        <p className="kb-step-gist">{gist}</p>
      </header>
      {children}
    </section>
  )
}
```

`src/kb/components/KeyPoint.tsx`:
```tsx
import type { ReactNode } from 'react'

export function KeyPoint({ children }: { children: ReactNode }) {
  return (
    <aside className="kb-keypoint">
      <div className="kb-label">要点</div>
      {children}
    </aside>
  )
}
```

`src/kb/components/Pitfall.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Pitfall({ title = '容易混淆', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="kb-pitfall">
      <div className="kb-label">{title}</div>
      {children}
    </aside>
  )
}
```

`src/kb/components/Detail.tsx`:
```tsx
import { useState, type ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Detail({ children }: { children: ReactNode }) {
  const { review } = useReviewMode()
  const [open, setOpen] = useState(false)
  if (review && !open)
    return (
      <button type="button" className="kb-detail-toggle" onClick={() => setOpen(true)}>
        展开讲解 ▾
      </button>
    )
  return (
    <div className="kb-detail">
      {children}
      {review && (
        <button type="button" className="kb-detail-toggle" onClick={() => setOpen(false)}>
          收起讲解 ▴
        </button>
      )}
    </div>
  )
}
```

`src/kb/components/Quiz.tsx`:
```tsx
import { isValidElement, useState, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'

export function Answer({ children }: { children: ReactNode }) {
  return <div className="kb-answer">{children}</div>
}

const isAnswer = (c: ReactNode) => isValidElement(c) && c.type === Answer

export function Quiz({ title = '检验一下', children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const items = meaningfulChildren(children)
  return (
    <aside className="kb-quiz">
      <div className="kb-label">{title}</div>
      {items.filter((c) => !isAnswer(c))}
      <button type="button" className="kb-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '收起答案' : '显示参考答案'}
      </button>
      {open && items.filter(isAnswer)}
    </aside>
  )
}
```

`src/kb/components/Derivation.tsx`:
```tsx
import { useState, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Derivation({ children }: { children: ReactNode }) {
  const { review } = useReviewMode()
  const items = meaningfulChildren(children)
  const [shown, setShown] = useState(1)
  if (review) return <div className="kb-deriv is-final">{items[items.length - 1]}</div>
  return (
    <div className="kb-deriv">
      <ol>
        {items.slice(0, shown).map((c, i) => (
          <li key={i} className={i === shown - 1 ? 'is-new' : undefined}>{c}</li>
        ))}
      </ol>
      <div className="kb-deriv-ctrl">
        {shown < items.length ? (
          <>
            <button type="button" className="kb-btn" onClick={() => setShown(shown + 1)}>
              下一步（{shown}/{items.length}）
            </button>
            <button type="button" className="kb-btn-ghost" onClick={() => setShown(items.length)}>全部展开</button>
          </>
        ) : (
          <span className="kb-muted">推导完成</span>
        )}
        {shown > 1 && <button type="button" className="kb-btn-ghost" onClick={() => setShown(1)}>重来</button>}
      </div>
    </div>
  )
}
```

`src/kb/components/Figure.tsx`:
```tsx
import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

interface FigureProps {
  src?: string
  alt?: string
  caption?: ReactNode
  source?: { label: string; href: string }
  placeholder?: string
  wide?: boolean
}

export function Figure({ src, alt = '', caption, source, placeholder, wide }: FigureProps) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className={wide ? 'kb-figure kb-wide' : 'kb-figure'}>
      {src ? (
        <img src={import.meta.env.BASE_URL + src} alt={alt} loading="lazy" />
      ) : (
        <div className="kb-placeholder" role="img" aria-label={placeholder}>
          <span>待补图片</span>
          {placeholder}
        </div>
      )}
      {(caption || source) && (
        <figcaption>
          {caption}
          {source && (
            <span className="kb-source">
              来源：<a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
```

`src/kb/components/Demo.tsx`:
```tsx
import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

export function Demo({ title, hint, onReset, children }: { title: string; hint?: ReactNode; onReset?: () => void; children: ReactNode }) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <section className="kb-demo" aria-label={title}>
      <header className="kb-demo-head">
        <span className="kb-demo-tag">交互</span>
        <strong>{title}</strong>
        {onReset && <button type="button" className="kb-btn-ghost" onClick={onReset}>重置</button>}
      </header>
      {hint && <p className="kb-demo-hint">{hint}</p>}
      <div className="kb-demo-body">{children}</div>
    </section>
  )
}
```

`src/kb/components/Slider.tsx`:
```tsx
import { useId, type ReactNode } from 'react'

interface SliderProps {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function Slider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(2) }: SliderProps) {
  const id = useId()
  return (
    <div className="kb-slider">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output htmlFor={id}>{format(value)}</output>
    </div>
  )
}
```

`src/kb/components/Tex.tsx`:
```tsx
import katex from 'katex'

/** 在 TSX（演示组件）里渲染公式；MDX 正文直接写 $...$ */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: block })
  return <span className={block ? 'kb-tex-block' : 'kb-tex'} dangerouslySetInnerHTML={{ __html: html }} />
}
```

`src/kb/components/Roadmap.tsx`:
```tsx
import { scrollToId } from '@/kb/scroll'

export interface RoadNode { id: string; label: string; sub: string; kind: 'goal' | 'basis' | 'pre' | 'core' }

const KIND: Record<RoadNode['kind'], string> = { goal: '动机', basis: '扩散基础', pre: '前身', core: 'CFG 本身' }

export function Roadmap({ nodes }: { nodes: RoadNode[] }) {
  return (
    <div className="kb-roadmap">
      <ol>
        {nodes.map((n, i) => (
          <li key={n.id} className={`kind-${n.kind}`}>
            <button type="button" onClick={() => scrollToId(n.id)}>
              <span className="kb-road-idx">{i + 1}</span>
              <span className="kb-road-label">{n.label}</span>
              <span className="kb-road-sub">{n.sub}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="kb-road-legend">
        {(Object.keys(KIND) as RoadNode['kind'][]).map((k) => (
          <span key={k} className={`kind-${k}`}><i aria-hidden />{KIND[k]}</span>
        ))}
      </div>
    </div>
  )
}
```

`src/kb/components/Flashcards.tsx`:
```tsx
import { isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { meaningfulChildren } from '@/kb/children'
import { usePersistentState } from '@/kb/state/usePersistentState'

export function Front({ children }: { children: ReactNode }) { return <>{children}</> }
export function Back({ children }: { children: ReactNode }) { return <>{children}</> }
/** 数据载体，由 Flashcards 负责渲染 */
export function Card(_: { id: string; children: ReactNode }) { return null }

type CardEl = ReactElement<{ id: string; children: ReactNode }>
const pick = (kids: ReactNode, type: unknown) => meaningfulChildren(kids).find((c) => isValidElement(c) && c.type === type)

export function Flashcards({ topic, children }: { topic: string; children: ReactNode }) {
  const cards = meaningfulChildren(children).filter((c): c is CardEl => isValidElement(c) && c.type === Card)
  const [mastered, setMastered] = usePersistentState<string[]>(`kb:${topic}:mastered`, [])
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [onlyTodo, setOnlyTodo] = useState(false)
  const ids = cards.map((c) => c.props.id)
  const done = mastered.filter((id) => ids.includes(id)).length
  const visible = cards.filter((c) => !onlyTodo || !mastered.includes(c.props.id))
  const flip = (id: string) => setFlipped({ ...flipped, [id]: !flipped[id] })
  const toggleMastered = (id: string) =>
    setMastered(mastered.includes(id) ? mastered.filter((x) => x !== id) : [...mastered, id])

  return (
    <div className="kb-cards">
      <div className="kb-cards-bar">
        <span>已掌握 <strong>{done}</strong> / {cards.length}</span>
        <div className="kb-meter"><div style={{ width: `${(done / Math.max(cards.length, 1)) * 100}%` }} /></div>
        <label><input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} /> 只看未掌握</label>
        <button type="button" className="kb-btn-ghost" onClick={() => setMastered([])}>清空记录</button>
      </div>
      {visible.length === 0 && <p className="kb-muted">全部掌握了 🎉</p>}
      <div className="kb-cards-grid">
        {visible.map((c) => {
          const id = c.props.id
          const isFlipped = !!flipped[id]
          return (
            <article key={id} className={isFlipped ? 'kb-card is-flipped' : 'kb-card'} data-card={id}>
              <div
                className="kb-card-face"
                role="button"
                tabIndex={0}
                aria-expanded={isFlipped}
                onClick={() => flip(id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(id) } }}
              >
                <span className="kb-card-side">{isFlipped ? '答案' : '问题'}</span>
                {isFlipped ? pick(c.props.children, Back) : pick(c.props.children, Front)}
              </div>
              <label className="kb-card-check">
                <input type="checkbox" checked={mastered.includes(id)} onChange={() => toggleMastered(id)} /> 已掌握
              </label>
            </article>
          )
        })}
      </div>
    </div>
  )
}
```

`src/kb/mdx-components.tsx`（替换）:
```tsx
import type { MDXComponents } from 'mdx/types'
import { Step } from './components/Step'
import { KeyPoint } from './components/KeyPoint'
import { Detail } from './components/Detail'
import { Pitfall } from './components/Pitfall'
import { Answer, Quiz } from './components/Quiz'
import { Derivation } from './components/Derivation'
import { Figure } from './components/Figure'
import { Back, Card, Flashcards, Front } from './components/Flashcards'
import { Roadmap } from './components/Roadmap'

export const mdxComponents: MDXComponents = {
  Step, KeyPoint, Detail, Pitfall, Quiz, Answer, Derivation, Figure, Flashcards, Card, Front, Back, Roadmap,
  a: (props) => <a {...props} target={props.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" />,
  table: (props) => <div className="kb-table-wrap"><table {...props} /></div>,
}
```

- [ ] **Step 4: 写样式**

`src/styles/tokens.css`:
```css
:root {
  --paper: #fbf8f1;
  --paper-2: #f3eee3;
  --card: #fffdf8;
  --ink: #23201b;
  --ink-2: #5d574d;
  --ink-3: #8a8377;
  --rule: #e2dacb;
  --accent: #a2421f;
  --accent-soft: #f4e3d9;
  --key: #2c5f7c;
  --key-soft: #e4eef3;
  --warn: #8a5a00;
  --warn-soft: #f8eed5;

  /* 图表角色色：全站固定（Task 4 Step 0 用 dataviz 校验后可调整取值） */
  --c-uncond: #7b8794;
  --c-cond: #2f6f9f;
  --c-guided: #c4512a;
  --c-data: #b9b1a2;

  --serif: "Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
  --sans: "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", system-ui, -apple-system, sans-serif;
  --mono: "JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace;

  --measure: 44rem;
  --radius: 6px;
  --shadow: 0 1px 2px rgb(60 45 20 / 6%), 0 4px 16px rgb(60 45 20 / 6%);
}
```

`src/styles/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 4.5rem; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--serif); font-size: 17px; line-height: 1.8; }
button { font: inherit; color: inherit; cursor: pointer; }
img { max-width: 100%; display: block; }
a { color: var(--accent); text-underline-offset: 2px; }

.kb-topbar {
  position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
  padding: 0.6rem 1.5rem; background: color-mix(in srgb, var(--paper) 92%, transparent);
  backdrop-filter: blur(6px); border-bottom: 1px solid var(--rule); font-family: var(--sans);
}
.kb-brand { color: var(--ink); text-decoration: none; font-weight: 600; letter-spacing: 0.02em; }
.kb-seg { display: inline-flex; border: 1px solid var(--rule); border-radius: 999px; overflow: hidden; font-family: var(--sans); font-size: 0.85rem; }
.kb-seg button { border: 0; background: transparent; padding: 0.25rem 0.9rem; }
.kb-seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }

.kb-main { padding: 2rem 1.5rem 6rem; }
.kb-home { max-width: 60rem; margin: 0 auto; }
.kb-home-head h1 { font-size: 2.4rem; margin: 1rem 0 0.25rem; }
.kb-topic-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1.25rem; }
.kb-topic-card { display: block; height: 100%; padding: 1.25rem 1.4rem; background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius); color: inherit; text-decoration: none; box-shadow: var(--shadow); transition: transform .15s, border-color .15s; }
.kb-topic-card:hover { transform: translateY(-2px); border-color: var(--accent); }
.kb-topic-card h2 { margin: 0.2rem 0 0.4rem; font-size: 1.35rem; }
.kb-topic-card p { margin: 0 0 0.8rem; color: var(--ink-2); font-size: 0.95rem; line-height: 1.7; }
.kb-card-meta, .kb-eyebrow { font-family: var(--sans); font-size: 0.78rem; color: var(--ink-3); letter-spacing: 0.04em; }
.kb-lede { color: var(--ink-2); font-size: 1.05rem; }
.kb-notfound, .kb-loading { max-width: var(--measure); margin: 4rem auto; text-align: center; font-family: var(--sans); }

.kb-topic { display: grid; grid-template-columns: 15rem minmax(0, var(--measure)); gap: 3rem; justify-content: center; }
.kb-topic-side { position: relative; }
.kb-toc { position: sticky; top: 5rem; font-family: var(--sans); font-size: 0.86rem; }
.kb-toc-title { font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; margin-bottom: 0.5rem; }
.kb-toc ol { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--rule); }
.kb-toc button { display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left; border: 0; background: none; padding: 0.3rem 0.75rem; color: var(--ink-2); margin-left: -1px; border-left: 2px solid transparent; }
.kb-toc button:hover { color: var(--ink); }
.kb-toc button.is-active { color: var(--accent); border-left-color: var(--accent); font-weight: 600; }
.kb-toc-dot { width: 6px; height: 6px; border-radius: 50%; border: 1px solid var(--ink-3); flex: none; }
.kb-toc-dot.is-read { background: var(--ink-3); }
.kb-toc-progress { margin-top: 1rem; color: var(--ink-3); font-size: 0.78rem; }
.kb-meter { height: 4px; background: var(--paper-2); border-radius: 2px; overflow: hidden; margin-top: 0.3rem; }
.kb-meter > div { height: 100%; background: var(--accent); transition: width .3s; }

@media (max-width: 960px) {
  .kb-topic { grid-template-columns: minmax(0, 1fr); }
  .kb-topic-side { display: none; }
}
```

`src/styles/prose.css`:
```css
.kb-prose { min-width: 0; }
.kb-prose h1 { font-size: 2.5rem; line-height: 1.25; margin: 0.3rem 0 0.6rem; }
.kb-prose h2 { font-size: 1.7rem; line-height: 1.35; margin: 0; }
.kb-prose h3 { font-family: var(--sans); font-size: 1.08rem; margin: 2.2rem 0 0.6rem; }
.kb-prose p { margin: 0.9rem 0; }
.kb-prose strong { color: var(--ink); }
.kb-prose ul, .kb-prose ol { padding-left: 1.4rem; }
.kb-prose li { margin: 0.25rem 0; }
.kb-prose blockquote { margin: 1.2rem 0; padding: 0.2rem 1.2rem; border-left: 3px solid var(--accent); color: var(--ink-2); background: var(--accent-soft); }
.kb-prose hr { border: 0; border-top: 1px solid var(--rule); margin: 3rem 0; }
.kb-topic-head { padding-bottom: 1.5rem; border-bottom: 1px solid var(--rule); margin-bottom: 1rem; }

.kb-prose .katex { font-size: 1.05em; }
.kb-prose .katex-display { margin: 1.1rem 0; overflow-x: auto; overflow-y: hidden; padding: 0.2rem 0; }

.kb-table-wrap { overflow-x: auto; margin: 1.2rem 0; }
.kb-prose table { border-collapse: collapse; width: 100%; font-size: 0.93rem; font-family: var(--sans); }
.kb-prose th, .kb-prose td { border-bottom: 1px solid var(--rule); padding: 0.45rem 0.7rem; text-align: left; vertical-align: top; }
.kb-prose th { color: var(--ink-3); font-weight: 600; font-size: 0.8rem; letter-spacing: 0.03em; }

.kb-prose code { font-family: var(--mono); font-size: 0.86em; background: var(--paper-2); padding: 0.1em 0.35em; border-radius: 3px; }
.kb-prose pre { font-size: 0.85rem; line-height: 1.6; padding: 1rem 1.2rem; border-radius: var(--radius); border: 1px solid var(--rule); overflow-x: auto; }
.kb-prose pre code { background: none; padding: 0; }
```

`src/styles/kb.css`:
```css
.kb-step { padding-top: 3.5rem; }
.kb-step-head { margin-bottom: 1.2rem; }
.kb-step-num { font-family: var(--sans); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.12em; color: var(--accent); }
.kb-step-gist { margin: 0.4rem 0 0; font-size: 1.08rem; color: var(--ink-2); font-style: italic; }

.kb-label { font-family: var(--sans); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.3rem; }
.kb-keypoint, .kb-pitfall, .kb-quiz { margin: 1.4rem 0; padding: 0.9rem 1.2rem; border-radius: var(--radius); }
.kb-keypoint { background: var(--key-soft); border-left: 3px solid var(--key); }
.kb-keypoint .kb-label { color: var(--key); }
.kb-pitfall { background: var(--warn-soft); border-left: 3px solid var(--warn); }
.kb-pitfall .kb-label { color: var(--warn); }
.kb-quiz { background: var(--card); border: 1px dashed var(--rule); }
.kb-quiz .kb-label { color: var(--accent); }
.kb-answer { margin-top: 0.8rem; padding-top: 0.6rem; border-top: 1px solid var(--rule); }
.kb-keypoint > :last-child, .kb-pitfall > :last-child, .kb-quiz > :last-child { margin-bottom: 0; }

.kb-btn, .kb-btn-ghost, .kb-chip, .kb-detail-toggle { font-family: var(--sans); font-size: 0.82rem; border-radius: 999px; padding: 0.25rem 0.85rem; }
.kb-btn { background: var(--ink); color: var(--paper); border: 1px solid var(--ink); }
.kb-btn-ghost { background: transparent; border: 1px solid var(--rule); color: var(--ink-2); }
.kb-chip { background: var(--card); border: 1px solid var(--rule); }
.kb-chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
.kb-detail-toggle { display: block; margin: 0.6rem 0; background: none; border: 1px dashed var(--rule); color: var(--ink-3); }
.kb-muted { color: var(--ink-3); font-family: var(--sans); font-size: 0.85rem; }

.kb-deriv { margin: 1.2rem 0; padding: 0.6rem 1.2rem; background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius); }
.kb-deriv ol { margin: 0; padding-left: 1.2rem; }
.kb-deriv li.is-new { animation: kb-fade .4s ease; }
.kb-deriv-ctrl { display: flex; gap: 0.5rem; align-items: center; margin: 0.4rem 0 0.2rem; }
@keyframes kb-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.kb-figure { margin: 1.6rem 0; }
.kb-figure.kb-wide { margin-left: -4rem; margin-right: -4rem; }
.kb-figure img { border-radius: var(--radius); border: 1px solid var(--rule); }
.kb-figure figcaption { font-family: var(--sans); font-size: 0.82rem; color: var(--ink-3); margin-top: 0.5rem; line-height: 1.6; }
.kb-source { margin-left: 0.5rem; }
.kb-placeholder { aspect-ratio: 4 / 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; text-align: center; padding: 1rem; border: 2px dashed var(--rule); border-radius: var(--radius); color: var(--ink-3); font-family: var(--sans); font-size: 0.85rem; background: var(--paper-2); }
.kb-placeholder span { font-weight: 700; letter-spacing: 0.1em; font-size: 0.72rem; }
.kb-figrow { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.8rem; }
.kb-figrow .kb-figure { margin: 0.5rem 0; }

.kb-roadmap { margin: 1.5rem 0; font-family: var(--sans); }
.kb-roadmap ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr)); gap: 0.5rem; counter-reset: road; }
.kb-roadmap li { position: relative; }
.kb-roadmap button { width: 100%; height: 100%; text-align: left; padding: 0.6rem 0.7rem; background: var(--card); border: 1px solid var(--rule); border-top: 3px solid var(--k); border-radius: var(--radius); display: flex; flex-direction: column; gap: 0.1rem; }
.kb-roadmap button:hover { box-shadow: var(--shadow); }
.kb-road-idx { font-size: 0.7rem; color: var(--ink-3); }
.kb-road-label { font-weight: 600; font-size: 0.9rem; }
.kb-road-sub { font-size: 0.75rem; color: var(--ink-3); line-height: 1.4; }
.kb-road-legend { display: flex; gap: 1rem; margin-top: 0.6rem; font-size: 0.75rem; color: var(--ink-3); }
.kb-road-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--k); margin-right: 0.3rem; vertical-align: -1px; }
.kind-goal { --k: var(--warn); }
.kind-basis { --k: var(--c-uncond); }
.kind-pre { --k: var(--c-cond); }
.kind-core { --k: var(--accent); }

.kb-cards-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-family: var(--sans); font-size: 0.85rem; margin: 1rem 0; }
.kb-cards-bar .kb-meter { flex: 1; min-width: 6rem; }
.kb-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: 1rem; }
.kb-card { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius); box-shadow: var(--shadow); }
.kb-card.is-flipped { border-color: var(--key); }
.kb-card-face { flex: 1; padding: 0.9rem 1.1rem; cursor: pointer; font-size: 0.95rem; line-height: 1.7; }
.kb-card-face:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.kb-card-side { font-family: var(--sans); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; color: var(--ink-3); }
.kb-card.is-flipped .kb-card-side { color: var(--key); }
.kb-card-check { padding: 0.4rem 1.1rem 0.6rem; border-top: 1px solid var(--rule); font-family: var(--sans); font-size: 0.8rem; color: var(--ink-2); }

[data-review="on"] .kb-step { padding-top: 2rem; }
```

`src/styles/demo.css`:
```css
.kb-demo { margin: 1.8rem -2rem; padding: 1rem 1.4rem 1.2rem; background: var(--card); border: 1px solid var(--rule); border-radius: 10px; box-shadow: var(--shadow); font-family: var(--sans); font-size: 0.9rem; line-height: 1.6; }
.kb-demo-head { display: flex; align-items: center; gap: 0.6rem; }
.kb-demo-head strong { flex: 1; font-size: 0.98rem; }
.kb-demo-tag { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; color: #fff; background: var(--accent); padding: 0.05rem 0.45rem; border-radius: 3px; }
.kb-demo-hint { color: var(--ink-2); margin: 0.4rem 0 0.8rem; }
.kb-demo-body { display: flex; flex-direction: column; gap: 0.8rem; }
.kb-demo-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 1.2rem; align-items: center; }
.kb-demo-note { color: var(--ink-2); margin: 0; }
.kb-demo-readout { display: flex; flex-wrap: wrap; gap: 0.4rem 1.4rem; font-variant-numeric: tabular-nums; color: var(--ink-2); }
.kb-demo-readout b { color: var(--ink); font-weight: 600; }
.kb-presets { display: flex; flex-wrap: wrap; gap: 0.4rem; }
@media (max-width: 760px) { .kb-demo { margin: 1.5rem 0; } .kb-demo-grid { grid-template-columns: 1fr; } }

.kb-slider { display: grid; grid-template-columns: 7.5rem 1fr 3.5rem; align-items: center; gap: 0.8rem; }
.kb-slider label { color: var(--ink-2); }
.kb-slider input[type="range"] { width: 100%; accent-color: var(--accent); }
.kb-slider output { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }

.kb-chart { width: 100%; height: auto; overflow: visible; }
.kb-chart text { font-family: var(--sans); font-size: 11px; fill: var(--ink-3); }
.kb-chart .axis { stroke: var(--rule); stroke-width: 1; }
.kb-chart .grid { stroke: var(--paper-2); stroke-width: 1; }
.stroke-ref { fill: none; stroke: var(--ink-3); stroke-width: 1.5; stroke-dasharray: 4 4; }
.stroke-uncond { fill: none; stroke: var(--c-uncond); stroke-width: 2; }
.stroke-cond { fill: none; stroke: var(--c-cond); stroke-width: 2; }
.stroke-guided { fill: none; stroke: var(--c-guided); stroke-width: 2.5; }
.fill-guided { fill: color-mix(in srgb, var(--c-guided) 22%, transparent); stroke: var(--c-guided); stroke-width: 2; }
.fill-data { fill: color-mix(in srgb, var(--c-data) 35%, transparent); stroke: none; }
.bg-uncond { background: var(--c-uncond); }
.bg-cond { background: var(--c-cond); }
.bg-guided { background: var(--c-guided); }

.kb-legend { display: flex; flex-wrap: wrap; gap: 0.9rem; font-size: 0.8rem; color: var(--ink-2); }
.kb-legend i { display: inline-block; width: 12px; height: 3px; border-radius: 2px; margin-right: 0.35rem; vertical-align: middle; }

.kb-bars { display: flex; flex-direction: column; gap: 0.6rem; }
.kb-bar-row { display: grid; grid-template-columns: 6.5rem 1fr 3.6rem; align-items: center; gap: 0.6rem; }
.kb-bar-row small { display: block; color: var(--ink-3); font-size: 0.72rem; }
.kb-bar-track { height: 14px; background: var(--paper-2); border-radius: 7px; overflow: hidden; }
.kb-bar-track > div { height: 100%; border-radius: 7px; transition: width .2s; }
.kb-bar-val { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }

.kb-num-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 0.85rem; }
.kb-num-table th, .kb-num-table td { padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--rule); text-align: right; }
.kb-num-table th:first-child, .kb-num-table td:first-child { text-align: left; }
.kb-num-table tr.is-total td { font-weight: 700; color: var(--c-guided); border-bottom: 0; }

.kb-canvas-wrap { position: relative; width: 100%; aspect-ratio: 1; max-width: 26rem; margin: 0 auto; }
.kb-canvas-wrap canvas, .kb-canvas-wrap svg { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: var(--radius); }
.kb-thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem; }
.kb-thumbs figure { margin: 0; text-align: center; font-size: 0.72rem; color: var(--ink-3); }
.kb-thumbs canvas { width: 100%; border-radius: 4px; }

.kb-tiles { display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.35rem; }
.kb-tile { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 5px; background: var(--key-soft); color: var(--key); font-size: 0.78rem; font-weight: 600; transition: background .2s; }
.kb-tile.is-null { background: var(--paper-2); color: var(--ink-3); }
.kb-tile.is-null s { font-weight: 400; font-size: 0.65rem; }
.kb-tile .kb-null { font-size: 1.2rem; }
@media (max-width: 600px) { .kb-tiles { grid-template-columns: repeat(4, 1fr); } }

.kb-flow-code { margin: 0; font-family: var(--mono); font-size: 0.78rem; line-height: 1.7; background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius); padding: 0.6rem 0; overflow-x: auto; }
.kb-flow-code span { display: block; padding: 0 0.9rem; white-space: pre; }
.kb-flow-code span.is-hot { background: var(--accent-soft); box-shadow: inset 3px 0 var(--accent); }
.kb-flow-box { fill: var(--card); stroke: var(--rule); stroke-width: 1.2; }
.kb-flow-box.is-hot { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 2; }
.kb-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 0 0.4rem; border-radius: 3px; background: var(--warn-soft); color: var(--warn); }
.kb-tex-block { display: block; overflow-x: auto; }
```

`src/main.tsx`（替换引入）:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/prose.css'
import '@/styles/kb.css'
import '@/styles/demo.css'
import { App } from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: 临时样例页**

`src/topics/cfg/index.mdx`（临时，Task 10 整体替换）:
```mdx
<Step id="overview" n={0} title="组件样例" gist="每个共用组件用一次">

<KeyPoint>

核心公式 $\hat\epsilon = \epsilon_\varnothing + s(\epsilon_y - \epsilon_\varnothing)$

</KeyPoint>

<Detail>

讲解正文，复习模式下会折叠。

$$
\nabla_x \log p(x)
$$

</Detail>

<Pitfall>$s$ 只影响采样，不影响训练。</Pitfall>

<Quiz>

$s=0$ 对应什么分布？

<Answer>无条件分布 $p(x)$。</Answer>

</Quiz>

<Derivation>

$$a = b$$

$$b = c$$

$$a = c$$

</Derivation>

<Figure placeholder="一张狗的照片" caption="占位示例" />

<Flashcards topic="cfg">
<Card id="demo-1"><Front>问题 $x$</Front><Back>答案 $y$</Back></Card>
</Flashcards>

</Step>
```

- [ ] **Step 6: 验证**

Run: `npm run test` → Expected: 全部通过（含 children）
Run: `npm run build` → Expected: 无类型错误
Run: `npm run dev`，打开 `#/t/cfg`：公式正确渲染；推导可逐步展开；测验可显示答案；切到「复习」后讲解折叠、图片隐藏、推导只剩最后一行；卡片可翻面，勾选"已掌握"后刷新仍保持。

- [ ] **Step 7: Checkpoint**

---

### Task 5: 本地图片

**Files:**
- Create: `public/images/cfg/golden-retriever.jpg`、`samoyed.jpg`、`dit-samples-0.jpg`、`dit-samples-1.jpg`、`SOURCES.md`

- [ ] **Step 1: 下载并压缩**

```bash
mkdir -p public/images/cfg && cd public/images/cfg
curl -sfL -o golden-retriever.jpg https://raw.githubusercontent.com/EliSchwartz/imagenet-sample-images/master/n02099601_golden_retriever.JPEG
curl -sfL -o samoyed.jpg https://raw.githubusercontent.com/pytorch/hub/master/images/dog.jpg
curl -sfL -o dit0.png https://raw.githubusercontent.com/facebookresearch/DiT/main/visuals/sample_grid_0.png
curl -sfL -o dit1.png https://raw.githubusercontent.com/facebookresearch/DiT/main/visuals/sample_grid_1.png
sips -s format jpeg -s formatOptions 82 -Z 1400 dit0.png --out dit-samples-0.jpg
sips -s format jpeg -s formatOptions 82 -Z 1400 dit1.png --out dit-samples-1.jpg
sips -Z 800 samoyed.jpg && sips -Z 800 golden-retriever.jpg
rm dit0.png dit1.png
ls -la && sips -g pixelWidth -g pixelHeight *.jpg
```
Expected: 4 个 jpg，每个小于 600KB。用 Read 工具逐张查看图片，确认内容正确（金毛、萨摩耶、DiT 样例网格）。

- [ ] **Step 2: 写来源说明**

`public/images/cfg/SOURCES.md`:
```markdown
# 图片来源

| 文件 | 原始链接 | 说明 / 许可 |
| --- | --- | --- |
| golden-retriever.jpg | https://github.com/EliSchwartz/imagenet-sample-images （n02099601_golden_retriever） | ImageNet 验证集样例，仅限个人学习 |
| samoyed.jpg | https://github.com/pytorch/hub/blob/master/images/dog.jpg | PyTorch Hub 示例图 |
| dit-samples-0.jpg / -1.jpg | https://github.com/facebookresearch/DiT/tree/main/visuals | DiT-XL/2 生成样例（README 注明 classifier-free guidance scale = 4.0），CC BY-NC 4.0 |

已缩放、转为 JPEG 以减小体积。
```

- [ ] **Step 3: Checkpoint** — 4 张图存在，SOURCES.md 完整。

---

### Task 6: 第 1、2 步演示

**Files:**
- Create: `src/topics/cfg/demos/{SharpenDemo,MagnetDemo,ScoreFieldDemo,ForwardNoiseDemo}.tsx`

**Interfaces:**
- Consumes: `sharpenWeights`、`sharpenCurve`；`mixturePosterior`、`mixtureScore`、`mixtureLogDensity`；`noisedLogDensity`、`noisedScore`、`Comp2D`；`alphaBar`；`toSigned`、`toRGBA`、`forwardNoise`、`gaussianField`；`Demo`、`Slider`、`Tex`
- Produces: 具名导出 `SharpenDemo`、`MagnetDemo`、`ScoreFieldDemo`、`ForwardNoiseDemo`（均无 props）

- [ ] **Step 1: SharpenDemo**

`src/topics/cfg/demos/SharpenDemo.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { area, line } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { sharpenCurve, sharpenWeights } from '../lib/sharpen'

type P = [number, number]
const XS = Array.from({ length: 241 }, (_, i) => -4 + (i * 8) / 240)
// p(x)：同属“金毛”类的图片在“典型程度”轴上的分布——右边是典型正脸照，左边是远景、遮挡、模糊照
const PX = XS.map((x) => 0.65 * Math.exp(-((x - 0.8) ** 2) / 0.9) + 0.35 * Math.exp(-((x + 1.6) ** 2) / 1.4))
// p(y|x)：越靠右越“像金毛”
const PYX = XS.map((x) => 1 / (1 + Math.exp(-1.8 * x)))
const W = 560, H = 210, M = { l: 12, r: 12, t: 10, b: 30 }
const PRESETS = [0, 1, 2, 4, 8]

export function SharpenDemo() {
  const [s, setS] = useState(1)
  const curve = useMemo(() => sharpenCurve(XS, PX, PYX, s), [s])
  const ref = useMemo(() => sharpenCurve(XS, PX, PYX, 1), [])
  const [wA, wB] = sharpenWeights([0.9, 0.3], s)
  const x = scaleLinear().domain([-4, 4]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, Math.max(...curve, ...ref) * 1.08]).range([H - M.b, M.t])
  const pts = (ys: number[]) => XS.map((v, i) => [v, ys[i]] as P)
  const areaPath = area<P>().x((d) => x(d[0])).y0(y(0)).y1((d) => y(d[1]))(pts(curve)) ?? ''
  const refPath = line<P>().x((d) => x(d[0])).y((d) => y(d[1]))(pts(ref)) ?? ''
  const ratio = 3 ** s

  return (
    <Demo
      title="锐化：从 p(x)·p(y|x)^s 采样"
      hint="拖动 s：s = 0 时忽略类别，s = 1 是真实条件分布（虚线），s > 1 时概率向“更像金毛”的一侧集中。"
      onReset={() => setS(1)}
    >
      <div className="kb-demo-grid">
        <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="锐化后的分布">
          <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
          <path d={refPath} className="stroke-ref" />
          <path d={areaPath} className="fill-guided" />
          <text x={M.l} y={H - 8}>← 远景、遮挡、模糊（不太像）</text>
          <text x={W - M.r} y={H - 8} textAnchor="end">典型正脸照（很像）→</text>
        </svg>
        <div className="kb-bars" aria-label="两张图归一化后的概率">
          {([['A', '很像金毛', 0.9, wA, 'bg-cond'], ['B', '不太像', 0.3, wB, 'bg-uncond']] as const).map(([k, desc, p, w, cls]) => (
            <div className="kb-bar-row" key={k}>
              <span>图 {k} · {desc}<small>p(y|x) = {p}</small></span>
              <div className="kb-bar-track"><div className={cls} style={{ width: `${w * 100}%` }} /></div>
              <span className="kb-bar-val">{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
          <p className="kb-demo-note">
            A : B = <Tex>{`3^{${s.toFixed(1)}}`}</Tex> = {ratio < 1000 ? ratio.toFixed(1) : Math.round(ratio).toLocaleString()} : 1
          </p>
        </div>
      </div>
      <Slider label="guidance s" value={s} min={0} max={10} step={0.1} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="kb-chip" aria-pressed={s === p} onClick={() => setS(p)}>s = {p}</button>
        ))}
      </div>
    </Demo>
  )
}
```

- [ ] **Step 2: MagnetDemo**

`src/topics/cfg/demos/MagnetDemo.tsx`:
```tsx
import { useId, useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { area } from 'd3-shape'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { mixtureLogDensity, mixturePosterior, mixtureScore } from '../lib/mixture1d'

type P = [number, number]
const CENTERS = [1, -1]
const W = 560, H = 250, M = { l: 16, r: 16 }
const XS = Array.from({ length: 201 }, (_, i) => -4 + (i * 8) / 200)

export function MagnetDemo() {
  const [xt, setXt] = useState(1.5)
  const [sigma, setSigma] = useState(1)
  const uid = useId().replace(/:/g, '')
  const post = mixturePosterior(xt, CENTERS, sigma)
  const pulls = CENTERS.map((c) => -(xt - c) / sigma ** 2)
  const eps = CENTERS.map((c) => (xt - c) / sigma)
  const score = mixtureScore(xt, CENTERS, sigma)
  const epsBar = post[0] * eps[0] + post[1] * eps[1]

  const x = scaleLinear().domain([-4, 4]).range([M.l, W - M.r]).clamp(true)
  const dens = useMemo(() => XS.map((v) => Math.exp(mixtureLogDensity(v, CENTERS, sigma))), [sigma])
  const y = scaleLinear().domain([0, Math.max(...dens) * 1.1]).range([110, 10])
  const densPath = area<P>().x((d) => x(d[0])).y0(110).y1((d) => y(d[1]))(XS.map((v, i) => [v, dens[i]] as P)) ?? ''
  const arrow = (from: number, d: number) => x(from + d * 0.5) // 箭头长度：0.5 个单位 / 单位 score

  const rows = [
    { label: 'x₀ = +1 的拉力', d: pulls[0], y: 150, op: 0.25 + 0.75 * post[0], cls: 'stroke-cond' },
    { label: 'x₀ = −1 的拉力', d: pulls[1], y: 178, op: 0.25 + 0.75 * post[1], cls: 'stroke-uncond' },
    { label: '加权平均 = score', d: score, y: 214, op: 1, cls: 'stroke-guided' },
  ]

  return (
    <Demo
      title="score 是所有来源“拉力”的加权平均"
      hint="数据只有 ±1 两个点，x_t = x₀ + σ·ε。拖动 x_t 和噪声 σ：离 x_t 越近的来源后验权重越大，最终 score 由它主导。"
      onReset={() => { setXt(1.5); setSigma(1) }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="磁铁示意">
        <defs>
          {['cond', 'uncond', 'guided'].map((k) => (
            <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={`var(--c-${k})`} />
            </marker>
          ))}
        </defs>
        <path d={densPath} className="fill-data" />
        <line className="axis" x1={M.l} x2={W - M.r} y1={110} y2={110} />
        <text x={M.l} y={24}>p_t(x)：两个高斯“抹开”后的混合</text>
        {CENTERS.map((c, i) => (
          <g key={c}>
            <circle cx={x(c)} cy={110} r={5 + 10 * Math.sqrt(post[i])} fill={i === 0 ? 'var(--c-cond)' : 'var(--c-uncond)'} opacity={0.85} />
            <text x={x(c)} y={136} textAnchor="middle">x₀ = {c > 0 ? '+1' : '−1'} · {(post[i] * 100).toFixed(1)}%</text>
          </g>
        ))}
        <line x1={x(xt)} x2={x(xt)} y1={30} y2={230} stroke="var(--ink)" strokeDasharray="2 3" />
        <text x={x(xt) + 4} y={40} fill="var(--ink)">x_t = {xt.toFixed(2)}</text>
        {rows.map((r, i) => (
          <g key={r.label} opacity={r.op}>
            <line x1={x(xt)} x2={arrow(xt, r.d)} y1={r.y} y2={r.y} className={r.cls} markerEnd={`url(#${uid}-${['cond', 'uncond', 'guided'][i]})`} />
            <text x={W - M.r} y={r.y + 4} textAnchor="end">{r.label} {r.d.toFixed(3)}</text>
          </g>
        ))}
      </svg>
      <Slider label="x_t" value={xt} min={-3.5} max={3.5} step={0.05} onChange={setXt} />
      <Slider label="噪声 σ" value={sigma} min={0.3} max={2} step={0.05} onChange={setSigma} />
      <table className="kb-num-table">
        <thead><tr><th>来源 x₀</th><th>后验权重</th><th>拉力 −(x_t−x₀)/σ²</th><th>对应噪声 ε</th></tr></thead>
        <tbody>
          {CENTERS.map((c, i) => (
            <tr key={c}><td>{c > 0 ? '+1' : '−1'}</td><td>{(post[i] * 100).toFixed(1)}%</td><td>{pulls[i].toFixed(3)}</td><td>{eps[i].toFixed(3)}</td></tr>
          ))}
          <tr className="is-total"><td>加权平均</td><td>—</td><td>score = {score.toFixed(3)}</td><td>E[ε|x_t] = {epsBar.toFixed(3)}</td></tr>
        </tbody>
      </table>
      <p className="kb-demo-note">检验“词典”：−E[ε|x_t] / σ = {(-epsBar / sigma).toFixed(3)}，与 score 相同。</p>
    </Demo>
  )
}
```

- [ ] **Step 3: ScoreFieldDemo**

`src/topics/cfg/demos/ScoreFieldDemo.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { noisedLogDensity, noisedScore, type Comp2D, type Vec2 } from '../lib/gmm2d'
import { alphaBar } from '../lib/schedule'

const COMPS: Comp2D[] = [
  { mean: [-1.6, 0.9], std: 0.35, weight: 0.4, label: 0 },
  { mean: [1.5, 1.1], std: 0.35, weight: 0.3, label: 1 },
  { mean: [0.2, -1.4], std: 0.35, weight: 0.3, label: 2 },
]
const R = 3, RES = 110, ARROWS = 15
const toWorld = (u: number) => -R + 2 * R * u
const PAPER = [251, 248, 241], INK = [47, 111, 159]

export function ScoreFieldDemo() {
  const [t, setT] = useState(0.3)
  const ab = alphaBar(t)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(RES, RES)
    const vals: number[] = []
    for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++)
      vals.push(Math.exp(noisedLogDensity([toWorld((i + 0.5) / RES), toWorld(1 - (j + 0.5) / RES)], COMPS, ab)))
    const max = Math.max(...vals)
    vals.forEach((v, k) => {
      const a = Math.pow(v / max, 0.6)
      for (let c = 0; c < 3; c++) img.data[k * 4 + c] = PAPER[c] + (INK[c] - PAPER[c]) * a * 0.85
      img.data[k * 4 + 3] = 255
    })
    ctx.putImageData(img, 0, 0)
  }, [ab])

  const arrows = useMemo(() => {
    const out: { p: Vec2; d: Vec2; len: number }[] = []
    for (let j = 0; j < ARROWS; j++) for (let i = 0; i < ARROWS; i++) {
      const p: Vec2 = [toWorld((i + 0.5) / ARROWS), toWorld((j + 0.5) / ARROWS)]
      const s = noisedScore(p, COMPS, ab)
      const n = Math.hypot(s[0], s[1]) || 1
      out.push({ p, d: [s[0] / n, s[1] / n], len: Math.min(1, Math.log1p(n) / 2.5) })
    }
    return out
  }, [ab])

  const cell = 100 / ARROWS
  const sx = (v: number) => ((v + R) / (2 * R)) * 100
  const sy = (v: number) => 100 - ((v + R) / (2 * R)) * 100

  return (
    <Demo
      title="score 向量场：每一点都指向密度更高的方向"
      hint="底色是加噪后的密度 p_t，箭头是 score 的方向（长度按大小取对数）。t 越大，分布被抹得越开，箭头越统一地指向中心——这正是从纯噪声出发也有可靠方向的原因。"
      onReset={() => setT(0.3)}
    >
      <div className="kb-canvas-wrap">
        <canvas ref={canvas} width={RES} height={RES} style={{ imageRendering: 'auto' }} />
        <svg viewBox="0 0 100 100" aria-label="score 箭头">
          {arrows.map(({ p, d, len }, k) => {
            const x1 = sx(p[0]), y1 = sy(p[1])
            const L = cell * 0.85 * len
            return <line key={k} x1={x1} y1={y1} x2={x1 + d[0] * L} y2={y1 - d[1] * L} stroke="var(--c-guided)" strokeWidth={0.45} strokeLinecap="round" />
          })}
          {arrows.map(({ p }, k) => <circle key={`o${k}`} cx={sx(p[0])} cy={sy(p[1])} r={0.45} fill="var(--c-guided)" />)}
        </svg>
      </div>
      <Slider label="噪声水平 t" value={t} min={0} max={1} step={0.01} onChange={setT} />
      <div className="kb-demo-readout"><span>ᾱ_t = <b>{ab.toFixed(3)}</b></span><span>t → 0：三个清晰的峰</span><span>t → 1：近似标准高斯</span></div>
    </Demo>
  )
}
```

- [ ] **Step 4: ForwardNoiseDemo**

`src/topics/cfg/demos/ForwardNoiseDemo.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { alphaBar } from '../lib/schedule'
import { forwardNoise, gaussianField, toRGBA, toSigned } from '../lib/forwardNoise'

const SRC = 'images/cfg/golden-retriever.jpg'
const SIZE = 192
const THUMBS = [0, 0.25, 0.5, 0.75, 1]

function draw(canvas: HTMLCanvasElement | null, x0: Float32Array, noise: Float32Array, ab: number) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  const rgba = toRGBA(forwardNoise(x0, noise, ab))
  ctx.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, SIZE, SIZE), 0, 0)
}

export function ForwardNoiseDemo() {
  const [t, setT] = useState(0.35)
  const [seed, setSeed] = useState(7)
  const [x0, setX0] = useState<Float32Array | null>(null)
  const [error, setError] = useState(false)
  const main = useRef<HTMLCanvasElement>(null)
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([])
  const noise = useMemo(() => gaussianField(SIZE * SIZE * 3, seed), [seed])
  const ab = alphaBar(t)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = SIZE
      const ctx = c.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
      setX0(toSigned(ctx.getImageData(0, 0, SIZE, SIZE).data))
    }
    img.onerror = () => setError(true)
    img.src = import.meta.env.BASE_URL + SRC
  }, [])

  useEffect(() => { if (x0) draw(main.current, x0, noise, ab) }, [x0, noise, ab])
  useEffect(() => { if (x0) THUMBS.forEach((tt, i) => draw(thumbs.current[i], x0, noise, alphaBar(tt))) }, [x0, noise])

  return (
    <Demo
      title="前向加噪：x_t = √ᾱ_t · x₀ + √(1−ᾱ_t) · ε"
      hint="在浏览器里对一张真实照片逐像素计算。t 接近 1 时图像信息几乎消失，x_t 近似就是噪声 ε 本身。"
      onReset={() => { setT(0.35); setSeed(7) }}
    >
      {error ? (
        <p className="kb-muted">图片加载失败：请确认 public/{SRC} 存在。</p>
      ) : (
        <>
          <div className="kb-demo-grid">
            <canvas ref={main} width={SIZE} height={SIZE} style={{ width: '100%', borderRadius: 6 }} aria-label="加噪后的图像" />
            <div className="kb-demo-readout" style={{ flexDirection: 'column' }}>
              <span>ᾱ_t = <b>{ab.toFixed(3)}</b></span>
              <span>信号系数 √ᾱ_t = <b>{Math.sqrt(ab).toFixed(3)}</b></span>
              <span>噪声系数 √(1−ᾱ_t) = <b>{Math.sqrt(1 - ab).toFixed(3)}</b></span>
              <button type="button" className="kb-btn-ghost" onClick={() => setSeed(seed + 1)}>换一组噪声 ε</button>
            </div>
          </div>
          <Slider label="噪声水平 t" value={t} min={0} max={1} step={0.01} onChange={setT} />
          <div className="kb-thumbs">
            {THUMBS.map((tt, i) => (
              <figure key={tt}>
                <canvas ref={(el) => { thumbs.current[i] = el }} width={SIZE} height={SIZE} />
                t = {tt}
              </figure>
            ))}
          </div>
        </>
      )}
    </Demo>
  )
}
```

- [ ] **Step 5: 验证**

在临时 `index.mdx` 末尾 import 并放置四个演示，`npm run dev` 打开 `#/t/cfg`：
- SharpenDemo：s=1、2、4 时 A 分别为 75.0% / 90.0% / 98.8%；s=0 时为 50/50；s=10 曲线集中在右侧且无报错
- MagnetDemo：默认显示 95.3% / 4.7%，score = −0.595；把 x_t 拖到 ±3.5、σ=0.3 时数值不出现 NaN
- ScoreFieldDemo：t=0 三个峰清晰；t=1 箭头统一指向中心
- ForwardNoiseDemo：t=0 是原图，t=1 是纯噪声；"换一组噪声"可用

Run: `npm run build` → 无类型错误。

- [ ] **Step 6: Checkpoint**

---

### Task 7: 第 3～6 步演示

**Files:**
- Create: `src/topics/cfg/demos/{CGPipeline,GradStrengthChart,ExtrapolationDemo,LabelDropoutDemo,SamplingLoopDemo}.tsx`

**Interfaces:**
- Consumes: `classifierGradStrength`、`cfgCombine`、`dropLabels`、`mulberry32`、`Demo`、`Slider`、`Tex`、`Figure` 的样式类
- Produces: 具名导出 `CGPipeline`、`GradStrengthChart`、`ExtrapolationDemo`、`LabelDropoutDemo`、`SamplingLoopDemo`（无 props）

- [ ] **Step 1: CGPipeline（静态流程图，复习模式隐藏）**

`src/topics/cfg/demos/CGPipeline.tsx`:
```tsx
import { useId } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

const Box = ({ x, y, w, h, title, sub }: { x: number; y: number; w: number; h: number; title: string; sub: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} className="kb-flow-box" />
    <text x={x + w / 2} y={y + 20} textAnchor="middle" style={{ fontSize: 13, fill: 'var(--ink)' }}>{title}</text>
    <text x={x + w / 2} y={y + 36} textAnchor="middle">{sub}</text>
  </g>
)

export function CGPipeline() {
  const { review } = useReviewMode()
  const id = useId().replace(/:/g, '')
  if (review) return null
  const m = `url(#${id}-a)`, mb = `url(#${id}-b)`
  return (
    <figure className="kb-figure">
      <svg viewBox="0 0 680 250" className="kb-chart" role="img" aria-label="classifier guidance 的计算流程">
        <defs>
          <marker id={`${id}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-3)" /></marker>
          <marker id={`${id}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-guided)" /></marker>
        </defs>
        <circle cx={40} cy={125} r={22} className="kb-flow-box" />
        <text x={40} y={130} textAnchor="middle" style={{ fontSize: 14, fill: 'var(--ink)' }}>x_t</text>
        <Box x={110} y={30} w={170} h={48} title="扩散模型 ε_θ" sub="❄ 冻结 · 普通前向" />
        <Box x={110} y={160} w={170} h={48} title="噪声感知分类器 p_φ" sub="❄ 冻结 · 输入 x_t 和 t" />
        <path d="M62,115 C85,80 90,60 108,56" className="stroke-uncond" markerEnd={m} />
        <path d="M62,135 C85,170 90,184 108,184" className="stroke-cond" markerEnd={m} />
        <text x={300} y={50}>ε_θ(x_t, t)</text>
        <path d="M282,54 L440,105" className="stroke-uncond" markerEnd={m} />
        <text x={300} y={176}>log p_φ(y | x_t)</text>
        <path d="M195,212 C195,240 40,240 40,150" fill="none" stroke="var(--c-guided)" strokeDasharray="5 4" strokeWidth={1.8} markerEnd={mb} />
        <text x={70} y={244} fill="var(--c-guided)">反向传播只到输入 x_t：∇_x log p_φ(y|x_t)</text>
        <path d="M282,190 L440,140" stroke="var(--c-guided)" strokeWidth={1.8} fill="none" markerEnd={mb} />
        <text x={330} y={150} fill="var(--c-guided)">× (−s·√(1−ᾱ_t))</text>
        <circle cx={460} cy={122} r={18} className="kb-flow-box" />
        <text x={460} y={128} textAnchor="middle" style={{ fontSize: 16, fill: 'var(--ink)' }}>+</text>
        <text x={460} y={160} textAnchor="middle" fill="var(--c-guided)">ε̂</text>
        <path d="M480,122 L528,122" className="stroke-guided" markerEnd={mb} />
        <Box x={530} y={98} w={120} h={48} title="DDPM / DDIM" sub="更新公式不变" />
        <text x={590} y={175} textAnchor="middle" style={{ fill: 'var(--ink)' }}>→ x_{'{t−1}'}</text>
      </svg>
      <figcaption>两条并行支路只在最后相加。两个模型的参数都不更新，梯度只用来算“往哪改图像更像 y”的方向。</figcaption>
    </figure>
  )
}
```
（`x_{'{t−1}'}` 输出字面文本 `x_{t−1}` 不美观，实现时改成 `x` + `<tspan baselineShift="sub" fontSize="10">t−1</tspan>`；同理所有 SVG 中带下标的文字都用 `tspan` 下标。）

- [ ] **Step 2: GradStrengthChart（真实计算）**

`src/topics/cfg/demos/GradStrengthChart.tsx`:
```tsx
import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { useReviewMode } from '@/kb/state/ReviewMode'
import { classifierGradStrength } from '../lib/toy1d'

type P = [number, number]
const W = 560, H = 200, M = { l: 40, r: 12, t: 12, b: 36 }

export function GradStrengthChart() {
  const { review } = useReviewMode()
  const pts = useMemo(() => Array.from({ length: 99 }, (_, i) => { const t = (i + 1) / 100; return [t, classifierGradStrength(t)] as P }), [])
  if (review) return null
  const peak = pts.reduce((a, b) => (b[1] > a[1] ? b : a))
  const x = scaleLinear().domain([0, 1]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, peak[1] * 1.15]).range([H - M.b, M.t])
  const d = line<P>().x((p) => x(p[0])).y((p) => y(p[1]))(pts) ?? ''
  return (
    <figure className="kb-figure">
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="分类器梯度强度随噪声水平的变化">
        <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
        <line className="axis" x1={M.l} x2={M.l} y1={M.t} y2={y(0)} />
        <path d={d} className="stroke-cond" />
        <circle cx={x(peak[0])} cy={y(peak[1])} r={4} fill="var(--c-cond)" />
        <text x={x(peak[0])} y={y(peak[1]) - 8} textAnchor="middle">中段最强</text>
        <text x={M.l} y={H - 10}>t → 0：图像清晰，分类器已确定，梯度≈0</text>
        <text x={W - M.r} y={H - 10} textAnchor="end">t → 1：几乎纯噪声，看不出类别，梯度≈0</text>
        <text x={8} y={M.t + 4} transform={`rotate(-90 8 ${M.t + 4})`} textAnchor="end">E|∇ log p_t(y|x_t)|</text>
      </svg>
      <figcaption>一维双类玩具模型（类别 ±1、类内标准差 0.2）上的真实计算：guidance 主要在采样的中间阶段起作用。</figcaption>
    </figure>
  )
}
```

- [ ] **Step 3: ExtrapolationDemo**

`src/topics/cfg/demos/ExtrapolationDemo.tsx`:
```tsx
import { useId, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { cfgCombine } from '../lib/cfg'
import type { Vec2 } from '../lib/gmm2d'

const EU: Vec2 = [1.2, 0.6], EC: Vec2 = [2.0, 1.4]
const W = 520, H = 400, PAD = 24

export function ExtrapolationDemo() {
  const [s, setS] = useState(3)
  const id = useId().replace(/:/g, '')
  const eh = cfgCombine(EU, EC, s)
  const x = scaleLinear().domain([-0.3, 5.6]).range([PAD, W - PAD])
  const y = scaleLinear().domain([-0.3, 5]).range([H - PAD, PAD])
  const along = (k: number): Vec2 => cfgCombine(EU, EC, k)
  const [l0, l1] = [along(-0.6), along(5.2)]
  const vec = (v: Vec2, cls: string, mk: string) => (
    <line x1={x(0)} y1={y(0)} x2={x(v[0])} y2={y(v[1])} className={cls} markerEnd={`url(#${id}-${mk})`} />
  )
  const zone = s <= 1 ? '插值：落在 ε∅ 与 ε_y 之间' : '外推：越过 ε_y 继续往前'

  return (
    <Demo
      title="CFG 是沿“条件方向”外推"
      hint="ε_y − ε∅ 就是“加上条件 y 后预测变了多少”。ε̂ 从 ε∅ 出发沿这个方向走 s 倍。"
      onReset={() => setS(3)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label="外推示意">
        <defs>
          {['uncond', 'cond', 'guided'].map((k) => (
            <marker key={k} id={`${id}-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={`var(--c-${k})`} /></marker>
          ))}
        </defs>
        <line x1={x(l0[0])} y1={y(l0[1])} x2={x(l1[0])} y2={y(l1[1])} className="stroke-ref" />
        <text x={x(0) - 6} y={y(0) + 16} textAnchor="end">原点</text>
        {vec(EU, 'stroke-uncond', 'uncond')}
        {vec(EC, 'stroke-cond', 'cond')}
        {vec(eh, 'stroke-guided', 'guided')}
        <line x1={x(EU[0])} y1={y(EU[1])} x2={x(eh[0])} y2={y(eh[1])} stroke="var(--c-guided)" strokeWidth={6} opacity={0.15} strokeLinecap="round" />
        <circle cx={x(EU[0])} cy={y(EU[1])} r={5} fill="var(--c-uncond)" />
        <text x={x(EU[0]) + 8} y={y(EU[1]) + 16}>ε∅ 无条件</text>
        <circle cx={x(EC[0])} cy={y(EC[1])} r={5} fill="var(--c-cond)" />
        <text x={x(EC[0]) + 8} y={y(EC[1]) + 14}>ε_y 有条件（s = 1）</text>
        <circle cx={x(eh[0])} cy={y(eh[1])} r={6} fill="var(--c-guided)" />
        <text x={x(eh[0]) - 8} y={y(eh[1]) - 10} textAnchor="end" style={{ fill: 'var(--c-guided)', fontWeight: 600 }}>ε̂（s = {s.toFixed(1)}）</text>
      </svg>
      <Slider label="guidance s" value={s} min={0} max={5} step={0.1} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-demo-readout">
        <span><b>{zone}</b></span>
        <Tex>{`\\hat\\epsilon = (1-s)\\,\\epsilon_\\varnothing + s\\,\\epsilon_y = (${(1 - s).toFixed(1)})\\,\\epsilon_\\varnothing + ${s.toFixed(1)}\\,\\epsilon_y`}</Tex>
      </div>
      {s > 1 && <p className="kb-demo-note">无条件那一项的系数是负的：等于在“推开”无条件预测。</p>}
    </Demo>
  )
}
```

- [ ] **Step 4: LabelDropoutDemo**

`src/topics/cfg/demos/LabelDropoutDemo.tsx`:
```tsx
import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { dropLabels } from '../lib/labelDropout'
import { mulberry32 } from '../lib/prng'

const LABELS = ['金毛', '猫', '汽车', '咖啡', '钢琴', '向日葵', '企鹅', '火车', '金毛', '猫', '桥', '蘑菇', '金毛', '帆船', '披萨', '狐狸']

function verdict(p: number): string {
  if (p < 0.03) return '太小：ε∅ 几乎没被训练，guidance 的方向 ε_y − ε∅ 不可靠。'
  if (p > 0.4) return '太大：训练量被分走太多，条件生成本身变弱。'
  return '合理区间：无条件预测只是“参照点”，不必特别好（DiT 用 0.1）。'
}

export function LabelDropoutDemo() {
  const [p, setP] = useState(0.1)
  const [seed, setSeed] = useState(1)
  const [total, setTotal] = useState({ n: 0, dropped: 0 })
  const batch = dropLabels(LABELS, p, mulberry32(seed * 7919))
  const dropped = batch.filter((l) => l === null).length

  const draw = (times: number) => {
    let n = 0, d = 0
    for (let k = 1; k <= times; k++) {
      const b = dropLabels(LABELS, p, mulberry32((seed + k) * 7919))
      n += b.length
      d += b.filter((l) => l === null).length
    }
    setSeed(seed + times)
    setTotal({ n: total.n + n, dropped: total.dropped + d })
  }
  const changeP = (v: number) => { setP(v); setTotal({ n: 0, dropped: 0 }) }

  return (
    <Demo
      title="label dropout：一个网络同时学会有条件和无条件"
      hint="训练时每个样本独立地以概率 p_uncond 把标签换成空标记 ∅，其余照常。"
      onReset={() => { setP(0.1); setSeed(1); setTotal({ n: 0, dropped: 0 }) }}
    >
      <div className="kb-tiles" aria-label="当前 batch">
        {batch.map((l, i) => (
          <div key={i} className={l === null ? 'kb-tile is-null' : 'kb-tile'}>
            {l === null ? (<><span className="kb-null">∅</span><s>{LABELS[i]}</s></>) : l}
          </div>
        ))}
      </div>
      <Slider label="p_uncond" value={p} min={0} max={1} step={0.01} onChange={changeP} />
      <div className="kb-presets">
        <button type="button" className="kb-btn" onClick={() => draw(1)}>抽下一个 batch</button>
        <button type="button" className="kb-btn-ghost" onClick={() => draw(100)}>连抽 100 个</button>
      </div>
      <div className="kb-demo-readout">
        <span>本 batch 被替换：<b>{dropped}</b> / {LABELS.length}</span>
        <span>累计 {total.n} 个样本，∅ 占 <b>{total.n ? ((total.dropped / total.n) * 100).toFixed(1) : '—'}%</b></span>
      </div>
      <p className="kb-demo-note">{verdict(p)}</p>
    </Demo>
  )
}
```

- [ ] **Step 5: SamplingLoopDemo**

`src/topics/cfg/demos/SamplingLoopDemo.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Demo } from '@/kb/components/Demo'

const STAGES = [
  { title: '复制 batch', text: '同一个 x_t 复制两份；前一半配条件 y，后一半配空标记 ∅。两份用的是同一个 x_t，差值才纯粹来自条件。', lines: [1, 2, 3, 4] },
  { title: '一次前向', text: '把 2B 大小的 batch 送进同一个网络，一次算完。这就是“采样计算量翻倍”的来源。', lines: [6] },
  { title: '拆开', text: '前一半是 ε_y，后一半是 ε∅。', lines: [7] },
  { title: 'CFG 组合', text: 'ε̂ = ε∅ + s·(ε_y − ε∅)。只作用在噪声预测上。', lines: [9] },
  { title: 'DDIM 更新', text: '把 ε̂ 当作普通噪声预测代入原样的 DDIM 公式，得到 x_{t−1}，进入下一个时间步。', lines: [13] },
]
const CODE = [
  'def cfg_step(model, x_t, t, y, s, null_label):',
  '    B = x_t.shape[0]',
  '    x_in = torch.cat([x_t, x_t], dim=0)',
  '    t_in = torch.cat([t, t], dim=0)',
  '    y_in = torch.cat([y, torch.full_like(y, null_label)], dim=0)',
  '',
  '    eps = model(x_in, t_in, y_in)          # 一次前向',
  '    eps_y, eps_null = eps[:B], eps[B:]     # 拆开',
  '',
  '    return eps_null + s * (eps_y - eps_null)',
  '',
  'x = torch.randn(B, C, H, W)',
  'for t in timesteps:                        # 从大到小',
  '    x = ddim_update(x, cfg_step(model, x, t, y, s, null_label), t)',
]

export function SamplingLoopDemo() {
  const [k, setK] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const h = window.setInterval(() => setK((v) => (v + 1) % STAGES.length), 1600)
    return () => window.clearInterval(h)
  }, [playing])
  const W = 640, bw = 108, gap = (W - 5 * bw) / 4

  return (
    <Demo title="采样时每一步做什么" hint="逐步播放一个去噪步内的数据流，右侧代码同步高亮。" onReset={() => { setK(0); setPlaying(false) }}>
      <svg viewBox={`0 0 ${W} 120`} className="kb-chart" role="img" aria-label="单步数据流">
        {STAGES.map((s, i) => {
          const x = i * (bw + gap)
          return (
            <g key={s.title} style={{ cursor: 'pointer' }} onClick={() => { setK(i); setPlaying(false) }}>
              <rect x={x} y={20} width={bw} height={52} rx={8} className={i === k ? 'kb-flow-box is-hot' : 'kb-flow-box'} />
              <text x={x + bw / 2} y={42} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--ink-3)' }}>{i + 1}</text>
              <text x={x + bw / 2} y={60} textAnchor="middle" style={{ fontSize: 13, fill: 'var(--ink)' }}>{s.title}</text>
              {i < STAGES.length - 1 && <line x1={x + bw + 4} x2={x + bw + gap - 4} y1={46} y2={46} className="axis" />}
            </g>
          )
        })}
        <path d={`M${W - bw / 2},74 C${W - bw / 2},110 ${bw / 2},110 ${bw / 2},74`} className="stroke-ref" />
        <text x={W / 2} y={114} textAnchor="middle">下一个时间步 t − 1</text>
      </svg>
      <p className="kb-demo-note"><b>{k + 1}. {STAGES[k].title}</b>：{STAGES[k].text}</p>
      <pre className="kb-flow-code" aria-label="对应代码">
        {CODE.map((l, i) => <span key={i} className={STAGES[k].lines.includes(i) ? 'is-hot' : undefined}>{l || ' '}</span>)}
      </pre>
      <div className="kb-presets">
        <button type="button" className="kb-btn-ghost" onClick={() => setK((k + STAGES.length - 1) % STAGES.length)}>上一步</button>
        <button type="button" className="kb-btn" onClick={() => setK((k + 1) % STAGES.length)}>下一步</button>
        <button type="button" className="kb-btn-ghost" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? '暂停' : '自动播放'}</button>
      </div>
    </Demo>
  )
}
```
注：`STAGES[*].lines` 是 `CODE` 的下标（从 0 开始）。实现后逐个阶段核对高亮行是否正确：阶段 1 → 第 1～4 行（B、x_in、t_in、y_in），阶段 2 → 第 6 行，阶段 3 → 第 7 行，阶段 4 → 第 9 行，阶段 5 → 第 13 行。

- [ ] **Step 6: 验证**

放入临时 MDX，`npm run dev` 检查：
- 外推演示：s=0、1 时 ε̂ 分别与 ε∅、ε_y 重合
- dropout 演示：p=0 时没有 ∅，p=1 时全是 ∅；连抽 100 个后，p=0.1 时累计比例接近 10%
- 采样循环：五个阶段的高亮行都正确，自动播放可以暂停
- 复习模式下，流程图和梯度曲线都隐藏

Run: `npm run build` → 无错误。

- [ ] **Step 7: Checkpoint**

---

### Task 8: 第 7 步核心演示 + 指标示意图

**Files:**
- Create: `src/topics/cfg/demos/GuidedSamplingDemo.tsx`、`src/topics/cfg/demos/MetricsChart.tsx`

**Interfaces:**
- Consumes: `sampleCFG`、`sampleStats`、`classComps`、`sampleData`、`Comp2D`、`Vec2`、`mulberry32`
- Produces: 具名导出 `GuidedSamplingDemo`、`MetricsChart`

- [ ] **Step 1: GuidedSamplingDemo**

`src/topics/cfg/demos/GuidedSamplingDemo.tsx`:
```tsx
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { sampleCFG, sampleStats } from '../lib/cfg'
import { classComps, sampleData, type Comp2D, type Vec2 } from '../lib/gmm2d'
import { mulberry32 } from '../lib/prng'

const mk = (label: number, pts: Vec2[]): Comp2D[] => pts.map((mean) => ({ mean, std: 0.28, weight: 1 / 9, label }))
const COMPS: Comp2D[] = [
  ...mk(0, [[-2.4, 1.6], [-1.6, 2.3], [-1.2, 1.2]]),
  ...mk(1, [[1.3, 1.9], [2.2, 2.2], [2.0, 1.1]]),
  ...mk(2, [[-0.6, -1.6], [0.4, -2.2], [1.2, -1.4]]),
]
const CLASSES = ['A', 'B', 'C']
const R = 4.5, SIZE = 520
const PRESETS = [0, 1, 3, 7.5, 12]

export function GuidedSamplingDemo() {
  const [label, setLabel] = useState(0)
  const [s, setS] = useState(1)
  const [showPaths, setShowPaths] = useState(false)
  const ds = useDeferredValue(s)
  const canvas = useRef<HTMLCanvasElement>(null)
  const data = useMemo(() => sampleData(COMPS, 900, mulberry32(11)), [])
  const res = useMemo(() => sampleCFG({ comps: COMPS, label, s: ds, n: 500, steps: 40, seed: 3, keepPaths: 24 }), [label, ds])
  const stats = useMemo(() => sampleStats(res.samples, classComps(COMPS, label)), [res, label])
  const base = useMemo(() => sampleStats(sampleCFG({ comps: COMPS, label, s: 1, n: 500, steps: 40, seed: 3 }).samples, classComps(COMPS, label)), [label])

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const css = getComputedStyle(document.documentElement)
    const col = (v: string) => css.getPropertyValue(v).trim()
    const px = (v: number) => ((v + R) / (2 * R)) * SIZE
    const py = (v: number) => SIZE - ((v + R) / (2 * R)) * SIZE
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = col('--card'); ctx.fillRect(0, 0, SIZE, SIZE)
    for (const d of data) {
      ctx.fillStyle = d.label === label ? col('--c-cond') : col('--c-data')
      ctx.globalAlpha = d.label === label ? 0.28 : 0.35
      ctx.beginPath(); ctx.arc(px(d.x[0]), py(d.x[1]), 2.2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (showPaths) {
      ctx.strokeStyle = col('--c-guided'); ctx.globalAlpha = 0.35; ctx.lineWidth = 1
      for (const path of res.paths) {
        ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo(px(p[0]), py(p[1])) : ctx.moveTo(px(p[0]), py(p[1])))); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = col('--c-guided')
    for (const p of res.samples) {
      if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue
      ctx.beginPath(); ctx.arc(px(p[0]), py(p[1]), 2.6, 0, Math.PI * 2); ctx.fill()
    }
    ctx.font = '600 14px system-ui'
    COMPS.filter((_, i) => i % 3 === 0).forEach((c, k) => {
      ctx.fillStyle = col('--ink-2'); ctx.fillText(`类 ${CLASSES[k]}`, px(c.mean[0]) - 18, py(c.mean[1]) - 30)
    })
  }, [res, data, label, showPaths])

  return (
    <Demo
      title="在二维数据上真实地跑一遍 CFG 采样"
      hint="三类数据，每类由三个小簇组成（浅色点）。用真实的 CFG 公式 + DDIM 采样 500 个点（橙色）。拖动 s：先是更集中、更“典型”，再往后多样性丢失、冲出数据范围。"
      onReset={() => { setLabel(0); setS(1); setShowPaths(false) }}
    >
      <div className="kb-demo-grid">
        <div className="kb-canvas-wrap"><canvas ref={canvas} width={SIZE} height={SIZE} aria-label="采样结果" /></div>
        <div className="kb-demo-readout" style={{ flexDirection: 'column' }}>
          <span>目标类别</span>
          <div className="kb-presets">
            {CLASSES.map((c, i) => (
              <button key={c} type="button" className="kb-chip" aria-pressed={label === i} onClick={() => setLabel(i)}>类 {c}</button>
            ))}
          </div>
          <span>类内散度：<b>{stats.spread.toFixed(2)}</b>（s = 1 时 {base.spread.toFixed(2)}）</span>
          <span>冲出数据范围：<b>{(stats.outsideFrac * 100).toFixed(1)}%</b></span>
          <label><input type="checkbox" checked={showPaths} onChange={(e) => setShowPaths(e.target.checked)} /> 显示 24 条采样轨迹</label>
        </div>
      </div>
      <Slider label="guidance s" value={s} min={0} max={12} step={0.5} onChange={setS} format={(v) => v.toFixed(1)} />
      <div className="kb-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="kb-chip" aria-pressed={s === p} onClick={() => setS(p)}>s = {p}</button>
        ))}
      </div>
      <div className="kb-legend">
        <span><i className="bg-cond" />目标类的真实数据</span>
        <span><i style={{ background: 'var(--c-data)' }} />其他类</span>
        <span><i className="bg-guided" />CFG 采样结果</span>
      </div>
    </Demo>
  )
}
```

- [ ] **Step 2: MetricsChart（示意）**

`src/topics/cfg/demos/MetricsChart.tsx`:
```tsx
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { useReviewMode } from '@/kb/state/ReviewMode'

type P = [number, number]
const S = Array.from({ length: 91 }, (_, i) => 1 + i * 0.1)
// 只表示形状，不是真实数据
const IS = (s: number) => 1 - 0.85 * Math.exp(-(s - 1) / 2.2)
const FID = (s: number) => 0.18 + ((s - 2.2) ** 2) / 45
const PREC = (s: number) => 1 - 0.65 * Math.exp(-(s - 1) / 2)
const REC = (s: number) => 0.92 * Math.exp(-(s - 1) / 4.5)
const W = 280, H = 190, M = { l: 12, r: 10, t: 14, b: 30 }

function Panel({ title, series }: { title: string; series: { name: string; f: (s: number) => number; cls: string }[] }) {
  const x = scaleLinear().domain([1, 10]).range([M.l, W - M.r])
  const y = scaleLinear().domain([0, 1.05]).range([H - M.b, M.t])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kb-chart" role="img" aria-label={title}>
      <text x={M.l} y={10} style={{ fill: 'var(--ink-2)', fontWeight: 600 }}>{title}</text>
      <line className="axis" x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} />
      {series.map((sr) => (
        <g key={sr.name}>
          <path d={line<P>().x((p) => x(p[0])).y((p) => y(p[1]))(S.map((s) => [s, sr.f(s)] as P)) ?? ''} className={sr.cls} />
          <text x={W - M.r} y={y(sr.f(10)) - 5} textAnchor="end">{sr.name}</text>
        </g>
      ))}
      <line x1={x(2.2)} x2={x(2.2)} y1={M.t} y2={y(0)} className="stroke-ref" />
      <text x={x(2.2) + 4} y={y(0) - 6}>FID 最优点附近</text>
      <text x={M.l} y={H - 8}>s = 1</text>
      <text x={W - M.r} y={H - 8} textAnchor="end">s 增大 →</text>
    </svg>
  )
}

export function MetricsChart() {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className="kb-figure">
      <div className="kb-demo-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="IS 与 FID" series={[{ name: 'IS ↑', f: IS, cls: 'stroke-cond' }, { name: 'FID（越低越好）', f: FID, cls: 'stroke-guided' }]} />
        <Panel title="Precision 与 Recall" series={[{ name: 'Precision', f: PREC, cls: 'stroke-cond' }, { name: 'Recall', f: REC, cls: 'stroke-uncond' }]} />
      </div>
      <figcaption><span className="kb-badge">示意</span> 只表示趋势形状，不是真实实验数据。IS 随 s 基本单调上升；FID 呈 U 形；precision 上升、recall 下降。</figcaption>
    </figure>
  )
}
```

- [ ] **Step 3: 验证**

放入临时 MDX，在 `npm run dev` 里检查：
- 类别 A/B/C 切换正常；
- s=0 时采样点分布在三类上；
- s=1 时散度和数据接近；
- s 从 3 往 12 调时，散度先降，冲出比例上升；
- 拖动滑块时页面不卡死。

Run: `npm run build` → 无错误。

- [ ] **Step 4: Checkpoint**

---

### Task 9: CFG 正文（index.mdx）

**Files:**
- Modify: `src/topics/cfg/index.mdx`（整体替换临时内容）

**Interfaces:**
- Consumes: 全部 kb 组件（MDX 全局可用），以及 Task 6–8 的演示（需 import）

**写作规则**
- 内容来源是对话记录，下表给出每节对应的行号。
- 讲解放 `<Detail>`；要点和核心公式放 `<KeyPoint>`；用户当时的疑问写成正文段落或 `<Pitfall>`，**不要**写成"你问过……"。
- 每个 `<Step>` 的子元素按这个顺序：`KeyPoint`（放最前，复习时第一眼就看到）→ `Detail` → 演示或图 → `Pitfall` → `Quiz`。
- 第 2 步的事实 1、事实 2 推导和第 4 步的换算用 `<Derivation>`。
- MDX 规则：组件里如果包含 Markdown 或公式，组件标签前后都要留空行；`{` `}` 在 MDX 正文中有特殊含义，公式里的花括号只能出现在 `$...$` 或 `$$...$$` 内。

- [ ] **Step 1: 写开篇与记号（来源：记录 13–19、743–786、98–104、712–737 行）**

```mdx
import { SharpenDemo } from './demos/SharpenDemo'
import { MagnetDemo } from './demos/MagnetDemo'
import { ScoreFieldDemo } from './demos/ScoreFieldDemo'
import { ForwardNoiseDemo } from './demos/ForwardNoiseDemo'
import { CGPipeline } from './demos/CGPipeline'
import { GradStrengthChart } from './demos/GradStrengthChart'
import { ExtrapolationDemo } from './demos/ExtrapolationDemo'
import { LabelDropoutDemo } from './demos/LabelDropoutDemo'
import { SamplingLoopDemo } from './demos/SamplingLoopDemo'
import { GuidedSamplingDemo } from './demos/GuidedSamplingDemo'
import { MetricsChart } from './demos/MetricsChart'

<section id="overview">

## 总览与记号

<KeyPoint>

$$
\hat\epsilon_\theta(x_t, t, y) = \epsilon_\theta(x_t, t, \varnothing) + s\left[\epsilon_\theta(x_t, t, y) - \epsilon_\theta(x_t, t, \varnothing)\right]
$$

一个网络、两次预测、一个旋钮 $s$：用多样性换质量和条件一致性。

</KeyPoint>

<Roadmap nodes={[
  { id: 'step-1', label: '定目标', sub: '从 p(x)·p(y|x)^s 采样', kind: 'goal' },
  { id: 'step-2', label: '给工具', sub: 'ε_θ 就是 score', kind: 'basis' },
  { id: 'step-3', label: '前身', sub: 'classifier guidance', kind: 'pre' },
  { id: 'step-4', label: '去掉分类器', sub: '核心公式', kind: 'core' },
  { id: 'step-5', label: '训练', sub: 'label dropout', kind: 'core' },
  { id: 'step-6', label: '采样', sub: '两次前向再组合', kind: 'core' },
  { id: 'step-7', label: '调参', sub: 's 的取舍', kind: 'core' },
]} />

（记号表：p(x_0) / p_t(x_t)（= DDPM 记号的 q(x_t)）/ ε∅ / ε_y / c = √(1−ᾱ_t) / s 与 w，写清 s = 1 + w，DiT 与 SD 用 s 约定；并用一句 Pitfall 说明 q 与 p_t 是同一个分布、只是两套文献的习惯写法。）

</section>
```
（括号里的说明要替换成真正的表格和 `<Pitfall>`。表格用 GFM 语法，单元格里的公式用 `$...$`。）

- [ ] **Step 2: 写第 1 步（来源：130–278 行）**

结构：
- `<Step id="step-1" n={1} title="CFG 要解决什么问题" gist="学到了 p(x|y) 不等于生成得好：我们想要一个用多样性换质量的旋钮。">`
- `KeyPoint`：目标分布 $\tilde p(x\mid y) \propto p(x)\,p(y\mid x)^s$，以及 $s=0$、$1$、$>1$、$\to\infty$ 四档（表格）
- `Detail`：
  - 1.1 条件模型的做法
  - 1.2 两个原因：真实分布宽、模型有误差
  - 1.3 temperature 和 truncation 类比
  - 1.4 难点：扩散模型没有 softmax，引出第 2 步
  - $Z$ 归一化的讨论：完整式子、"相对比例才重要"、数值表、比值的 $s$ 次方公式、为什么梯度里 $Z$ 消失
- `<div className="kb-figrow">` 放三个 `Figure`：
  - 典型金毛 `images/cfg/golden-retriever.jpg`，source 标 ImageNet sample images
  - 非典型（远景、遮挡）用 placeholder
  - 低质量（模糊）用 placeholder
- `<SharpenDemo />`
- `Pitfall`："指数让每个值都变小，但归一化后比例反而放大"
- `Pitfall`："$s$ 只在采样时设定，不影响训练；$s=1$ 是按真实比例采样，不是只挑最相关的样本"
- `Quiz`：$s=0$ 和 $s=1$ 分别对应什么分布（答案来自 242–273 行）

- [ ] **Step 3: 写第 2 步（来源：287–787 行）**

- `KeyPoint`：带框公式 $\nabla_{x_t}\log p_t(x_t) \approx -\epsilon_\theta(x_t,t)/\sqrt{1-\bar\alpha_t}$，加上一句话"分布的乘法、取幂 → $\epsilon$ 的加法、数乘"
- 开头的 `Pitfall`（title="定位"）：第 2 步属于扩散基础，只证明了一句话，就是这本"翻译词典"（591–636、716–737 行）
- `Detail`：
  - 2.1 score 的定义，以及五条性质：相对变化率、$Z$ 消失、乘法变加法、高斯 score 线性、Langevin。写明 score 是对数据 $x$ 求梯度，不是对参数（Stein score）
  - 2.2 单样本高斯的 score
  - 2.3 两个事实，用 `<Derivation>` 展开事实 2 的四行推导
  - "磁铁"直觉
  - 期望下标为什么不能省（498–529 行，写成正文段落）
  - Langevin、多噪声水平与逆向 SDE（653–675 行）
  - "网络不变，采样器不变，只加工输出"（671 行）
- `<ForwardNoiseDemo />`、`<MagnetDemo />`、`<ScoreFieldDemo />`
- `Pitfall`：事实 2 里期望的分布藏在 $\mid x_t$ 中，去掉条件就变成 $\mathbb E[\epsilon]=0$
- `Quiz`：$\bar\alpha_t \to 0$ 时 $p(x_t)$、score、$\epsilon_\theta$ 分别近似什么（答案来自 543–575 行）

- [ ] **Step 4: 写第 3 步（来源：798–1117 行）**

- `KeyPoint`：$\hat\epsilon = \epsilon_\theta - s\sqrt{1-\bar\alpha_t}\,\nabla_{x_t}\log p_\phi(y\mid x_t,t)$
- `Detail`：
  - 3.1 贝叶斯分解
  - 3.2 第二项就是 saliency 和对抗样本那种对输入求的梯度
  - 3.3 为什么需要噪声感知分类器，$p_t$ 下标的含义（1068–1113 行）
  - 3.4 反向换算：写明是"单位换算"，不是随意缩放（969–1013 行）
  - 3.5 每步做什么
  - 训练时两个模型各训各的，采样时都冻结，附 python 代码块（925–937 行）
- `<CGPipeline />`、`<GradStrengthChart />`
- 3.6 的三个缺点，用编号列表放在 `Detail` 外面，复习时可见
- `Pitfall`："梯度不流回任何模型参数，只对输入 $x_t$ 求导"
- `Quiz`：分类器已经确定时（$p_\phi \to 1$）会怎样（答案用 1032–1037 行，并补充 1101 行"中段最强"的修正）

- [ ] **Step 5: 写第 4 步（来源：1041–1229 行）**

- `KeyPoint`：核心公式（框起来），以及 $s=0$、$1$、$>1$ 三档
- `Detail`：
  - 移项得到"隐式分类器"
  - 左边必须是锐化后的 $\tilde p_t$，并用 $s=2$ 反例验证（1129–1144 行）
  - `<Derivation>`：4.1 起点 → 4.2 代入词典 → 4.3 同乘 $-c$ → 核心公式
  - 4.4 和 CG 对比：为什么系数全部抵消
  - 4.5 外推的读法，以及 $(1-s)\epsilon_\varnothing + s\epsilon_y$
- `<ExtrapolationDemo />`
- CG vs CFG 对比表（放 `Detail` 外）：分类器、额外模型、对抗风险、条件类型、采样代价、反向传播
- `Pitfall`："不易被骗的真正原因是方向来自两个生成模型前向输出之差，而不是'目标类别唯一'"（1250–1257 行）
- `Pitfall`："CFG 和 CLIP 的关系：CLIP 只是提供文本表示的组件，不是 CFG 的训练方式"（1259–1266 行）
- `Quiz`：CFG 解决了 3.6 的哪几个缺点，还剩哪些代价（答案来自 1240–1273 行）

- [ ] **Step 6: 写第 5 步（来源：1289–1360 行）**

- `KeyPoint`：label dropout 公式，以及"一个网络、改一行代码"
- `Detail`：
  - 5.1 细节：逐样本、$p_{\text{uncond}}\approx0.1$、空标记的几种形式
  - 5.2 为什么 $\varnothing$ 学到的就是无条件 score（用事实 1 解释）
  - 5.3 为什么一个网络能做好两件事
  - 5.4 $p_{\text{uncond}}$ 怎么取
  - 5.5 意义
- `<LabelDropoutDemo />`
- `Pitfall`（title="延伸"）：negative prompt，即 $\hat\epsilon = \epsilon_{\text{neg}} + s(\epsilon_y - \epsilon_{\text{neg}})$
- `Quiz`：$p_{\text{uncond}}=0$ 训练的模型还能用 CFG 吗（答案和两种补救办法来自 1350–1355 行）

- [ ] **Step 7: 写第 6 步（来源：1371–1472 行）**

- `KeyPoint`：单步四件事
- `Detail`：
  - 6.2 代入 DDIM 的两个公式
  - 6.3 batch 拼接代码（python 代码块）
  - 6.4 代价，以及 guidance distillation
  - 6.5 常见约定
- `<SamplingLoopDemo />`
- `Pitfall`："两次预测必须用同一个 $x_t$"
- `Quiz`：在 $\hat x_0$ 上组合和在 $\epsilon$ 上组合是否等价（答案用 1449–1470 行：仿射组合系数和为 1；做了 clipping 等非线性操作后就不等价）

- [ ] **Step 8: 写第 7 步（来源：1482–1567 行）**

- `KeyPoint`：$s$ 是质量和多样性之间的旋钮；FID 随 $s$ 呈 U 形，IS 单调上升
- `Detail`：
  - 7.1 回顾
  - 7.2 好的一面
  - 7.3 过大的三层原因，以及 dynamic thresholding / CFG rescale
  - 7.4 IS、FID、P/R 的表格
  - 7.5 文本条件为什么需要更大的 $s$
- `<GuidedSamplingDemo />`、`<MetricsChart />`
- 两个 `Figure`：
  - `images/cfg/dit-samples-0.jpg`，caption 写"DiT-XL/2 样例，guidance scale 4.0"，source 写 DiT GitHub
  - `dit-samples-1.jpg` 同上
- 取值参考表放在 `Detail` 外：DiT 不用 CFG 时 FID 9.62 → $s=1.5$ 时 2.27；展示样例用 $s=4.0$；SD 默认 7.5
- `Quiz`："只报告 IS、把 $s$ 调到 20"这种说法有什么问题（参考答案：IS 不惩罚类内多样性下降，应该同时看 FID 或 recall；$s=20$ 时会过饱和）

- [ ] **Step 9: 写复习区**

```mdx
<section id="cheatsheet">

## 公式速查

（表格，两列“含义 | 公式”：目标分布；score↔ε 词典；classifier guidance；CFG（s 约定）；CFG（w 约定，s = 1 + w）；label dropout；DDIM 代入 x̂₀ 与 x_{t−1}；negative prompt。）

</section>

<section id="pitfalls">

## 易错点

（编号列表，每条“❌ 误解 → ✅ 正解”，至少包含：
1. p(y|x)^s 每项变小 → 归一化后比例放大
2. s 影响训练 → s 只在采样时设定
3. s = 1 只取最相关样本 → s = 1 就是真实条件分布，s → ∞ 才只取最像的
4. score 是对数密度 → 是对数密度对输入 x 的梯度
5. 条件期望的下标可以省略 → 分布藏在 | x_t 里
6. q(x_t) 与 p(x_t) 是两个分布 → 同一个，只是记号习惯
7. 第 2 步就是 CFG → 第 2 步是扩散基础
8. classifier guidance 的梯度会更新模型 → 两个模型都冻结，只对输入求导
9. 乘 −√(1−ᾱ) 是因为不关心大小 → 是单位换算，大小很重要
10. CFG 推导左边写 ∇log p_t(x_t|y) → 应为锐化后的 p̃_t
11. CFG 不被骗是因为目标类别唯一 → 是因为方向来自生成模型的前向差
12. CFG 用 CLIP 方式训练 → CLIP 只提供文本编码
13. 需要训练两个模型 → 一个网络 + label dropout
14. s 与 w 的约定混用 → s = 1 + w
15. IS 越高越好 → 要同时看 FID / recall）

</section>

<section id="flashcards">

## 自测卡片

<Flashcards topic="cfg">

<Card id="s-values">
<Front>$s=0$、$s=1$、$s>1$、$s\to\infty$ 分别从什么分布采样？</Front>
<Back>……</Back>
</Card>

（至少 14 张，覆盖每一步的检验题和上面的易错点。id 用短横线英文，一旦发布不要再改，否则用户的“已掌握”记录会丢失。）

</Flashcards>

</section>
```
括号里的说明都要替换成正式内容。所有卡片的答案都要能在对话记录里找到依据。

- [ ] **Step 10: 验证**

Run: `npm run build` → 无错误。
`npm run dev` 通读全页，检查：
- 没有 `.katex-error`（在浏览器控制台执行 `document.querySelectorAll('.katex-error').length` → 0）
- 复习模式下，每一步都只剩要点、旁注、测验，以及 Detail 外的列表和表格
- 目录的 11 项都能跳转

- [ ] **Step 11: Checkpoint**

---

### Task 10: 视觉打磨

**Files:**
- Modify: `src/styles/*.css`；必要时调整组件里的 className

- [ ] **Step 1:** 调用 `frontend-design` skill，按它的检查要点审视首页和 CFG 页：排版层级、留白、字体搭配、配色是否统一、交互控件的手感、窄屏（≤ 760px）布局。只做样式层面的改动。
- [ ] **Step 2:** 用 `dataviz` skill 的规则复查所有图表：角色色一致、图例和标注清晰、示意图都有「示意」标签、坐标轴标注没有遮挡。
- [ ] **Step 3:** `npm run build` 通过，然后 Checkpoint。

---

### Task 11: 端到端验证 + 文档收尾

**Files:**
- Create: `playwright.config.ts`、`tests/e2e/kb.spec.ts`
- Modify: `PROJECT_OVERVIEW.md`、`CHANGELOG.md`、`CURRENT_STATUS.md`

**Interfaces:**
- Consumes: 所有页面；Review Focus 第 2～5 条

- [ ] **Step 1: 写 e2e 测试**

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4173/', viewport: { width: 1360, height: 900 } },
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: true, timeout: 120_000 },
})
```

`tests/e2e/kb.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('home lists the CFG topic and opens it', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/')
  await page.getByRole('link', { name: /Classifier-Free Guidance/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Classifier-Free Guidance' })).toBeVisible()
  expect(errors).toEqual([])
})

test('CFG page renders all math and demos without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  await expect(page.locator('#step-7')).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(await page.locator('.kb-demo').count()).toBeGreaterThanOrEqual(8)
  await page.screenshot({ path: 'test-results/cfg-full.png', fullPage: true })
  expect(errors).toEqual([])
})

test('toc keeps route', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.getByRole('navigation', { name: '目录' }).getByRole('button', { name: /guidance scale/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.locator('#step-7')).toBeInViewport()
})

test('sharpen demo reproduces the table and survives extremes', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  const demo = page.getByRole('region', { name: /锐化/ })
  await demo.getByRole('button', { name: 's = 4' }).click()
  await expect(demo.getByText('98.8%')).toBeVisible()
  await demo.getByRole('slider').fill('10')
  await expect(demo.getByText('NaN')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('sliders at extremes produce no NaN anywhere', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  const sliders = page.getByRole('slider')
  const n = await sliders.count()
  for (let i = 0; i < n; i++) {
    const s = sliders.nth(i)
    for (const v of [await s.getAttribute('min'), await s.getAttribute('max')]) await s.fill(v!)
  }
  await expect(page.locator('.kb-demo')).not.toContainText('NaN')
  await expect(page.locator('.kb-demo')).not.toContainText('Infinity')
  expect(errors).toEqual([])
})

test('magnet demo shows −0.595 by default', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await expect(page.getByRole('region', { name: /拉力/ }).getByText('score = -0.595')).toBeVisible()
})

test('review mode persists and hides demos', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.getByRole('button', { name: '复习' }).click()
  await expect(page.locator('.kb-demo')).toHaveCount(0)
  await expect(page.locator('.kb-keypoint').first()).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: '复习' })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: 'test-results/cfg-review.png', fullPage: true })
  await page.getByRole('button', { name: '学习' }).click()
})

test('flashcard mastered persists', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const card = page.locator('[data-card="s-values"]')
  await card.locator('.kb-card-face').click()
  await expect(card).toHaveClass(/is-flipped/)
  await card.getByLabel('已掌握').check()
  await page.reload()
  await expect(page.locator('[data-card="s-values"]').getByLabel('已掌握')).toBeChecked()
})

test('unknown slug shows not found', async ({ page }) => {
  await page.goto('./#/t/does-not-exist')
  await expect(page.getByText('没有找到这个页面')).toBeVisible()
  await page.getByRole('link', { name: '返回知识库首页' }).click()
  await expect(page).toHaveURL(/#\/$/)
})

test('narrow screen has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#/t/cfg')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: 'test-results/cfg-mobile.png', fullPage: false })
})
```

- [ ] **Step 2: 运行**

Run: `npm run test && npm run e2e`
Expected: 全部通过。若失败，调用 `superpowers:systematic-debugging` 定位，修完后重跑。不能通过改断言让测试变绿。

- [ ] **Step 3: 人工检查截图**

用 Read 工具查看 `test-results/cfg-full.png`、`cfg-review.png`、`cfg-mobile.png`，检查有没有布局错乱、重叠或空白演示。另外调用 `webapp-testing` skill，按它的流程在真实浏览器里把每个演示操作一遍。

- [ ] **Step 4: 更新文档**

- `CHANGELOG.md`：新增一条 `## [2026-10-14] - Added`，写明知识库骨架、共用组件、CFG 页面（7 步、11 个可视化、复习区），以及影响范围和相关目录。
- `CURRENT_STATUS.md`：更新进行中、待解决（占位图）、下一步。
- `PROJECT_OVERVIEW.md`：补充共用组件清单和 localStorage 键说明。

- [ ] **Step 5: 最终 Checkpoint**

Run: `npm run test && npm run build && npm run e2e` → 全部通过。向 Guanlin 汇报并附关键截图路径。
```
