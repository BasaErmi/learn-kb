import { useState } from 'react'
import { Demo } from '@/kb/components/Demo'
import { Slider } from '@/kb/components/Slider'
import { Tex } from '@/kb/components/Tex'
import { F32_EXP_MAX, Z5, softmax32 } from '../lib/softmax'
import { CLASSES, torchNum } from './common'

const PRESETS = [-110, 0, 50, 86, 88, 100]
const bad = (v: number) => !Number.isFinite(v)

export function StabilityDemo() {
  const [c, setC] = useState(0)
  const z = Z5.map((v) => v + c)
  const naive = softmax32(z, false)
  const stable = softmax32(z, true)
  const m = Math.max(...z)
  const status = naive.e.some((v) => v === Infinity)
    ? <>上溢：<Tex>{`z_1 + c = ${m.toFixed(0)}`}</Tex> 超过了 <Tex>{`${F32_EXP_MAX.toFixed(2)}`}</Tex>，<Tex>{'e^{z_1 + c}'}</Tex> 超出 float32 的上限 <Tex>{'3.4 \\times 10^{38}'}</Tex> 变成 inf，inf / inf = nan</>
    : naive.S === 0
      ? <>下溢：所有 <Tex>{'e^{z_i + c}'}</Tex> 都小于 float32 能表示的最小正数，变成 0，0 / 0 = nan</>
      : naive.e.some((v) => v === 0)
        ? <>部分下溢：最小的几项 <Tex>{'e^{z_i + c}'}</Tex> 变成了 0，概率也跟着变成 0（真实值本来就极小）</>
        : <>两种实现结果一致</>

  return (
    <Demo
      title="给所有 logit 加同一个常数 $c$"
      label="给所有 logit 加同一个常数 c"
      hint="拖动 $c$：数学上 softmax 完全不变，但在 float32 里，直接算 $e^{z_i + c}$ 的实现在 $c$ 大约超过 86.7 时会溢出成 nan；先减最大值的实现一直正确。"
      onReset={() => setC(0)}
      note="用 Math.fround 模拟 float32（PyTorch 的默认精度），每次运算后都舍入一次；inf、nan 是 PyTorch 打印这两种值的写法。logits 是第 1 步的 $z = (2, 1, 0.5, -0.5, -1.5)$，$m = \max_j (z_j + c)$。"
    >
      <Slider label="常数 $c$" value={c} min={-120} max={120} step={1} onChange={setC} format={(v) => v.toFixed(0)} />
      <div className="kb-presets">
        {PRESETS.map((v) => (
          <button key={v} type="button" className="kb-chip" aria-pressed={c === v} aria-label={`c = ${v}`} onClick={() => setC(v)}><Tex>{`c = ${v}`}</Tex></button>
        ))}
      </div>
      <div className="kb-table-scroll">
        <table className="kb-num-table kb-nowrap kb-label-col">
          <thead>
            <tr>
              <th>类别</th>
              <th><Tex>{'z_i + c'}</Tex></th>
              <th>直接算 <Tex>{'e^{z_i + c}'}</Tex></th>
              <th><Tex>{'p_i'}</Tex></th>
              <th>减最大值 <Tex>{'e^{z_i + c - m}'}</Tex></th>
              <th><Tex>{'p_i'}</Tex></th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((name, i) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{z[i].toFixed(1)}</td>
                <td className={bad(naive.e[i]) || naive.e[i] === 0 ? 'is-bad' : undefined}>{torchNum(naive.e[i])}</td>
                <td className={bad(naive.p[i]) ? 'is-bad' : undefined}>{torchNum(naive.p[i])}</td>
                <td>{torchNum(stable.e[i])}</td>
                <td>{torchNum(stable.p[i])}</td>
              </tr>
            ))}
            <tr className="is-total">
              <td>分母</td>
              <td />
              <td className={bad(naive.S) || naive.S === 0 ? 'is-bad' : undefined}>{torchNum(naive.S)}</td>
              <td />
              <td>{torchNum(stable.S)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="kb-demo-note"><b>直接算：</b>{status}</p>
    </Demo>
  )
}
