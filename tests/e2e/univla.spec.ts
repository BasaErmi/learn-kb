import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('univla page renders all steps, math and figures without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/univla')
  await expect(page.locator('#step-7')).toBeAttached()
  expect(await page.locator('.kb-step').count()).toBe(7)
  expect(await page.locator('.katex-error').count()).toBe(0)
  await expect(page.locator('.kb-topic-head .kb-pill')).toHaveText(['VLA', '模仿学习', '向量量化', '世界模型'])
  expect(await page.locator('.kb-diagram').count()).toBe(7)
  for (const id of ['cheatsheet', 'pitfalls', 'flashcards']) expect(await page.locator(`#${id}`).count()).toBe(0)
  for (const img of await page.locator('.kb-paperfig img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  }
  expect(errors).toEqual([])
})

test('figure A-1 / A-2 tabs switch images', async ({ page }) => {
  await page.goto('./#/t/univla')
  const fig = page.locator('#step-7 .kb-paperfig').filter({ has: page.getByRole('button', { name: '更多分组（图 A-1）' }) })
  await fig.scrollIntoViewIfNeeded()
  await expect(fig.locator('img')).toHaveAttribute('src', /figA1\.webp$/)
  await fig.getByRole('button', { name: '注意力热图（图 A-2）' }).click()
  await expect(fig.locator('img')).toHaveAttribute('src', /figA2\.webp$/)
})

test('cross-topic link to LAPA step 1 opens the anchor and returns', async ({ page }) => {
  await page.goto('./#/t/univla')
  const ref = page.locator('#step-1').getByRole('button', { name: /^LAPA/ })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/lapa/)
  await expect(page.locator('#step-1')).toBeInViewport()
  await page.getByRole('button', { name: /回到《UniVLA/ }).click()
  await expect(page).toHaveURL(/#\/t\/univla$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})

test('LAM figure switches between Stage 1 and Stage 2', async ({ page }) => {
  await page.goto('./#/t/univla')
  const fig = page.locator('#step-2 .kb-diagram').filter({ has: page.getByRole('button', { name: 'Stage 1：加入语言' }) })
  await fig.scrollIntoViewIfNeeded()
  await expect(fig.locator('figcaption')).toContainText('Stage 1（论文图 2 左）')
  await fig.getByRole('button', { name: 'Stage 2：加入 TC query' }).click()
  await expect(fig.locator('figcaption')).toContainText('Stage 2（论文图 2 右）')
  expect(await fig.locator('.katex-error').count()).toBe(0)
})
