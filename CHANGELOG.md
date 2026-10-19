# 变更日志

## [2026-10-19] - Added
- 新专题「Latent Diffusion Model」（`ldm`），6 步：为什么在 latent 里扩散 → autoencoder → 缩放系数 → latent 上的训练与采样 → 条件生成 → 到 DiT。14 个交互演示：压缩计算器、率失真示意、encoder 逐层拆解、重建对比（原图 / SD VAE / ft-MSE / FLUX VAE，可拖分隔线、点选放大）、latent 直方图与缩放、`std(z₀)` 对方差和 SNR 的影响、缩放与不缩放的前向加噪对比、训练与采样流程、SD 1.5 采样轨迹、普通 / 1×1 / depthwise 卷积对比、展平做注意力的规模与参数量、逐词 cross-attention 图、inpainting 三种做法对比、patchify。页面上的图都是真实模型的输出：VAE 重建、加噪后解码、采样过程中的 $\hat z_0$、cross-attention 图、inpainting 结果、两个 decoder 解码同一 latent。计算逻辑在 `src/topics/ldm/lib/ldm.ts`（15 个单元测试），实测数值在 `lib/measured.json`；新增 `tests/e2e/ldm.spec.ts`（12 个测试，含跨专题链接往返）。相关文件：`src/topics/ldm/`、`public/images/ldm/`、`src/topics/registry.ts`。
- 共用组件：`Seg` 分段按钮；`Demo` 新增 `schematic`（“示意”角标）和 `note`（底部说明）；图片条样式 `.kb-strip` + 左上角标签 `.kb-tag`；`.kb-svg-scroll` 让宽 SVG 在手机上于演示框内横向滚动。样式参考了 OpenWAM 交互页。相关文件：`src/kb/components/Seg.tsx`、`src/kb/components/Demo.tsx`、`src/styles/demo.css`。

## [2026-10-19] - Changed
- `Roadmap` 新增 `legend` 参数覆盖图例文字，图例只列出实际用到的节点类型（还清了“标签为 CFG 写死”的技术债）。相关文件：`src/kb/components/Roadmap.tsx`。
- `tsconfig.json` 开启 `resolveJsonModule`，演示可以直接 import 实测数据。
- 首页闪卡计数的 e2e 测试改为只看 CFG 卡片（现在首页有两个专题）。
- LDM 对话记录放在 `LDM/`，加入发布排除列表。

## [2026-10-15] - Added
- 跨专题链接：`<Ref topic="<slug>" to="<锚点或 step-N>">` 打开目标专题并定位（目标在折叠的讲解块里会自动展开）；右下角出现「↩ 回到《原专题》」，点击后回到原专题的原滚动位置。外链带 ↗ 标记。支持深链接 `#/t/<slug>?at=<锚点>`，`?at` 和 `?y` 处理完后会从地址栏清掉。新增 2 个 e2e 测试（深链接定位、位置恢复）；完整的跨专题往返用一个临时专题验证过，验证后已删除。规则写进 skill 和 PROJECT_OVERVIEW：锚点 id 发布后不改名，加了跨专题链接要补测试。相关文件：`src/kb/jump.tsx`、`src/app/TopicPage.tsx`、`src/styles/kb.css`、`tests/e2e/kb.spec.ts`。

## [2026-10-15] - Fixed
- 从一个专题切换到另一个专题时页面会一直停在旧专题：React Router v7 的导航在 transition 里进行，挂起的渲染会被丢弃，而 `TopicPage` 在渲染时用 `useMemo` 现场创建 lazy 组件，每次重试都是新组件，永远加载不完。改为按专题在模块级缓存 lazy 组件。只有一个专题时不会触发，验证跨专题链接时发现。相关文件：`src/app/TopicPage.tsx`。

## [2026-10-15] - Changed
- 行内公式里的 `a/b` 统一改为 `\frac{a}{b}`：正文 16 处，磁铁演示 1 处。skill 自查清单补充了这一条。相关文件：`src/topics/cfg/index.mdx`、`src/topics/cfg/demos/MagnetDemo.tsx`。

