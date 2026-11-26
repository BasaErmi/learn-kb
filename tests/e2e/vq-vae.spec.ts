import { expect, test, type Page } from '@playwright/test'

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('vq-vae page renders steps, figures, demos and review sections', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/t/vq-vae')
  await expect(page.locator('#step-7')).toBeAttached()
  expect(await page.locator('.kb-step').count()).toBe(7)
  expect(await page.locator('.kb-diagram').count()).toBe(8)
  expect(await page.locator('.kb-demo').count()).toBe(4)
  for (const id of ['cheatsheet', 'pitfalls', 'flashcards']) await expect(page.locator(`#${id}`)).toBeAttached()
  expect(await page.locator('.katex-error').count()).toBe(0)
  expect(errors).toEqual([])
})

test('quantize demo picks e5 by default and moves with the keyboard', async ({ page }) => {
  await page.goto('./#/t/vq-vae')
  const demo = page.getByRole('region', { name: '最近邻量化' })
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('tr.is-hit')).toContainText('e5')
  const handle = demo.getByRole('button', { name: /z_e 位置/ })
  await handle.focus()
  for (let i = 0; i < 12; i++) await handle.press('ArrowUp')
  await expect(demo.locator('tr.is-hit')).toContainText('e2')
})

test('STE demo: the chain rule stays at 0.8, STE walks 0.8 → 1.3 → 1.8 and stops', async ({ page }) => {
  await page.goto('./#/t/vq-vae')
  const demo = page.getByRole('region', { name: 'STE 一维例子' })
  await demo.scrollIntoViewIfNeeded()
  const step = demo.getByRole('button', { name: '走一步' })
  const trueZ = demo.locator('b[data-lane="true"]'), steZ = demo.locator('b[data-lane="ste"]')
  await step.click()
  await expect(trueZ).toHaveText('0.80')
  await expect(steZ).toHaveText('1.30')
  await step.click()
  await expect(trueZ).toHaveText('0.80')
  await expect(steZ).toHaveText('1.80')
  await expect(demo.getByRole('button', { name: 'STE 已停下' })).toBeDisabled()
  expect(await demo.locator('.katex-error').count()).toBe(0)
})

test('noise demo: STE gap shrinks with a finer codebook', async ({ page }) => {
  await page.goto('./#/t/vq-vae')
  const demo = page.getByRole('region', { name: '量化误差当噪声' })
  await demo.scrollIntoViewIfNeeded()
  const avg = demo.locator('tbody td').last()
  await expect(avg).toHaveText('0.667')
  await demo.getByRole('button', { name: '码字间距 0.25' }).click()
  await expect(avg).toHaveText('0.179')
  expect(await demo.locator('.katex-error').count()).toBe(0)
})

test('pull demo leaves the far codeword dead and z_e does not collapse', async ({ page }) => {
  await page.goto('./#/t/vq-vae')
  const demo = page.getByRole('region', { name: '码本损失与 commitment' })
  await demo.scrollIntoViewIfNeeded()
  for (let i = 0; i < 3; i++) await demo.getByRole('button', { name: '走 10 步' }).click()
  await expect(demo.locator('tbody tr').nth(3).locator('td').nth(1)).toHaveText('0')
  await expect(demo.getByText('第 30 步')).toBeVisible()
  const err = Number((await demo.locator('.kb-demo-readout b').nth(1).textContent()) ?? '0')
  expect(err).toBeGreaterThan(0.1)
})

test('cross-topic link to LDM VQ-reg opens the anchor and returns', async ({ page }) => {
  await page.goto('./#/t/vq-vae')
  const ref = page.locator('#step-7').getByRole('button', { name: /LDM 的 VQ-reg/ })
  await ref.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await ref.click()
  await expect(page).toHaveURL(/#\/t\/ldm/)
  await expect(page.locator('#vq-reg')).toBeInViewport()
  await page.getByRole('button', { name: /回到《VQ-VAE/ }).click()
  await expect(page).toHaveURL(/#\/t\/vq-vae$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before + 5)
})
