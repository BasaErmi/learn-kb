import { Link } from 'react-router-dom'
import { toneOf } from '@/topics/taxonomy'

/** 一个彩色标签：传 to 时是链接（专题页头），否则只是展示（首页卡片，整张卡片已经是链接） */
export function Tag({ tag, to, active = false }: { tag: string; to?: string; active?: boolean }) {
  const props = { className: active ? 'kb-pill is-active' : 'kb-pill', 'data-tone': toneOf(tag) }
  return to ? <Link {...props} to={to}>{tag}</Link> : <span {...props}>{tag}</span>
}
