import { createContext, useContext, type ReactNode } from 'react'
import { usePersistentState } from './usePersistentState'

interface ReviewModeValue { review: boolean; setReview: (v: boolean) => void }
const Ctx = createContext<ReviewModeValue>({ review: false, setReview: () => {} })

export function ReviewModeProvider({ children }: { children: ReactNode }) {
  const [review, setReview] = usePersistentState('kb:reviewMode', false)
  return (
    <Ctx.Provider value={{ review, setReview }}>
      <div className="kb-root" data-review={review ? 'on' : 'off'}>{children}</div>
    </Ctx.Provider>
  )
}

export const useReviewMode = () => useContext(Ctx)
