import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Tex } from '@/kb/components/Tex'
import { img } from '../lib/img'
import { alphaBar, residual } from '../lib/ldm'
import measured from '../lib/measured.json'

const TS = [0, 200, 400, 600, 800, 900, 999]
const S = 0.18215

export function ForwardScaleDemo() {
  const [i, setI] = useState(4)
  const t = TS[i]
  const fw = (measured.forward as Record<string, { corr_scaled: number; corr_raw: number }>)[String(t)]
  const ab = alphaBar(t)
  return (
    <Demo
      title="同一张图加噪到 $t$：缩放 vs 不缩放"
      label="前向加噪：缩放与不缩放对比"
      hint="对真实 latent 按 $z_t = \sqrt{\bar\alpha_t}\,z_0 + \sqrt{1-\bar\alpha_t}\,\epsilon$ 加噪（同一个 $\epsilon$），再用 decoder 解码出来看。"
      onReset={() => setI(4)}
      note="左图 $z_0 = s\cdot\mathcal{E}(x)$，解码时先除以 $s$；右图直接用 $z_0 = \mathcal{E}(x)$。相关系数是 $z_t$ 与 $z_0$ 的余弦相似度，越接近 0 越像纯噪声。"
    >
      <div className="kb-strip" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <figure><img src={img(`fwd-scaled-${t}.jpg`)} alt={`缩放后 t=${t}`} /><span className="kb-tag">缩放后 <Tex>{'\\operatorname{std}(z_0) \\approx 1'}</Tex></span></figure>
        <figure><img src={img(`fwd-raw-${t}.jpg`)} alt={`不缩放 t=${t}`} /><span className="kb-tag">不缩放 <Tex>{'\\operatorname{std}(z_0) \\approx 5.5'}</Tex></span></figure>
      </div>
      <label className="kb-slider">
        <span>时间步 <Tex>t</Tex></span>
        <input type="range" min={0} max={TS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-label="时间步" />
        <output>{t}</output>
      </label>
      <table className="kb-num-table">
        <thead><tr><th><Tex>{`t = ${t},\\ \\bar\\alpha_t = ${ab.toFixed(4)}`}</Tex></th><th>缩放后</th><th>不缩放</th></tr></thead>
        <tbody>
          <tr><td>残留信号 <Tex>{'\\sqrt{\\bar\\alpha_t}\\cdot\\operatorname{std}(z_0)'}</Tex></td><td>{residual(ab, 1).toFixed(3)}</td><td>{residual(ab, 1 / S).toFixed(3)}</td></tr>
          <tr><td>与 <Tex>{'z_0'}</Tex> 的相关系数（实测）</td><td>{fw.corr_scaled.toFixed(3)}</td><td>{fw.corr_raw.toFixed(3)}</td></tr>
        </tbody>
      </table>
    </Demo>
  )
}
