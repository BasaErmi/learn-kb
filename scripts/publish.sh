#!/usr/bin/env bash
# 把 learnHtml 同步到公开仓库 learn-kb 并推送；推送后 GitHub Actions 自动部署到 Pages。
# 原始学习对话记录（CFG/）等私有内容由 publish-exclude.txt 排除，不会进入公开仓库。
# 用法：npm run publish -- "提交说明"   （公开仓库默认在 ../../learn-kb，可用 LEARN_KB_DIR 覆盖）
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${LEARN_KB_DIR:-$SRC/../../learn-kb}"
[ -d "$DEST/.git" ] || { echo "找不到公开仓库：$DEST（先 git clone git@github.com:BasaErmi/learn-kb.git）" >&2; exit 1; }

rsync -a --delete --exclude-from="$SRC/scripts/publish-exclude.txt" "$SRC/" "$DEST/"

cd "$DEST"
git add -A
if git diff --cached --quiet; then
  echo "公开仓库没有变化，无需发布"
  exit 0
fi
git commit -q -m "${1:-sync from personalDocument/learnHtml}"
git push
echo "已推送，部署进度：https://github.com/BasaErmi/learn-kb/actions"
