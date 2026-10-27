import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('home groups topics by area and filters by tag', async ({ page }) => {
  await page.goto('./#/')
  const basics = page.getByRole('region', { name: '机器学习基础' })
  const gen = page.getByRole('region', { name: '生成模型' })
  await expect(basics.getByRole('heading', { name: 'Softmax' })).toBeVisible()
  await expect(gen.getByRole('heading', { name: 'Classifier-Free Guidance' })).toBeVisible()
  await expect(gen.getByRole('heading', { name: /扩散模型/ })).toBeVisible()

  await expect(page.locator('.kb-filter')).not.toContainText('#')
  const chip = page.getByRole('group', { name: '按标签筛选' }).getByRole('button', { name: /注意力/ })
  await chip.click()
  await expect(page).toHaveURL(/tag=/)
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  // 卡片里和筛选条件相同的标签高亮，颜色和筛选按钮一致
  const pill = page.locator('a[href="#/t/softmax"] .kb-pill.is-active')
  await expect(pill).toHaveText('注意力')
  const bg = (l: typeof chip) => l.evaluate((e) => getComputedStyle(e).backgroundColor)
  await expect.poll(async () => (await bg(pill)) === (await bg(chip))).toBe(true)
  const title = (name: string) => page.getByRole('heading', { name, exact: true })
  await expect(title('Softmax')).toBeVisible()
  await expect(title('Latent Diffusion Model')).toBeVisible()
  await expect(title('Classifier-Free Guidance')).toHaveCount(0)
  await page.getByRole('button', { name: /清除筛选/ }).click()
  await expect(title('Classifier-Free Guidance')).toBeVisible()
})

test('topic header shows the area, tags and related topics', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const crumbs = page.getByRole('navigation', { name: '所在领域' })
  await expect(crumbs).toContainText('机器学习基础')
  await expect(crumbs).toContainText('概率输出与损失')
  await expect(page.locator('.kb-topic-head .kb-pill')).toHaveText(['分类', '注意力', '采样', '数值稳定'])
  const head = page.locator('.kb-topic-head')
  await expect(head.getByText('被这些专题用到')).toBeVisible()
  await head.getByRole('link', { name: 'Classifier-Free Guidance' }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.locator('.kb-topic-head').getByText('建议先读')).toBeVisible()
  // 点面包屑回到首页，只显示这个领域
  await page.getByRole('navigation', { name: '所在领域' }).getByRole('link', { name: '生成模型' }).click()
  await expect(page.getByRole('region', { name: '生成模型' })).toBeVisible()
  await expect(page.getByRole('region', { name: '机器学习基础' })).toHaveCount(0)
})

test('softmax page renders all math and demos without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/softmax')
  await expect(page.locator('#step-5')).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(await page.locator('.kb-demo').count()).toBe(5)
  expect(errors).toEqual([])
})

test('softmax demo: default numbers, keyboard drag and direct normalization', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const demo = page.getByRole('region', { name: '从 logits 到概率' })
  await expect(demo.locator('.kb-demo-readout')).toContainText('12.586')
  await expect(demo.locator('svg')).toContainText('7.389')
  await expect(demo.locator('svg')).toContainText('0.587')
  await expect(demo.locator('.kb-demo-readout')).toContainText('58.7%')
  const handle = demo.getByRole('slider', { name: /z1（猫）/ })
  await handle.focus()
  await page.keyboard.press('PageDown')
  await expect(handle).toHaveAttribute('aria-valuetext', '1.00')
  await expect(demo.locator('svg')).not.toContainText('0.587')
  await demo.getByRole('button', { name: '重置' }).click()
  await demo.getByRole('button', { name: /直接除以总和/ }).click()
  await expect(demo.locator('svg')).toContainText('1.33')
  await expect(demo.locator('svg')).toContainText('-0.33')
  await expect(demo.locator('.kb-demo-readout')).toContainText('不是概率分布')
})

