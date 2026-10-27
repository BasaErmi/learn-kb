import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('cross-entropy page renders all math and demos without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cross-entropy')
  await expect(page.locator('#step-4')).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(await page.locator('.kb-demo').count()).toBe(3)
  await expect(page.locator('.kb-topic-head .kb-pill')).toHaveText(['分类', '信息论'])
  expect(errors).toEqual([])
})

test('entropy demo: default value, presets and keyboard drag', async ({ page }) => {
  await page.goto('./#/t/cross-entropy')
  const demo = page.getByRole('region', { name: '熵', exact: true })
  const out = demo.locator('.kb-demo-readout')
  await expect(out).toContainText('1.208')
  await demo.getByRole('button', { name: '均匀' }).click()
  await expect(out).toContainText('1.386')
  await expect(out).toContainText('100%')
  await demo.getByRole('button', { name: 'one-hot' }).click()
  await expect(out.locator('b').first()).toHaveText('0.000')
  await demo.getByRole('button', { name: '重置' }).click()
  const h = demo.getByRole('slider', { name: /P（晴）/ })
  await h.focus()
  for (let i = 0; i < 12; i++) await page.keyboard.press('PageUp')
  await expect(h).toHaveAttribute('aria-valuetext', '1.00')
  await expect(out.locator('b').first()).toHaveText('0.000')
  await expect(demo).not.toContainText('NaN')
})

test('cross-entropy demo: decomposition, swap and Q = P', async ({ page }) => {
  await page.goto('./#/t/cross-entropy')
  const demo = page.getByRole('region', { name: '交叉熵与 KL 散度' })
  const out = demo.locator('.kb-demo-readout')
  await expect(out).toContainText('1.208')
  await expect(out).toContainText('0.853')
  await expect(out).toContainText('2.061')
  await expect(out).toContainText('1.780')
  await demo.getByRole('button', { name: '交换 P 和 Q' }).click()
  await expect(out.locator('b').nth(2)).toHaveText('1.780')
  await demo.getByRole('button', { name: '令 Q 等于 P' }).click()
  await expect(out.locator('b').nth(1)).toHaveText('0.000')
  // 把 Q 的一类压到下限，交叉熵仍是有限值
  await demo.getByRole('button', { name: '重置' }).click()
  const q = demo.getByRole('slider', { name: /Q（多云）/ })
  await q.focus()
  for (let i = 0; i < 12; i++) await page.keyboard.press('PageDown')
  await expect(q).toHaveAttribute('aria-valuetext', '0.02')
  await expect(demo).not.toContainText('NaN')
  await expect(demo).not.toContainText('Infinity')
})

test('gradient demo: default numbers, slider ends and training mode', async ({ page }) => {
  await page.goto('./#/t/cross-entropy')
  const demo = page.getByRole('region', { name: 'MSE 与交叉熵的梯度' })
  const out = demo.locator('.kb-demo-readout')
  await expect(out).toContainText('0.9975')
  await expect(out).toContainText('0.0025')
  const slider = demo.getByRole('slider')
  for (const v of ['-8', '8']) {
    await slider.fill(v)
    await expect(demo).not.toContainText('NaN')
  }
  await demo.getByRole('button', { name: '梯度下降的轨迹' }).click()
  await expect(out).toContainText('17')
  await expect(out).toContainText('497')
})

test('cross-topic link to softmax opens the anchor and returns to the same spot', async ({ page }) => {
  await page.goto('./#/t/cross-entropy')
  const ref = page.locator('#step-4').getByRole('button', { name: /Softmax 第 4 步/ })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/softmax/)
  await expect(page.locator('#step-4')).toBeInViewport()
  await page.getByRole('button', { name: /回到《交叉熵》/ }).click()
  await expect(page).toHaveURL(/#\/t\/cross-entropy$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})

test('softmax step 4 links to the cross-entropy topic', async ({ page }) => {
  await page.goto('./#/t/softmax')
  const ref = page.locator('#step-4').getByRole('button', { name: /《交叉熵》第 3 步/ })
  await ref.scrollIntoViewIfNeeded()
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/cross-entropy/)
  await expect(page.locator('#step-3')).toBeInViewport()
})
