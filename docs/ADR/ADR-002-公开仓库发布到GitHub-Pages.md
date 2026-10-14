# ADR-002：通过独立公开仓库发布到 GitHub Pages

- 日期：2026-10-14
- 状态：已采纳

## 背景
知识库源码在私有仓库 personalDocument 中。这个仓库里还有简历、其他项目笔记，以及原始的学习对话记录，不适合公开。私有仓库开 Pages 需要 GitHub Pro，而且站点本身无论如何都是公开的。

## 考虑的方案
1. 把 personalDocument 改为公开：会暴露无关的私人内容。
2. 在私有仓库开 Pages：需要付费账号，站点仍是公开的。
3. **新建公开仓库 learn-kb，只放网站代码（采纳）**：免费，不暴露其他内容。

## 决定
- 采用方案 3，公开仓库从一个干净的初始提交开始，不带 personalDocument 的历史。
- 源码继续在 personalDocument/learnHtml 维护，用 `npm run publish` 把代码 rsync 到公开仓库并推送。`CFG/` 等内容由 `scripts/publish-exclude.txt` 排除。
- 推送后由 GitHub Actions 自动测试、构建并部署。

## 后果
- 公开仓库只是发布副本，修改都应在 personalDocument 中进行，否则下次同步会被覆盖。
- 两个仓库的提交历史相互独立。
