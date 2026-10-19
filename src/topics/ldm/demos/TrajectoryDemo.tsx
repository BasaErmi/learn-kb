import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex } from '@/kb/components/Tex'
import { img } from '../lib/img'
import measured from '../lib/measured.json'

const IDX = [0, 4, 9, 14, 19, 24, 29, 34, 39, 44, 49]
const pad = (i: number) => String(i).padStart(2, '0')

export function TrajectoryDemo() {
  const [j, setJ] = useState(3)
  const i = IDX[j]
  const t = (measured.trajT as Record<string, number>)[String(i)]
  return (
    <Demo
      title="Stable Diffusion 1.5 的一次真实采样"
      label="SD 采样轨迹"
      hint="DDIM 50 步、CFG $w = 7.5$。拖动滑块，左边是当前的 $z_t$ 直接解码，右边是这一步预测的 $\hat z_0$ 解码。"
      onReset={() => setJ(3)}
      note="提示词：a photo of a corgi sitting on the beach。$\hat z_0 = \frac{z_t - \sqrt{1-\bar\alpha_t}\,\hat\epsilon}{\sqrt{\bar\alpha_t}}$，两列都用 $\mathcal{D}\big(\frac{\cdot}{s}\big)$ 解码。"
    >
      <div className="kb-strip" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <figure><img src={img(`traj-zt-${pad(i)}.jpg`)} alt={`z_t 解码，第 ${i + 1} 步`} /><span className="kb-tag"><Tex>{'\\mathcal{D}\\big(\\tfrac{z_t}{s}\\big)'}</Tex></span></figure>
        <figure><img src={img(`traj-x0-${pad(i)}.jpg`)} alt={`预测 z0 解码，第 ${i + 1} 步`} /><span className="kb-tag"><Tex>{'\\mathcal{D}\\big(\\tfrac{\\hat z_0}{s}\\big)'}</Tex></span></figure>
      </div>
      <label className="kb-slider">
        <span>第几步</span>
        <input type="range" min={0} max={IDX.length - 1} step={1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="采样步" />
        <output>{i + 1}/50</output>
      </label>
      <p className="kb-demo-readout"><span><Tex>t</Tex> = <b>{t}</b></span><span>{t > 700 ? '构图和大色块最先确定' : t > 300 ? '物体轮廓、五官逐渐清晰' : '只剩高频细节在修'}</span></p>
    </Demo>
  )
}