test('temperature demo reproduces the table and sampling', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const demo = page.getByRole('region', { name: '温度 T 的影响' })
  await expect(demo.locator('.kb-demo-readout')).toContainText('58.7%')
  await expect(demo.locator('.kb-demo-readout')).toContainText('1.128')
  await demo.getByRole('button', { name: 'T = 0.5', exact: true }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('83.8%')
  await demo.getByRole('button', { name: 'T = 0.1', exact: true }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('0.001')
  await expect(demo.locator('svg').first()).toContainText('100')
})

test('jacobian demo: formula matches numeric differences', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const demo = page.getByRole('region', { name: 'softmax 的 Jacobian' })
  await expect(demo.locator('.kb-demo-note')).toContainText('0.2100')
  await demo.getByRole('button', { name: 'J 第 2 行第 1 列' }).click()
  await expect(demo.locator('.kb-demo-note')).toContainText('-0.1400')
  await expect(demo.locator('.kb-demo-readout')).toContainText('(0.700, 0.200, 0.100)')
})

test('cross-entropy demo: p - y and one gradient step', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const demo = page.getByRole('region', { name: '交叉熵的梯度' })
  const bars = demo.locator('svg').first()
  await expect(bars).toContainText('0.700')
  await expect(bars).toContainText('-0.800')
  await expect(demo.locator('.kb-demo-readout')).toContainText('1.609')
  await demo.getByRole('button', { name: '走一步' }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('0.685')
  await expect(demo.locator('.kb-demo-readout')).toContainText('(1.246, 1.493, -0.100)')
})

test('saturation demo: J vanishes, cross-entropy gradient does not when wrong', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const demo = page.getByRole('region', { name: 'softmax 饱和' })
  await expect(demo.locator('.kb-demo-readout')).toContainText('0.3880')
  await demo.getByRole('slider').fill('8')
  await expect(demo.locator('.kb-demo-readout')).toContainText('0.0007')
  await demo.getByRole('button', { name: /狐狸/ }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('1.414')
})

test('softmax sliders at extremes produce no NaN', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/softmax')
  await expect(page.locator('#step-5')).toBeAttached()
  const sliders = page.locator('.kb-demo input[type="range"]')
  const n = await sliders.count()
  expect(n).toBeGreaterThanOrEqual(5)
  for (let i = 0; i < n; i++) {
    const s = sliders.nth(i)
    for (const v of [await s.getAttribute('min'), await s.getAttribute('max')]) await s.fill(v!)
  }
  for (const d of await page.locator('.kb-demo').all()) {
    await expect(d).not.toContainText('NaN')
    await expect(d).not.toContainText('Infinity')
  }
  for (const d of await page.locator('.kb-demo').all()) await expect(d).not.toContainText(/\bnan\b/)
  expect(errors).toEqual([])
})

test('step 4 links to the derivations in the appendix, even in review mode', async ({ page }) => {
  await page.goto('./#/t/softmax')
  await page.getByRole('button', { name: '复习', exact: true }).click()
  const appendix = page.locator('#appendix')
  await expect(appendix.getByRole('heading', { name: /B. 交叉熵的梯度/ })).toBeHidden()
  await page.locator('#step-4 .kb-keypoint').getByRole('button', { name: '附录 B' }).click()
  await expect(page.locator('#ce-derivation + *')).toBeInViewport()
  await expect(appendix.getByRole('heading', { name: /B. 交叉熵的梯度/ })).toBeVisible()
})

test('cross-topic links between CFG and softmax round-trip', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const ref = page.locator('#step-1').getByRole('button', { name: 'Softmax 第 2 步' })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/softmax/)
  await expect(page.locator('#step-2')).toBeInViewport()
  await page.getByRole('button', { name: /回到《Classifier-Free Guidance》/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)

  await page.goto('./#/t/softmax')
  await page.locator('#step-2').getByRole('button', { name: 'CFG 第 1 步' }).click()
  await expect(page).toHaveURL(/#\/t\/cfg/)
  await expect(page.locator('#sharpen-goal + *')).toBeInViewport()
})

test('softmax narrow screen has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#/t/softmax')
  await expect(page.locator('#step-5')).toBeAttached()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
