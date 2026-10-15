import type { ReactNode } from 'react'

/**
 * 演示组件里的单行 Python 着色（逐行高亮需要每行独立，所以不用构建期的 Shiki）。
 * 只覆盖示例代码用到的语法：注释、字符串、关键字、数字、函数调用。配色与正文代码块的 github-light 一致。
 */
const KEYWORDS = new Set(['def', 'return', 'for', 'in', 'if', 'elif', 'else', 'while', 'with', 'import', 'from', 'as', 'lambda', 'and', 'or', 'not', 'is', 'None', 'True', 'False'])
const TOKEN = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b(\s*\()?/g

export function highlightPython(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push(line.slice(last, i))
    const [all, comment, str, num, ident, call] = m
    if (comment) out.push(<i key={i} className="tok-com">{comment}</i>)
    else if (str) out.push(<i key={i} className="tok-str">{str}</i>)
    else if (num) out.push(<i key={i} className="tok-num">{num}</i>)
    else if (ident && KEYWORDS.has(ident)) out.push(<i key={i} className="tok-kw">{ident}</i>, call ?? '')
    else if (ident && call) out.push(<i key={i} className="tok-fn">{ident}</i>, call)
    else out.push(all)
    last = i + all.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}
