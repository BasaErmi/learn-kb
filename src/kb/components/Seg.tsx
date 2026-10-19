import type { ReactNode } from 'react'

/** 分段按钮：在几个互斥选项间切换（选项文字可以是 ReactNode，含公式时给 aria） */
export function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode; aria?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="kb-segctl" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} aria-label={o.aria} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}
