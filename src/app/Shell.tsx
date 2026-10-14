import { Link, Outlet, useLocation } from 'react-router-dom'
import { ReviewToggle } from '@/kb/components/ReviewToggle'
import { ErrorBoundary } from './ErrorBoundary'

export function Shell() {
  const { pathname } = useLocation()
  return (
    <>
      <header className="kb-topbar">
        <Link to="/" className="kb-brand">Guanlin 的知识库</Link>
        <ReviewToggle />
      </header>
      <main className="kb-main">
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  )
}