## [2026-10-15] - Changed
- 总览中介绍推导链的那段话改得更短、更口语，按“目标分布 → 改分布就是改噪声预测 → 借分类器 → 省掉分类器”逐步推进。skill 自查清单补充了总览段落的写法要求。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-15] - Removed
- 不再记录图片是怎么来的：删除 `public/images/cfg/SOURCES.md` 和 DiT 对比图的生成脚本，并删掉 README、PROJECT_OVERVIEW、组件注释和 CHANGELOG 里关于图片来源、生成方式与计算资源的描述。规则同时写进 skill：以后的生成脚本不放进仓库，项目文件、提交说明和页面里都不写图片来源与计算资源信息。

## [2026-10-15] - Changed
- 第 1 步：「条件生成的基本做法」末尾写出普通条件生成的采样分布，并用贝叶斯公式拆成 $p(x \mid y) \propto p(x)\,p(y \mid x)$，说明两个因子的含义；要点框开头先给出普通做法，再说锐化是“给第二个因子加指数 $s$”；「我们真正想要的」里引出锐化公式时也改为从 $p(x)\,p(y \mid x)$ 出发，并注明 $s = 1$ 时退回普通条件生成。这样锐化公式不会突然出现。相关文件：`src/topics/cfg/index.mdx`。
- skill 自查清单新增一条：引入“改造后”的公式之前，先写出它的基线形式，再说明改了哪一部分。

## [2026-10-14] - Added
- 项目 skill `learn-topic-page`（`.claude/skills/learn-topic-page/`）：把学习对话记录做成与 CFG 同等水准的专题页。`SKILL.md` 写流程和页面结构，`references/` 下分别是组件与 MDX 注意事项、演示规范、交付前编辑自查清单（来自 CFG 的历次反馈）、GPU 生成真实样本的规则；`assets/review-shots.spec.ts` 是截图自查模板，会在三种宽度下截图，并检查 KaTeX 错误、溢出、NaN 和残留的 Unicode 数学符号。
- 发布排除：`scripts/publish-exclude.txt` 新增 `.claude/`（本地工具配置，不对外公开）和 `*学习对话记录.md`（以后新专题的原始记录会自动被排除）。已用 rsync 演练确认。

## [2026-10-14] - Changed
- 旁注改为宽屏边栏：视口 ≥ 1380px 时，页面网格增加一个 16rem 的右栏，`.kb-aside` 浮动到右栏（Tufte 式 sidenote），纵向和它在源码中的位置对齐；更窄的屏幕仍按行内旁注显示。第 1 步「每个值都变小了…」改回主线小节，因为它有 3 个公式和一张表，而且锐化 demo 的 A/B 例子就出自这里。「为什么需要一串噪声水平」挪到“什么是 score”列表中 Langevin 那条之后，「期望的下标能不能省？」挪到事实 2 推导的结论句之后。相关文件：`src/styles/kb.css`、`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 第 3 步「每一步采样做什么」：删除 classifier guidance 的 PyTorch 代码块及其后的说明段，改为一句衔接：两个模型各训各的，采样时都不更新，代价是每步多一次分类器前向和对输入求梯度。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Added
- 讲解里的小节分成主线和旁注两级。主线 `###` 由 CSS 计数器自动编号为“步号.节号”（如 3.1），编号用强调色。新增 `Aside` 组件（`src/kb/components/Aside.tsx`），把 7 个顺带一提的小节改成浅色、小一号、带左侧细线和「旁注」标签的块，不参与编号：第 1 步「每个值都变小了…」、第 2 步「期望的下标能不能省？」「为什么需要一串噪声水平」、第 5 步「为什么一个网络能同时做好两件事」「p_uncond 怎么取」、第 6 步「常见约定」、第 7 步「为什么文本条件要更大的 s」。相关文件：`src/kb/components/{Aside,Step}.tsx`、`src/kb/mdx-components.tsx`、`src/styles/kb.css`、`src/topics/cfg/index.mdx`、`PROJECT_OVERVIEW.md`。

