import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Seg } from '@/kb/components/Seg'
import { Tex } from '@/kb/components/Tex'
import { img } from '../lib/img'

const STEPS = [0, 10, 20, 30, 40, 49]
const T_OF = [981, 781, 581, 381, 181, 1]

export function InpaintDemo() {
  const [seed, setSeed] = useState(1)
  const [j, setJ] = useState(1)
  const panels = [
    { src: 'corgi.jpg', tag: '原图', cap: '要把遮住的柯基换成白猫' },
    { src: 'inp-masked.jpg', tag: '被遮挡的图', cap: '遮罩区域置零（灰块）' },
    { src: `inpa-low-${seed}.jpg`, tag: 'A · 加噪少', cap: '从 t = 581 出发：灰块残留' },
    { src: `inpa-high-${seed}.jpg`, tag: 'A · 加噪多', cap: '从 t = 821 出发：背景也变了' },
    { src: `inpb-${seed}.jpg`, tag: 'B · 逐步替换', cap: '保留区严格一致，衔接偏弱' },
    { src: `inpc-${seed}.jpg`, tag: 'C · 通道拼接', cap: 'inpainting 模型，结果贴回原图' },
  ]
  const s = STEPS[j]
  return (
    <Demo
      title="inpainting 的三种做法"
      label="inpainting 三种方案对比"
      hint="同一张图、同一个遮罩、同一个提示词和种子。A、B 用普通的 SD 1.5，C 用 9 通道输入的 SD inpainting 模型。"
      onReset={() => { setSeed(1); setJ(1) }}
      note="提示词：a fluffy white cat sitting on the beach。50 步 DDIM，CFG $w = 7.5$。遮罩只盖住身体，耳朵和脚留在保留区，所以三种方法都必须和它们衔接。"
    >
      <Seg label="随机种子" value={seed} onChange={setSeed} options={[1, 2, 3].map((v) => ({ value: v, label: `种子 ${v}` }))} />
      <div className="kb-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {panels.map((p) => (
          <figure key={p.tag}><img src={img(p.src)} alt={p.tag} /><span className="kb-tag">{p.tag}</span><figcaption>{p.cap}</figcaption></figure>
        ))}
      </div>
      <p className="kb-demo-note"><b>每一步模型实际看到的保留区域</b>（种子 1）：B 只能看到加了噪的原图，C 每一步都能看到干净的被遮挡图。</p>
      <div className="kb-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <figure><img src={img(`inpb-seen-${String(s).padStart(2, '0')}.jpg`)} alt="B 看到的输入" /><span className="kb-tag">B：<Tex>{'z_t'}</Tex> 解码</span></figure>
        <figure><img src={img('inp-masked.jpg')} alt="C 的条件" /><span className="kb-tag">C：拼接的条件</span></figure>
        <figure><img src={img('inp-mask.png')} alt="遮罩" /><span className="kb-tag">C：遮罩通道</span></figure>
      </div>
      <label className="kb-slider">
        <span>第几步</span>
        <input type="range" min={0} max={STEPS.length - 1} step={1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="采样步" />
        <output>{s + 1}/50</output>
      </label>
      <p className="kb-demo-readout">
        <span><Tex>t</Tex> = <b>{T_OF[j]}</b></span>
        <span>C 的输入：<Tex>{'z_t'}</Tex>（4）+ 遮罩（1）+ 被遮挡图的 latent（4）= <b>9</b> 通道</span>
      </p>
    </Demo>
  )
}
