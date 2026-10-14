import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('home lists the CFG topic and opens it', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/')
  await page.getByRole('link', { name: /Classifier-Free Guidance/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Classifier-Free Guidance' })).toBeVisible()
  expect(errors).toEqual([])
})

test('CFG page renders all math and demos without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  await expect(page.locator('#step-7')).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(await page.locator('.kb-demo').count()).toBeGreaterThanOrEqual(8)
  await page.screenshot({ path: 'test-results/cfg-full.png', fullPage: true })
  expect(errors).toEqual([])
})

test('toc keeps route', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.getByRole('navigation', { name: '目录' }).getByRole('button', { name: /guidance scale/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.locator('#step-7')).toBeInViewport()
})

test('roadmap keeps route', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.locator('.kb-roadmap').getByRole('button', { name: /训练/ }).click()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
  await expect(page.locator('#step-5')).toBeInViewport()
})

test('sharpen demo reproduces the table and survives extremes', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  const demo = page.getByRole('region', { name: /锐化/ })
  await demo.getByRole('button', { name: 's = 4', exact: true }).click()
  await expect(demo.getByText('98.8%')).toBeVisible()
  await demo.getByRole('slider').fill('10')
  await expect(demo).not.toContainText('NaN')
  expect(errors).toEqual([])
})

test('sliders at extremes produce no NaN anywhere', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  await expect(page.locator('#step-7')).toBeAttached()
  const sliders = page.getByRole('slider')
  const n = await sliders.count()
  expect(n).toBeGreaterThanOrEqual(8)
  for (let i = 0; i < n; i++) {
    const s = sliders.nth(i)
    for (const v of [await s.getAttribute('min'), await s.getAttribute('max')]) await s.fill(v!)
  }
  await expect(page.locator('.kb-demo').first()).toBeVisible()
  for (const d of await page.locator('.kb-demo').all()) {
    await expect(d).not.toContainText('NaN')
    await expect(d).not.toContainText('Infinity')
  }
  expect(errors).toEqual([])
})

test('magnet demo shows −0.595 by default', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await expect(page.getByRole('region', { name: /拉力/ }).getByText('score = -0.595')).toBeVisible()
})

test('review mode persists and hides demos', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.getByRole('button', { name: '复习', exact: true }).click()
  await expect(page.locator('.kb-demo')).toHaveCount(0)
  await expect(page.locator('.kb-keypoint').first()).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: '复习', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.kb-demo')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/cfg-review.png', fullPage: true })
})

test('flashcard mastered persists', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const card = page.locator('[data-card="s-values"]')
  await card.locator('.kb-card-face').click()
  await expect(card).toHaveClass(/is-flipped/)
  await card.getByLabel('已掌握').check()
  await page.reload()
  await expect(page.locator('[data-card="s-values"]').getByLabel('已掌握')).toBeChecked()
})

test('corrupted localStorage does not break the page', async ({ page }) => {
  await page.goto('./#/')
  await page.evaluate(() => { localStorage.setItem('kb:reviewMode', '{oops'); localStorage.setItem('kb:cfg:mastered', 'not json') })
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Classifier-Free Guidance' })).toBeVisible()
  await expect(page.getByRole('button', { name: '学习', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(errors).toEqual([])
})

test('unknown slug shows not found', async ({ page }) => {
  await page.goto('./#/t/does-not-exist')
  await expect(page.getByText('没有找到这个页面')).toBeVisible()
  await page.getByRole('link', { name: '返回知识库首页' }).click()
  await expect(page).toHaveURL(/#\/$/)
})

test('narrow screen has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#/t/cfg')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: 'test-results/cfg-mobile.png' })
})

test('wrong-shape localStorage values do not blank the page', async ({ page }) => {
  for (const bad of ['{}', 'null']) {
    await page.goto('./#/')
    await page.evaluate((v) => {
      localStorage.setItem('kb:cfg:mastered', v)
      localStorage.setItem('kb:cfg:visited', v)
      localStorage.setItem('kb:reviewMode', v)
    }, bad)
    await page.reload()
    await expect(page.getByRole('link', { name: /Classifier-Free Guidance/ })).toBeVisible()
    await page.goto('./#/t/cfg')
    await expect(page.getByRole('heading', { level: 1, name: 'Classifier-Free Guidance' })).toBeVisible()
    await expect(page.locator('[data-card="s-values"]')).toBeVisible()
  }
})

test('a failed topic chunk shows a recoverable error instead of a blank page', async ({ page }) => {
  await page.route(/assets\/cfg-.*\.js$/, (route) => route.abort())
  await page.goto('./#/t/cfg')
  await expect(page.getByText('页面出错了')).toBeVisible()
  await expect(page.getByRole('link', { name: '返回知识库首页' })).toBeVisible()
})