## [2026-10-14] - Changed
- 第 6 步「一次前向算两个预测」：删除和下方演示重复的代码块，改为一句说明加一个跳到「采样时每一步做什么」演示的链接。演示里的代码加了 Python 语法高亮：新增 `src/kb/highlightPython.tsx`，逐行着色，配色和正文 Shiki 的 github-light 一致，附 3 个单元测试。之所以不用 Shiki，是因为演示需要逐行高亮当前步骤，每行必须是独立的元素。注释精简并统一对齐，桌面宽度下不再需要横向滚动。相关文件：`src/topics/cfg/index.mdx`、`src/topics/cfg/demos/SamplingLoopDemo.tsx`、`src/kb/highlightPython.tsx`、`src/styles/demo.css`。

## [2026-10-14] - Added
- 页内交叉引用与返回按钮（`src/kb/jump.tsx`）：`<Anchor id>` 标记目标，`<Ref to>` 是正文里的可点链接（虚线下划线）。点击后平滑滚动到目标，并短暂高亮目标段落；如果目标是“引导句 + 公式”，两者一起高亮。同时记下跳转前的位置，右下角出现「↩ 回到刚才读的位置」按钮，连续跳转时可以逐级返回，× 可以关闭。复习模式下目标在折叠的讲解块里时会自动展开：`Detail` 折叠时改为隐藏内容而不是卸载，并监听 `kb:reveal` 事件。CFG 页加了 8 个锚点（第 1 步要点、第 2 步换算关系、事实 1/2、第 3 步贝叶斯公式/目标式/三个缺点、第 4 步 CFG 公式）和 13 处引用，包括第 4 步「第 3 步的贝叶斯公式」。新增 2 个 e2e 测试。相关文件：`src/kb/jump.tsx`、`src/kb/components/Detail.tsx`、`src/kb/mdx-components.tsx`、`src/app/TopicPage.tsx`、`src/styles/kb.css`、`src/topics/cfg/index.mdx`、`tests/e2e/kb.spec.ts`。

## [2026-10-14] - Changed
- 第 3 步收尾重排为：流程图 → Pitfall → Quiz → 三个缺点 → 引向第 4 步的过渡句，让过渡句成为这一步的最后一句。梯度强度曲线（一维双类玩具模型）移进 Quiz 的参考答案里，答案中的“上面的曲线”改为“下面的曲线”；原来“加重了缺点 2”的说法，因为缺点现在排在后面，改为“和下面要讲的缺点 2 有关”。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 易错点删去“乘 $-\sqrt{1-\bar\alpha_t}$ 是因为只关心方向”一条（对应的正文段落已经删除），其余条目重新编号，现共 14 条。第 3 步讲缺点前加了过渡：第一项由扩散模型给出，第二项依赖额外的分类器，由此引出三个缺点；结尾自然引到第 4 步，并点明 classifier-free 这个名字的由来。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 第 3 步：小节标题「翻译回噪声预测：单位换算」简化为「翻译回噪声预测」。“反向传播”这个说法容易被理解成训练，于是在正文、步骤列表、CG 与 CFG 对比表、第 4 步对比段落和流程图里，统一改为“对输入 $x_t$ 求梯度 / 用自动微分求对输入的导数”；第一次出现时注明整个过程不涉及训练，分类器参数不动。相关文件：`src/topics/cfg/index.mdx`、`src/topics/cfg/demos/CGPipeline.tsx`。

## [2026-10-14] - Changed
- 第 3 步「翻译回噪声预测」：删除“乘系数不是只关心方向……”整段；$\hat\epsilon$ 的代入展开用 `aligned` 拆成三行（定义 → 代入 → 结果），桌面和手机上都不再挤在一行。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 术语：把学习对话里临时用的比喻“词典”统一改为 **score 与噪声的换算关系**（简称换算关系）。第 2 步要点框下方第一次出现时注明：文献里一般说成噪声预测与 score 等价（ε-prediction 是 score 的一种参数化）。第 3 步公式的标注改为“由 ε_θ 换算”和“由分类器给出”；第 2 步小测验里补写了换算式本身。共替换 9 处，涉及 gist、Pitfall、正文、速查表、易错点和闪卡。相关文件：`src/topics/cfg/index.mdx`、`src/topics/cfg/lib/gmm2d.ts`（注释）。

