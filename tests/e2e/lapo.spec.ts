import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('lapo page renders all steps, math and figures without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/lapo')
  await expect(page.locator('#step-7')).toBeAttached()
  expect(await page.locator('.kb-step').count()).toBe(7)
  expect(await page.locator('.katex-error').count()).toBe(0)
  await expect(page.locator('.kb-topic-head .kb-pill')).toHaveText(['模仿学习', '强化学习', '向量量化', '世界模型'])
  // 7 张架构图 + 论文图 1、2、5 + 两组切换图 + UMAP 对照
  expect(await page.locator('.kb-diagram').count()).toBe(7)
  expect(await page.locator('.kb-paperfig').count()).toBe(6)
  // 没有复习区
  for (const id of ['cheatsheet', 'pitfalls', 'flashcards']) expect(await page.locator(`#${id}`).count()).toBe(0)
  // 论文图都能加载出来
  for (const img of await page.locator('.kb-paperfig img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  }
  expect(errors).toEqual([])
})

test('paper figure tabs switch between the average and per-game plots', async ({ page }) => {
  await page.goto('./#/t/lapo')
  const fig = page.locator('#step-6 .kb-paperfig').first()
  await fig.scrollIntoViewIfNeeded()
  await expect(fig.locator('img')).toHaveAttribute('src', /fig3-avg\.webp$/)
  await fig.getByRole('button', { name: '逐个游戏' }).click()
  await expect(fig.locator('img')).toHaveAttribute('src', /fig3-games\.webp$/)
  await expect(fig.locator('figcaption')).toContainText('论文图 3 左')
})

test('umap comparison shows the same game with and without VQ', async ({ page }) => {
  await page.goto('./#/t/lapo')
  const fig = page.locator('.kb-umap')
  await fig.scrollIntoViewIfNeeded()
  const imgs = fig.locator('.kb-strip img')
  await expect(imgs.nth(0)).toHaveAttribute('src', /umap-vq-bigfish\.webp$/)
  await expect(imgs.nth(1)).toHaveAttribute('src', /umap-novq-bigfish\.webp$/)
  await expect(fig.locator('figcaption')).toContainText('约 4 簇')
  await fig.getByRole('button', { name: 'coinrun' }).click()
  await expect(imgs.nth(0)).toHaveAttribute('src', /umap-vq-coinrun\.webp$/)
  await expect(imgs.nth(1)).toHaveAttribute('src', /umap-novq-coinrun\.webp$/)
  await expect(fig.locator('figcaption')).toContainText('碎片化')
  expect(await fig.getByRole('button', { pressed: true }).count()).toBe(1)
})

test('cross-topic link to the LDM VQ paragraph opens the anchor and returns', async ({ page }) => {
  await page.goto('./#/t/lapo')
  const ref = page.locator('#step-5').getByRole('button', { name: /LDM 的 VQ 版本/ })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/ldm/)
  await expect(page.locator('#vq-reg')).toBeInViewport()
  await page.getByRole('button', { name: /回到《LAPO/ }).click()
  await expect(page).toHaveURL(/#\/t\/lapo$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})
