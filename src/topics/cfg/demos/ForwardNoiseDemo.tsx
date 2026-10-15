import { useEffect, useMemo, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { alphaBar } from '../lib/schedule'
import { forwardNoise, gaussianField, toRGBA, toSigned } from '../lib/forwardNoise'
import { Tex } from '@/kb/components/Tex'

const SRC = 'images/cfg/samoyed.jpg'
const SIZE = 192
const THUMBS = [0, 0.25, 0.5, 0.75, 1]

function draw(canvas: HTMLCanvasElement | null, x0: Float32Array, noise: Float32Array, ab: number) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  const rgba = toRGBA(forwardNoise(x0, noise, ab))
  ctx.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, SIZE, SIZE), 0, 0)
}

export function ForwardNoiseDemo() {
  const [t, setT] = useState(0.35)
  const [seed, setSeed] = useState(7)
  const [x0, setX0] = useState<Float32Array | null>(null)
  const [error, setError] = useState(false)
  const main = useRef<HTMLCanvasElement>(null)
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([])
  const noise = useMemo(() => gaussianField(SIZE * SIZE * 3, seed), [seed])
  const ab = alphaBar(t)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = SIZE
      const ctx = c.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
      setX0(toSigned(ctx.getImageData(0, 0, SIZE, SIZE).data))
    }
    img.onerror = () => setError(true)
    img.src = import.meta.env.BASE_URL + SRC
  }, [])

  useEffect(() => { if (x0) draw(main.current, x0, noise, ab) }, [x0, noise, ab])
  useEffect(() => { if (x0) THUMBS.forEach((tt, i) => draw(thumbs.current[i], x0, noise, alphaBar(tt))) }, [x0, noise])

  return (
    <Demo
      label="前向加噪：xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε"
      title="前向加噪：$x_t = \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\epsilon$"
      hint="在浏览器里对一张真实照片逐像素计算。$t$ 接近 1 时图像信息几乎消失，$x_t$ 近似就是噪声 $\epsilon$ 本身。"
      onReset={() => { setT(0.35); setSeed(7) }}
    >
      {error ? (
        <p className="kb-muted">图片加载失败：请确认 public/{SRC} 存在。</p>
      ) : (
        <>
          <div className="kb-demo-grid">
            <canvas ref={main} width={SIZE} height={SIZE} style={{ width: '100%', borderRadius: 4, border: '1px solid var(--rule)' }} aria-label="加噪后的图像" />
            <div className="kb-demo-readout" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span><Tex>{'\\bar\\alpha_t'}</Tex> = <b>{ab.toFixed(3)}</b></span>
              <span>信号系数 <Tex>{'\\sqrt{\\bar\\alpha_t}'}</Tex> = <b>{Math.sqrt(ab).toFixed(3)}</b></span>
              <span>噪声系数 <Tex>{'\\sqrt{1-\\bar\\alpha_t}'}</Tex> = <b>{Math.sqrt(1 - ab).toFixed(3)}</b></span>
              <button type="button" className="kb-btn-ghost" onClick={() => setSeed(seed + 1)}>换一组噪声 <Tex>{'\\epsilon'}</Tex></button>
            </div>
          </div>
          <Slider label="噪声水平 $t$" value={t} min={0} max={1} step={0.01} onChange={setT} />
          <div className="kb-thumbs">
            {THUMBS.map((tt, i) => (
              <figure key={tt}>
                <canvas ref={(el) => { thumbs.current[i] = el }} width={SIZE} height={SIZE} />
                <Tex>{`t = ${tt}`}</Tex>
              </figure>
            ))}
          </div>
        </>
      )}
    </Demo>
  )
}
