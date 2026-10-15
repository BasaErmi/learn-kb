import katex from 'katex'

/** 在 TSX（演示组件）里渲染公式；MDX 正文直接写 $...$ */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: block })
  return <span className={block ? 'kb-tex-block' : 'kb-tex'} dangerouslySetInnerHTML={{ __html: html }} />
}

/** 普通文字里夹公式：`$...$` 之间的部分交给 KaTeX，其余原样输出 */
export function TexText({ children }: { children: string }) {
  return <>{children.split(/(\$[^$]+\$)/).map((part, i) => (part.length > 2 && part.startsWith('$') && part.endsWith('$') ? <Tex key={i}>{part.slice(1, -1)}</Tex> : part))}</>
}
