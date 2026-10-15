import { useEffect, useState, type ReactNode } from 'react'
import { Tex } from '@/kb/components/Tex'
import { Demo } from '@/kb/components/Demo'
import { SvgTex } from '@/kb/components/SvgSub'
import { highlightPython } from '@/kb/highlightPython'

const STAGES: { title: string; text: ReactNode; lines: number[] }[] = [
  { title: '复制 batch', text: <>同一个 <Tex>x_t</Tex> 复制两份：前一半配条件 <Tex>y</Tex>，后一半配空标记 <Tex>{'\\varnothing'}</Tex>。两份是同一个 <Tex>x_t</Tex>，两者的差才纯粹来自条件。</>, lines: [1, 2, 3, 4] },
  { title: '一次前向', text: '把 2B 大小的 batch 送进同一个网络，一次算完。这就是“采样计算量翻倍”的来源。', lines: [6] },
  { title: '拆开', text: <>前一半是 <Tex>{'\\epsilon_y'}</Tex>，后一半是 <Tex>{'\\epsilon_\\varnothing'}</Tex>。</>, lines: [7] },
  { title: 'CFG 组合', text: <><Tex>{'\\hat\\epsilon = \\epsilon_\\varnothing + s(\\epsilon_y - \\epsilon_\\varnothing)'}</Tex>，只作用在噪声预测上。</>, lines: [9] },
  { title: 'DDIM 更新', text: <>把 <Tex>{'\\hat\\epsilon'}</Tex> 当作普通噪声预测，代入原样的 DDIM 公式得到 <Tex>{'x_{t-1}'}</Tex>，然后进入下一个时间步。</>, lines: [13] },
]
const CODE = [
  'def cfg_step(model, x_t, t, y, s, null_label):',
  '    B = x_t.shape[0]',
  '    x_in = torch.cat([x_t, x_t], dim=0)         # 复制两份',
  '    t_in = torch.cat([t, t], dim=0)',
  '    y_in = torch.cat([y, torch.full_like(y, null_label)], dim=0)',
  '',
  '    eps = model(x_in, t_in, y_in)               # 一次前向',
  '    eps_y, eps_null = eps[:B], eps[B:]          # 拆开',
  '',
  '    return eps_null + s * (eps_y - eps_null)    # CFG 组合',
  '',
  'x = torch.randn(B, C, H, W)                     # 从纯噪声出发',
  'for t in timesteps:                             # 从大到小',
  '    x = ddim_update(x, cfg_step(model, x, t, y, s, null_label), t)',
]

export function SamplingLoopDemo() {
  const [k, setK] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const h = window.setInterval(() => setK((v) => (v + 1) % STAGES.length), 1600)
    return () => window.clearInterval(h)
  }, [playing])
  const W = 640, bw = 108, gap = (W - 5 * bw) / 4

  return (
    <Demo title="采样时每一步做什么" hint="逐步播放一个去噪步内的数据流，下方代码同步高亮。点击方框可以直接跳到那一步。" onReset={() => { setK(0); setPlaying(false) }}>
      <svg viewBox={`0 0 ${W} 124`} className="kb-chart" role="img" aria-label="单步数据流">
        {STAGES.map((s, i) => {
          const x = i * (bw + gap)
          return (
            <g key={s.title} style={{ cursor: 'pointer' }} onClick={() => { setK(i); setPlaying(false) }}>
              <rect x={x} y={20} width={bw} height={54} rx={8} className={i === k ? 'kb-flow-box is-hot' : 'kb-flow-box'} />
              <text x={x + bw / 2} y={41} textAnchor="middle" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</text>
              <text x={x + bw / 2} y={60} textAnchor="middle" style={{ fontSize: 13, fill: 'var(--ink)' }}>{s.title}</text>
              {i < STAGES.length - 1 && <line x1={x + bw + 4} x2={x + bw + gap - 4} y1={47} y2={47} className="axis" />}
            </g>
          )
        })}
        <path d={`M${W - bw / 2},76 C${W - bw / 2},112 ${bw / 2},112 ${bw / 2},76`} className="stroke-ref" />
        <SvgTex x={W / 2} y={122} w={200} align="middle" size={12} color="var(--ink-3)">下一个时间步 <Tex>{'t - 1'}</Tex></SvgTex>
      </svg>
      <p className="kb-demo-note"><b>{k + 1}. {STAGES[k].title}</b>：{STAGES[k].text}</p>
      <pre className="kb-flow-code" aria-label="对应代码">
        {CODE.map((l, i) => <span key={i} className={STAGES[k].lines.includes(i) ? 'is-hot' : undefined}>{l ? highlightPython(l) : ' '}</span>)}
      </pre>
      <div className="kb-presets">
        <button type="button" className="kb-btn-ghost" onClick={() => setK((k + STAGES.length - 1) % STAGES.length)}>上一步</button>
        <button type="button" className="kb-btn" onClick={() => setK((k + 1) % STAGES.length)}>下一步</button>
        <button type="button" className="kb-btn-ghost" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? '暂停' : '自动播放'}</button>
      </div>
    </Demo>
  )
}
