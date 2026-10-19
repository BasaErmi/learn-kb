import { useEffect, useRef, useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { img } from '../lib/img'
import measured from '../lib/measured.json'

type Maps = Record<string, number[][][]>
const TOKENS = measured.tokens.map((t: string) => t.replace('</w>', '').replace('<|startoftext|>', '[起始]').replace('<|endoftext|>', '[结束]'))

/** 把 side×side 的注意力图按单色顺序色阶叠到图像上 */
function paint(canvas: HTMLCanvasElement, photo: HTMLImageElement, m: number[][]) {
  const ctx = canvas.getContext('2d')!
  const S = canvas.width, side = m.length
  const flat = m.flat()
  const lo = Math.min(...flat), hi = Math.max(...flat)
  const small = document.createElement('canvas')
  small.width = small.height = side
  const sc = small.getContext('2d')!
  const id = sc.createImageData(side, side)
  flat.forEach((v, i) => {
    const u = hi > lo ? (v - lo) / (hi - lo) : 0
    id.data[i * 4] = 217; id.data[i * 4 + 1] = 88; id.data[i * 4 + 2] = 42; id.data[i * 4 + 3] = Math.round(u * 215)
  })
  sc.putImageData(id, 0, 0)
  ctx.clearRect(0, 0, S, S)
  ctx.filter = 'grayscale(0.85) brightness(0.9)'
  ctx.drawImage(photo, 0, 0, S, S)
  ctx.filter = 'none'
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small, 0, 0, S, S)
}

export function CrossAttnDemo() {
  const [maps, setMaps] = useState<Maps | null>(null)
  const [seed, setSeed] = useState(8)
  const [res, setRes] = useState(16)
  const [tok, setTok] = useState(2)
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => { fetch(img('xattn.json')).then((r) => r.json()).then(setMaps).catch(() => setMaps(null)) }, [])
  useEffect(() => {
    const im = new Image()
    im.onload = () => setPhoto(im)
    im.src = img(`hat-${seed}.jpg`)
  }, [seed])
  const m = maps?.[`${seed}_${res}`]?.[tok]
  useEffect(() => { if (m && photo && cv.current) paint(cv.current, photo, m) }, [m, photo])
  const mass = m ? m.flat().reduce((a, b) => a + b, 0) / m.flat().length : 0
  return (
    <Demo
      title="cross-attention 图：每个词落在图像的哪里"
      label="cross-attention 实测图"
      hint="点击提示词里的某个词，看图像各位置的 query 有多关注这个词的 key（softmax 后的权重）。颜色越深越关注。"
      onReset={() => { setSeed(8); setRes(16); setTok(2) }}
      note="SD 1.5 采样 50 步，在 UNet 所有该分辨率的 cross-attention 层、8 个头、全部时间步上取平均；只取有条件分支。颜色按每个词各自的最小、最大值归一化。"
    >
      <div className="kb-controls">
        <Seg label="样本" value={seed} onChange={setSeed} options={[{ value: 8, label: '样本 A' }, { value: 5, label: '样本 B' }]} />
        <Seg label="分辨率" value={res} onChange={setRes} options={[{ value: 16, label: '16×16 层' }, { value: 32, label: '32×32 层' }]} />
      </div>
      <div className="kb-presets" role="group" aria-label="提示词">
        {TOKENS.map((t, i) => (
          <button key={i} type="button" className={i === tok ? 'kb-btn' : 'kb-btn-ghost'} aria-pressed={i === tok} onClick={() => setTok(i)}>{t}</button>
        ))}
      </div>
      <div className="kb-demo-grid">
        <div className="kb-strip" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <figure><img src={img(`hat-${seed}.jpg`)} alt="生成结果" /><span className="kb-tag">生成结果</span></figure>
          <figure><canvas ref={cv} width={384} height={384} aria-label={`“${TOKENS[tok]}”的注意力图`} /><span className="kb-tag">{TOKENS[tok]}</span></figure>
        </div>
        <div className="kb-demo-readout" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span>注意力矩阵 <Tex>{'QK^\\top'}</Tex>：<b>{res * res}×77</b></span>
          <span>这一列是第 {tok} 个文本 token 的 key</span>
          <span>所有位置给它的平均权重 <b>{(mass * 100).toFixed(1)}%</b></span>
        </div>
      </div>
      {!maps && <p className="kb-muted">注意力数据加载中……</p>}
    </Demo>
  )
}
