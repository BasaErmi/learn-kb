import { useReviewMode } from '@/kb/state/ReviewMode'
import { Tex, TexText } from '@/kb/components/Tex'

const SCALES = [1, 1.5, 4, 10]
const ROWS = [
  { seed: 0, note: '两条狗粘连' },
  { seed: 3, note: '运动模糊' },
  { seed: 6, note: '水中场景消失' },
  { seed: 4, note: '过饱和' },
]

/** 同种子、只改 s 的 DiT-XL/2 采样网格 */
export function ScaleGrid() {
  const { review } = useReviewMode()
  if (review) return null
  const base = import.meta.env.BASE_URL + 'images/cfg/dit-scale/'
  return (
    <figure className="kb-figure kb-wide kb-scalegrid">
      <div className="kb-scalegrid-table" style={{ gridTemplateColumns: `auto repeat(${SCALES.length}, 1fr)` }}>
        <span />
        {SCALES.map((s) => (
          <span key={s} className="kb-scalegrid-head"><Tex>{`s = ${s}`}</Tex></span>
        ))}
        {ROWS.map(({ seed, note }) => (
          <div key={seed} className="kb-scalegrid-row">
            <span className="kb-scalegrid-label">种子 {seed}<small>{note}</small></span>
            {SCALES.map((s) => (
              <img key={s} src={`${base}seed${seed}_s${s}.jpg`} alt={`种子 ${seed}，s = ${s} 的生成结果`} loading="lazy" />
            ))}
          </div>
        ))}
      </div>
      <figcaption>
        <TexText>
          {'DiT-XL/2（ImageNet 256，官方预训练权重）生成类别 207「金毛」：每行固定同一个随机种子，也就是同一份初始噪声，只改 $s$；DDIM 50 步，无随机项。' +
            '$s = 1$ 时不少样本结构崩坏、模糊；$s = 1.5$（FID 最优）单张看只是略有改善，它的优势在分布层面；$s = 4$（论文展示图所用）单张清晰典型，但第三行原本站在水里的狗变成了草地上趴着的标准照，非典型构图被压掉；$s = 10$ 颜色过饱和、对比度过高。'}
        </TexText>
      </figcaption>
    </figure>
  )
}
