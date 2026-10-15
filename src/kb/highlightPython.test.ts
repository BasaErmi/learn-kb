import { isValidElement, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { highlightPython } from './highlightPython'

type Tok = ReactElement<{ className: string; children: string }>
const toks = (line: string) =>
  highlightPython(line).filter((n): n is Tok => isValidElement(n)).map((n) => [n.props.className, n.props.children])
const text = (line: string) =>
  highlightPython(line).map((n) => (isValidElement(n) ? (n as Tok).props.children : n)).join('')

describe('highlightPython', () => {
  it('keeps the line text unchanged', () => {
    for (const l of ['def cfg_step(model, x_t, t, y, s, null_label):', "    x = f('a#b', 0.5)  # 注释 ( )", '    eps_y, eps_null = eps[:B], eps[B:]'])
      expect(text(l)).toBe(l)
  })
  it('classifies keywords, calls, numbers, strings and comments', () => {
    expect(toks("def f(x): return g(x, 0) + 'a'  # done")).toEqual([
      ['tok-kw', 'def'], ['tok-fn', 'f'], ['tok-kw', 'return'], ['tok-fn', 'g'], ['tok-num', '0'], ['tok-str', "'a'"], ['tok-com', '# done'],
    ])
  })
  it('does not treat # inside a string as a comment', () => {
    expect(toks("s = '#x'")).toEqual([['tok-str', "'#x'"]])
  })
})
