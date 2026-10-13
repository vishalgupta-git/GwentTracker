import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page } from '@playwright/test'

const SAMPLE = 'samples/sample-collection.json'

// Every test also fails on uncaught errors or console errors.
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })
      await use(errors)
      expect(errors).toEqual([])
    },
    { auto: true },
  ],
})

async function loadSample(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: 'Try a sample' }).click()
  await expect(page.getByText('Sample collection')).toBeVisible()
}

test('landing page shows the upload panel and FAQ', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Gwent')
  await expect(page.getByText('Drop your save file here')).toBeVisible()
  await expect(page.getByRole('heading', { name: /questions/i })).toBeVisible()
})

test('sample collection shows totals, tabs and card details', async ({ page }) => {
  await loadSample(page)
  await expect(page.getByText('/ 143')).toBeVisible()
  await expect(page.getByText('/ 119')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Missing/ })).toContainText('28')

  await page.getByRole('tab', { name: /All cards/ }).click()
  await page.getByPlaceholder(/Search/).fill('Thaler')
  await page.getByRole('button', { name: 'Thaler' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Strength')).toBeVisible()
  await expect(dialog.getByText('Spy:')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('route tab groups cards by region', async ({ page }) => {
  await loadSample(page)
  await page.getByRole('tab', { name: /Route/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Skellige' })).toBeVisible()
  await expect(page.getByText('Random merchant rewards')).toBeVisible()
})

test('uploading a collection file works and is remembered', async ({ page }) => {
  await page.goto('./')
  await page.locator('input[type=file]').setInputFiles(SAMPLE)
  await expect(page.getByText('sample-collection.json')).toBeVisible()
  await page.reload()
  await expect(page.getByText(/restored from your last visit/)).toBeVisible()
})

test('a file that is not a save gets a clear error', async ({ page }) => {
  await page.goto('./')
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.sav', mimeType: 'application/octet-stream', buffer: Buffer.from('nope') })
  await expect(page.getByText(/doesn't look like a Witcher 3 save/)).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  test(`no accessibility violations (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
    await page.goto('./')
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.getByRole('button', { name: 'Try a sample' }).click()
    for (const tab of ['Missing', 'Route', 'Missable', 'All cards']) {
      await page.getByRole('tab', { name: new RegExp(tab) }).click()
      expect((await new AxeBuilder({ page }).analyze()).violations, tab).toEqual([])
    }
  })
}
