import { Children, type ReactNode } from 'react'

/** MDX 会把换行当作文本子节点，按“每个子元素是一项”处理前先去掉 */
export function meaningfulChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).filter((c) => !(typeof c === 'string' && c.trim() === ''))
}
