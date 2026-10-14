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
