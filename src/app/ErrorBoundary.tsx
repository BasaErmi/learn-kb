import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** 渲染出错（如主题 chunk 加载失败）时给出可恢复的提示，而不是整页白屏 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  clearAndReload = () => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('kb:')).forEach((k) => localStorage.removeItem(k))
    } catch {
      // 存储不可用时直接刷新
    }
    location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="kb-notfound">
        <h1>页面出错了</h1>
        <p className="kb-muted">{this.state.error.message}</p>
        <p>
          <Link to="/">返回知识库首页</Link>
          {' · '}
          <button type="button" className="kb-btn-ghost" onClick={() => location.reload()}>重新加载</button>
          {' · '}
          <button type="button" className="kb-btn-ghost" onClick={this.clearAndReload}>清除本地记录并重新加载</button>
        </p>
      </div>
    )
  }
}
