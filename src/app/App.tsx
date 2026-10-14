import { HashRouter, Route, Routes } from 'react-router-dom'
import { ReviewModeProvider } from '@/kb/state/ReviewMode'
import { Shell } from './Shell'
import { HomePage } from './HomePage'
import { TopicPage } from './TopicPage'
import { NotFound } from './NotFound'

export function App() {
  return (
    <HashRouter>
      <ReviewModeProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/t/:slug" element={<TopicPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ReviewModeProvider>
    </HashRouter>
  )
}