## [2026-10-14] - Changed
- 第 3 步讲解重新组织，删除「$p_t$ 的下标 $t$ 起什么作用」一节。现在的顺序是：目标（两项）→ 第二项其实是一个分类器（输入是带噪的 $x_t$）→ 为什么不能用现成的分类器（吸收了原来关于 $p_t(y \mid x_t)$ 随 $t$ 变化的要点）→ 用 $p_\phi$ 近似第二项 → 单位换算。原来只写“按词典换算”“就得到要点框里的公式”的地方，改为把词典公式、合起来的 $\hat s$、完整的代入展开和最终的 $\hat\epsilon$ 都直接写出来；「每一步采样做什么」第 3 条也写出了组合公式，读者不用再往回翻。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 第 2 步：删除「这对 CFG 意味着什么」一节。磁铁演示移到「直觉：每个来源都在拉，按可能性加权」之后，并改用事实 2 推导里的记号：$x_t = \sqrt{\bar\alpha_t}x_0 + \sqrt{1-\bar\alpha_t}\epsilon$，噪声 $\epsilon = (x_t - \sqrt{\bar\alpha_t}x_0)/\sqrt{1-\bar\alpha_t}$，拉力 $\nabla_{x_t}\log q(x_t \mid x_0) = -\epsilon/\sqrt{1-\bar\alpha_t}$。控制量由 σ 改为噪声水平 $t$（cosine schedule），磁铁画在加噪后的中心 $\sqrt{\bar\alpha_t}x_0$，箭头统一乘以 $1-\bar\alpha_t$。正文中的示例数值同步更新。相关文件：`src/topics/cfg/lib/magnet2d.ts`、`src/topics/cfg/demos/MagnetDemo.tsx`、`src/topics/cfg/index.mdx`、`tests/e2e/kb.spec.ts`。

## [2026-10-14] - Changed
- 所有交互演示和图表里的公式统一用 KaTeX 渲染：标题、说明、滑块标签、读数、预设按钮、表格，以及 SVG 内的标注（通过 `SvgTex`）。新增 `TexText`，可以把字符串里 `$...$` 包起来的部分渲染成公式，`Demo` 的 title/hint 和 `Slider` 的 label 会自动使用它。标题里带公式的 Demo 用新的 `label` 属性给出可读的无障碍名称；只含公式的按钮补了 `aria-label`。`SvgTex` 默认用无衬线字体，新增 `size` 参数。删除已不再使用的 SVG 下标组件 `Sub`。相关文件：`src/kb/components/{Tex,Demo,Slider,SvgSub}.tsx`、`src/topics/cfg/demos/*.tsx`。

## [2026-10-14] - Changed
- 第 2 步「score 是所有来源“拉力”的加权平均」演示从一维两点改成二维 7 点（三簇）。xₜ 可以在图上拖动、点击或用方向键移动，背景是加噪密度 pₜ。所有箭头都乘了 σ²，所以每条拉力正好指到来源点，score 指向加权重心 E[x₀|xₜ]。演示里的公式改用 KaTeX 渲染，正文里的示例数值也同步更新。新增 `lib/magnet2d.ts`（4 个单元测试）；一维的 `lib/mixture1d.ts` 保留，用来支撑自测卡片里的一维心算题。相关文件：`src/topics/cfg/demos/MagnetDemo.tsx`、`src/topics/cfg/lib/magnet2d.ts`、`src/topics/cfg/index.mdx`、`src/styles/demo.css`、`tests/e2e/kb.spec.ts`。

## [2026-10-14] - Fixed
- 锐化 demo 的纵轴原来随当前曲线的峰高自动缩放，s 增大时 s = 1 的虚线看起来也在变矮。改为固定在 s = 10 的峰高，虚线不再变化。相关文件：`src/topics/cfg/demos/SharpenDemo.tsx`、`tests/e2e/kb.spec.ts`。

