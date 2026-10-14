import katex from 'katex'

/** 在 TSX（演示组件）里渲染公式；MDX 正文直接写 $...$ */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: block })
  return <span className={block ? 'kb-tex-block' : 'kb-tex'} dangerouslySetInnerHTML={{ __html: html }} />
}
