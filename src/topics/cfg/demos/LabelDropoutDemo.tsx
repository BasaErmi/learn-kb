import { useState, type ReactNode } from 'react'
import { Tex } from '@/kb/components/Tex'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { dropLabels } from '../lib/labelDropout'
import { mulberry32 } from '../lib/prng'

const LABELS = ['金毛', '猫', '汽车', '咖啡', '钢琴', '向日葵', '企鹅', '火车', '金毛', '猫', '桥', '蘑菇', '金毛', '帆船', '披萨', '狐狸']

function verdict(p: number): ReactNode {
  if (p < 0.03) return <>太小：<Tex>{'\\epsilon_\\varnothing'}</Tex> 几乎没被训练，guidance 的方向 <Tex>{'\\epsilon_y - \\epsilon_\\varnothing'}</Tex> 不可靠。</>
  if (p > 0.4) return '太大：训练量被分走太多，条件生成本身变弱。'
  return '合理区间：无条件预测只是“参照点”，不必特别好（DiT 用 0.1）。'
}

export function LabelDropoutDemo() {
  const [p, setP] = useState(0.1)
  const [seed, setSeed] = useState(1)
  const [total, setTotal] = useState({ n: 0, dropped: 0 })
  const batch = dropLabels(LABELS, p, mulberry32(seed * 7919))
  const dropped = batch.filter((l) => l === null).length

  const draw = (times: number) => {
    let n = 0, d = 0
    for (let k = 1; k <= times; k++) {
      const b = dropLabels(LABELS, p, mulberry32((seed + k) * 7919))
      n += b.length
      d += b.filter((l) => l === null).length
    }
    setSeed(seed + times)
    setTotal({ n: total.n + n, dropped: total.dropped + d })
  }
  const changeP = (v: number) => { setP(v); setTotal({ n: 0, dropped: 0 }) }

  return (
    <Demo
      title="label dropout：一个网络同时学会有条件和无条件"
      hint="训练时每个样本独立地以概率 $p_{\text{uncond}}$ 把标签换成空标记 $\varnothing$，其余照常。"
      onReset={() => { setP(0.1); setSeed(1); setTotal({ n: 0, dropped: 0 }) }}
    >
      <div className="kb-tiles" aria-label="当前 batch">
        {batch.map((l, i) => (
          <div key={i} className={l === null ? 'kb-tile is-null' : 'kb-tile'}>
            {l === null ? (<><span className="kb-null"><Tex>{'\\varnothing'}</Tex></span><s>{LABELS[i]}</s></>) : l}
          </div>
        ))}
      </div>
      <Slider label="$p_{\text{uncond}}$" value={p} min={0} max={1} step={0.01} onChange={changeP} />
      <div className="kb-presets">
        <button type="button" className="kb-btn" onClick={() => draw(1)}>抽下一个 batch</button>
        <button type="button" className="kb-btn-ghost" onClick={() => draw(100)}>连抽 100 个</button>
      </div>
      <div className="kb-demo-readout">
        <span>本 batch 被替换：<b>{dropped}</b> / {LABELS.length}</span>
        <span>累计 {total.n} 个样本，<Tex>{'\\varnothing'}</Tex> 占 <b>{total.n ? ((total.dropped / total.n) * 100).toFixed(1) : '—'}%</b></span>
      </div>
      <p className="kb-demo-note">{verdict(p)}</p>
    </Demo>
  )
}
