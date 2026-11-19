import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('lapa page renders all steps, math and figures without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/lapa')
  await expect(page.locator('#step-5')).toBeAttached()
  expect(await page.locator('.kb-step').count()).toBe(5)
  expect(await page.locator('.katex-error').count()).toBe(0)
  await expect(page.locator('.kb-topic-head .kb-pill')).toHaveText(['VLA', '模仿学习', '向量量化', '世界模型'])
  expect(await page.locator('.kb-diagram').count()).toBe(6)
  for (const id of ['cheatsheet', 'pitfalls', 'flashcards']) expect(await page.locator(`#${id}`).count()).toBe(0)
  for (const img of await page.locator('.kb-paperfig img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  }
  expect(errors).toEqual([])
})

test('figure 12 / 13 tabs switch images', async ({ page }) => {
  await page.goto('./#/t/lapa')
  const fig = page.locator('#step-5 .kb-paperfig').filter({ has: page.getByRole('button', { name: '码字解码（图 12）' }) })
  await fig.scrollIntoViewIfNeeded()
  await expect(fig.locator('img')).toHaveAttribute('src', /fig12\.webp$/)
  await fig.getByRole('button', { name: '与真实动作对应（图 13）' }).click()
  await expect(fig.locator('img')).toHaveAttribute('src', /fig13\.webp$/)
})

test('cross-topic link to the LAPO pipeline opens the anchor and returns', async ({ page }) => {
  await page.goto('./#/t/lapa')
  const ref = page.locator('#step-3').getByRole('button', { name: /LAPO 的做法/ })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/lapo/)
  await expect(page.locator('#step-5')).toBeInViewport()
  await page.getByRole('button', { name: /回到《LAPA/ }).click()
  await expect(page).toHaveURL(/#\/t\/lapa$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})
