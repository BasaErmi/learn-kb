import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('home lists the LDM topic and opens it', async ({ page }) => {
  await page.goto('./#/')
  await page.getByRole('link', { name: /Latent Diffusion Model/ }).click()
  await expect(page).toHaveURL(/#\/t\/ldm$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Latent Diffusion Model' })).toBeVisible()
})

test('LDM page renders all math and demos without errors', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/ldm')
  await expect(page.locator('#step-6')).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(await page.locator('.kb-demo').count()).toBeGreaterThanOrEqual(10)
  expect(errors).toEqual([])
})

test('compression demo: f = 8, c = 4 gives 48x and updates with f and c', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /压缩计算器/ })
  const out = demo.locator('.kb-demo-readout')
  await expect(out).toContainText('48')
  await demo.getByRole('button', { name: 'c = 16' }).click()
  await expect(out.locator('b')).toHaveText('12')
  await demo.getByRole('button', { name: 'f = 16' }).click()
  await expect(out.locator('b')).toHaveText('48')
  await expect(out).toContainText('4')
})

test('scale lab: residual signal 0.068 vs 0.375 at t = T', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /缩放实验/ })
  const row = demo.locator('tbody tr').first()
  await expect(row).toContainText('0.068')
  await expect(row).toContainText('0.375')
  await demo.getByRole('button', { name: /缩放后：1/ }).click()
  await expect(row.locator('td').nth(2)).toHaveText('0.068')
})

test('forward-noise demo shows measured correlations', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /前向加噪：缩放与不缩放/ })
  await demo.getByRole('slider').fill('6')
  await expect(demo.locator('tbody tr').nth(1)).toContainText('0.064')
  await expect(demo.locator('tbody tr').nth(1)).toContainText('0.332')
})

test('1×1 conv demo: y = W h + b and parameter counts', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /卷积对比/ })
  await expect(demo).toContainText('-0.40')
  await expect(demo.locator('.kb-demo-readout')).toContainText('20')
  await demo.getByRole('button', { name: '普通 3×3' }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('180')
  await demo.getByRole('button', { name: 'depthwise 3×3' }).click()
  await expect(demo.locator('.kb-demo-readout')).toContainText('36')
})

test('patchify demo: p = 2/4/8 token counts', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /patchify/ })
  for (const [p, t] of [['2', '256'], ['4', '64'], ['8', '16']]) {
    await demo.getByRole('button', { name: `p = ${p}` }).click()
    await expect(demo.locator('.kb-demo-readout span').first()).toContainText(t)
  }
})

test('cross-attention demo loads measured maps and switches words', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/ldm')
  const demo = page.getByRole('region', { name: /cross-attention 实测图/ })
  await demo.scrollIntoViewIfNeeded()
  await expect(demo).toContainText('256×77')
  await demo.getByRole('button', { name: 'hat', exact: true }).click()
  await expect(demo.locator('canvas')).toHaveAttribute('aria-label', /hat/)
  await demo.getByRole('button', { name: '32×32 层' }).click()
  await expect(demo).toContainText('1024×77')
  await expect(demo).not.toContainText('加载中')
  expect(errors).toEqual([])
})

test('LDM sliders at extremes produce no NaN', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/ldm')
  await expect(page.locator('#step-6')).toBeAttached()
  const sliders = page.getByRole('slider')
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
  expect(errors).toEqual([])
})

test('LDM images all load', async ({ page }) => {
  await page.goto('./#/t/ldm')
  await expect(page.locator('#step-6')).toBeAttached()
  const imgs = page.locator('.kb-demo img, .kb-figure img')
  const n = await imgs.count()
  expect(n).toBeGreaterThan(20)
  for (let i = 0; i < n; i++) {
    const im = imgs.nth(i)
    await im.scrollIntoViewIfNeeded()
    await expect.poll(() => im.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  }
})

test('cross-topic link to CFG opens the anchor and returns to the same spot', async ({ page }) => {
  await page.goto('./#/t/ldm')
  const ref = page.locator('#step-5').getByRole('button', { name: 'CFG 第 4 步' })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/cfg/)
  await expect(page.locator('#step-4')).toBeInViewport()
  const back = page.getByRole('button', { name: /回到《Latent Diffusion Model》/ })
  await back.click()
  await expect(page).toHaveURL(/#\/t\/ldm$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})

test('LDM narrow screen has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#/t/ldm')
  await expect(page.locator('#step-6')).toBeAttached()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
