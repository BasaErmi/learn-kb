import type { ReactNode } from 'react'
import { useReviewMode } from '@/kb/state/ReviewMode'

interface FigureProps {
  src?: string
  alt?: string
  caption?: ReactNode
  source?: { label: string; href: string }
  placeholder?: string
  wide?: boolean
}

export function Figure({ src, alt = '', caption, source, placeholder, wide }: FigureProps) {
  const { review } = useReviewMode()
  if (review) return null
  return (
    <figure className={wide ? 'kb-figure kb-wide' : 'kb-figure'}>
      {src ? (
        <img src={import.meta.env.BASE_URL + src} alt={alt} loading="lazy" />
      ) : (
        <div className="kb-placeholder" role="img" aria-label={placeholder}>
          <span>待补图片</span>
          {placeholder}
        </div>
      )}
      {(caption || source) && (
        <figcaption>
          {caption}
          {source && (
            <span className="kb-source">
              来源：<a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
