import { useReviewMode } from '@/kb/state/ReviewMode'

export function ReviewToggle() {
  const { review, setReview } = useReviewMode()
  return (
    <div className="kb-seg" role="group" aria-label="阅读模式">
      <button type="button" aria-pressed={!review} onClick={() => setReview(false)}>学习</button>
      <button type="button" aria-pressed={review} onClick={() => setReview(true)}>复习</button>
    </div>
  )
}
