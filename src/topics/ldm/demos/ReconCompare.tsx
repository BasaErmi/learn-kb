import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { img } from '../lib/img'
import measured from '../lib/measured.json'

type Key = 'faces_small' | 'text' | 'astronaut' | 'coffee' | 'cat'
type Dec = 'sd' | 'mse' | 'flux'
const IMGS: { value: Key; label: string; zoom: [number, number] }[] = [
  { value: 'faces_small', label: '小人脸', zoom: [0.04, 0.02] },
  { value: 'text', label: '小字', zoom: [0.03, 0.5] },
  { value: 'astronaut', label: '人像', zoom: [0.3, 0.1] },
  { value: 'coffee', label: '咖啡', zoom: [0.3, 0.3] },
  { value: 'cat', label: '猫', zoom: [0.35, 0.3] },
]
const DECS: { value: Dec; label: string; desc: string }[] = [
  { value: 'sd', label: 'SD VAE', desc: 'f = 8, c = 4，SD 1.x / DiT 用的原版' },
  { value: 'mse', label: 'SD VAE · ft-MSE', desc: '同一个 encoder 和 latent，只换了微调过的 decoder' },
  { value: 'flux', label: 'FLUX VAE', desc: 'f = 8, c = 16' },
]
const src = (k: Key, v: string) => img(`rec-${k}-${v}.${k === 'text' ? 'png' : 'jpg'}`)
const Z = 0.25 // 放大窗口边长占原图的比例

export function ReconCompare() {
  const [k, setK] = useState<Key>('faces_small')
  const [d, setD] = useState<Dec>('sd')
  const [wipe, setWipe] = useState(50)
  const [zoom, setZoom] = useState<[number, number]>(IMGS[0].zoom)
  const psnr = (measured.psnr as Record<Key, Record<Dec, number>>)[k]
  const pick = (key: Key) => { setK(key); setZoom(IMGS.find((i) => i.value === key)!.zoom) }
  const lens = (s: string, label: string) => (
    <figure>
      <div style={{ aspectRatio: '1', borderRadius: 4, border: '1px solid var(--rule)', backgroundImage: `url(${s})`, backgroundSize: `${100 / Z}%`, backgroundPosition: `${(zoom[0] / (1 - Z)) * 100}% ${(zoom[1] / (1 - Z)) * 100}%`, imageRendering: 'pixelated' }} role="img" aria-label={`${label}放大`} />
      <span className="kb-tag">{label}</span>
    </figure>
  )
  return (
    <Demo
      title="重建质量就是生成质量的上限"
      label="autoencoder 重建对比"
      hint="左图拖动分隔线对比原图（左）和重建（右）；点击图上任意位置，下方放大这块区域。"
      onReset={() => { pick('faces_small'); setD('sd'); setWipe(50) }}
      note="重建是 $\mathcal{D}(\mathcal{E}(x))$。小人脸是同一张人像缩到 128×128 后平铺 4×4；小字是一张逐行变小的排版测试图。"
    >
      <div className="kb-controls">
        <Seg label="测试图" value={k} onChange={pick} options={IMGS.map(({ value, label }) => ({ value, label }))} />
        <Seg label="autoencoder" value={d} onChange={setD} options={DECS.map(({ value, label }) => ({ value, label }))} />
      </div>
      <div className="kb-demo-grid" style={{ alignItems: 'start' }}>
        <div
          style={{ position: 'relative', aspectRatio: '1', cursor: 'crosshair', userSelect: 'none' }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const cx = (e.clientX - r.left) / r.width, cy = (e.clientY - r.top) / r.height
            setZoom([Math.min(1 - Z, Math.max(0, cx - Z / 2)), Math.min(1 - Z, Math.max(0, cy - Z / 2))])
          }}
        >
          <img src={src(k, d)} alt="重建" style={{ position: 'absolute', inset: 0, width: '100%', borderRadius: 4 }} />
          <img src={src(k, 'orig')} alt="原图" style={{ position: 'absolute', inset: 0, width: '100%', borderRadius: 4, clipPath: `inset(0 ${100 - wipe}% 0 0)` }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe}%`, width: 2, background: 'var(--accent)' }} />
          <div style={{ position: 'absolute', left: `${zoom[0] * 100}%`, top: `${zoom[1] * 100}%`, width: `${Z * 100}%`, height: `${Z * 100}%`, border: '2px solid var(--c-guided)', borderRadius: 2, pointerEvents: 'none' }} />
          <span className="kb-tag">原图 | 重建</span>
        </div>
        <div className="kb-demo-readout" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span>{DECS.find((x) => x.value === d)!.desc}</span>
          {DECS.map((x) => (
            <span key={x.value} style={{ fontWeight: x.value === d ? 600 : 400 }}>{x.label} PSNR = <b>{psnr[x.value].toFixed(1)}</b> dB</span>
          ))}
          <span>PSNR 越高，<Tex>{'\\mathcal{D}(\\mathcal{E}(x))'}</Tex> 越接近原图。</span>
        </div>
      </div>
      <label className="kb-slider"><span>分隔线</span><input type="range" min={0} max={100} step={1} value={wipe} onChange={(e) => setWipe(Number(e.target.value))} aria-label="分隔线位置" /><output>{wipe}%</output></label>
      <div className="kb-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {lens(src(k, 'orig'), '原图')}
        {DECS.map((x) => lens(src(k, x.value), x.label))}
      </div>
    </Demo>
  )
}