## [2026-10-14] - Changed
- 第 7 步的两张 DiT 论文样例图换成真实生成的 guidance scale 对比网格：DiT-XL/2-256 官方权重，类别 207 金毛，4 个固定种子 × s = 1 / 1.5 / 4 / 10，DDIM 50 步（eta=0）。新组件 `ScaleGrid` 把列标题和行说明做成 HTML，深色主题和手机端都能正常显示。相关文件：`src/topics/cfg/demos/ScaleGrid.tsx`、`src/styles/kb.css`、`src/topics/cfg/index.mdx`、`public/images/cfg/dit-scale/`；删除 `dit-samples-0/1.jpg`。

## [2026-10-14] - Changed
- 第 1 步的三张金毛示例图移到「真实分布本身就很“宽”」这一段后面，图片紧跟着对应的论点（现在位于讲解块内，复习模式下随讲解一起收起），并去掉这三张图的来源标注。相关文件：`src/topics/cfg/index.mdx`。

## [2026-10-14] - Changed
- 目录的「已读 x / y」改为只记本次访问，不再存入 localStorage，每次打开或刷新都从头算。原因：滚动经过就算已读，存久了总是满格，不再提供信息；长期学习记录交给闪卡的「已掌握」。首页主题卡片改为显示「已掌握 n 张闪卡」（n 为 0 时不显示）。相关文件：`src/kb/components/TopicToc.tsx`、`src/app/HomePage.tsx`、`src/app/TopicPage.tsx`、`tests/e2e/kb.spec.ts`。

## [2026-10-14] - Added
- GitHub Pages 部署：公开仓库 BasaErmi/learn-kb + Actions 工作流，`npm run publish` 一键同步发布（排除对话记录）。相关文件：`.github/workflows/deploy.yml`、`scripts/publish.sh`、`README.md`。

## [2026-10-14] - Changed
- 第 1 步的「非典型」「低质量」金毛示例由占位框换成真实图片，「典型」示例换成无水印的全身照；修复图片行被误设为 16:7 比例的问题。相关文件：`src/topics/cfg/index.mdx`、`public/images/cfg/`。

## [2026-10-14] - Added
- **CFG 学习页**（`src/topics/cfg/`）：包括第 1～7 步讲解、公式速查、15 条易错点、19 张自测卡片、7 道检验题。
  - 学习过程中的疑问都融入了讲解和复习区，没有单独成节。
  - 11 个可视化：锐化分布、前向加噪（真实照片）、磁铁 score、score 向量场、classifier guidance 流程、分类器梯度强度（玩具模型真实计算）、CFG 外推、label dropout、采样循环、二维真实 CFG 采样、指标趋势（示意）。
- **数值计算库**（`src/topics/cfg/lib/`，37 个单元测试）：用于驱动上面的演示。
- **知识库共用组件**（`src/kb/`）：Step、KeyPoint、Detail、Pitfall、Quiz、Derivation、Figure、Demo、Slider、Tex、SvgSub、Flashcards、Roadmap、TopicToc、ReviewToggle。
- **页面功能**：学习 / 复习两种模式、阅读进度、自测"已掌握"记录（都存在 localStorage）。
- **本地图片**（`public/images/cfg/`）：DiT 样例、金毛、萨摩耶。
- **端到端测试**（`tests/e2e/kb.spec.ts`）：共 12 项。

## [2026-10-14] - Changed
- KaTeX 固定为 0.16.47，与 rehype-katex 内置的版本一致。版本不一致会导致所有下标渲染错位。
- 图表角色色改为经 dataviz 校验通过的一组颜色：有条件 #2468b8、引导结果 #d9582a、无条件 #159a6b。

## [2026-10-14] - Added
- 搭建知识库脚手架（Vite + React + MDX + KaTeX + Vitest + Playwright）。影响范围：整个项目。相关文件：package.json、vite.config.ts、tsconfig.json。
