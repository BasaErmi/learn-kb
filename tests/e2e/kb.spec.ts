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

test('sharpen demo keeps the s = 1 reference curve fixed', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const demo = page.getByRole('region', { name: /锐化/ })
  const ref = demo.locator('path.stroke-ref')
  const before = await ref.getAttribute('d')
  await demo.getByRole('button', { name: 's = 8', exact: true }).click()
  await expect(demo.getByRole('slider')).toHaveValue('8')
  expect(await ref.getAttribute('d')).toBe(before)
})

test('sliders at extremes produce no NaN anywhere', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/cfg')
  await expect(page.locator('#step-7')).toBeAttached()
  const sliders = page.getByRole('slider')
  const n = await sliders.count()
  expect(n).toBeGreaterThanOrEqual(7)
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

test('2D magnet demo: default numbers, drag and keyboard move x_t', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const demo = page.getByRole('region', { name: /拉力/ })
  await expect(demo.locator('tr.is-total')).toContainText('(0.953, 0.704)')
  const handle = demo.getByRole('button', { name: /xₜ 位置/ })
  await handle.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(handle).toHaveAttribute('aria-label', /\(0\.50, 0\.30\)/)
  const box = (await demo.locator('svg.kb-magnet').boundingBox())!
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.25) // 左上簇附近
  await expect(demo.locator('tbody tr').first().locator('td').nth(1)).not.toHaveText(/^0\./)
  await expect(demo).not.toContainText('NaN')
})

test('cross-reference jumps to the target and the back button returns', async ({ page }) => {
  await page.goto('./#/t/cfg')
  const ref = page.locator('#step-4').getByRole('button', { name: '第 3 步的贝叶斯公式' })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page.locator('#cg-bayes')).toBeInViewport()
  const back = page.getByRole('button', { name: /回到刚才读的位置/ })
  await expect(back).toBeVisible()
  await back.click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
  await expect(back).toHaveCount(0)
})

test('cross-reference opens a collapsed explanation in review mode', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.getByRole('button', { name: '复习', exact: true }).click()
  await expect(page.locator('#fact-2')).toBeHidden()
  // Pitfall 在复习模式下可见，它引用的“事实 2”在折叠的讲解块里
  await page.locator('#step-2').getByRole('button', { name: '事实 2' }).click()
  await expect(page.locator('#fact-2 + p')).toBeInViewport()
})

test('deep link ?at= opens the anchor (expanding a collapsed explanation) and cleans the URL', async ({ page }) => {
  await page.goto('./#/')
  await page.getByRole('button', { name: '复习', exact: true }).click()
  await page.goto('./#/t/cfg?at=fact-2')
  await expect(page.locator('#fact-2 + p')).toBeInViewport()
  await expect(page).toHaveURL(/#\/t\/cfg$/)
})

test('?y= restores the scroll position used when returning from another topic', async ({ page }) => {
  await page.goto('./#/t/cfg?y=6000')
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(6000)
  await expect(page).toHaveURL(/#\/t\/cfg$/)
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

test('toc read progress resets on each visit', async ({ page }) => {
  await page.goto('./#/t/cfg')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.locator('.kb-toc-progress')).not.toContainText('已读 0 /')
  await page.reload()
  await expect(page.locator('.kb-toc-progress')).toContainText('已读 1 /')
})

test('home shows mastered flashcard count', async ({ page }) => {
  await page.goto('./#/')
  await expect(page.locator('.kb-card-meta')).not.toContainText('已掌握')
  await page.evaluate(() => localStorage.setItem('kb:cfg:mastered', JSON.stringify(['a', 'b'])))
  await page.reload()
  await expect(page.locator('.kb-card-meta')).toContainText('已掌握 2 张闪卡')
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
