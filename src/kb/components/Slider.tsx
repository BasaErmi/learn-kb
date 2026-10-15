import { useId, type ReactNode } from 'react'
import { TexText } from './Tex'

interface SliderProps {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function Slider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(2) }: SliderProps) {
  const id = useId()
  return (
    <div className="kb-slider">
      <label htmlFor={id}>{typeof label === 'string' ? <TexText>{label}</TexText> : label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output htmlFor={id}>{format(value)}</output>
    </div>
  )
}
