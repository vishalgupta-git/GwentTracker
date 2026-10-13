import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

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

test('the logo goes home without forgetting the save', async ({ page }) => {
  await loadSample(page)
  await page.getByRole('button', { name: 'Gwent Tracker home' }).click()
  await expect(page.getByText('Drop your save file here')).toBeVisible()
  await page.getByRole('button', { name: /Continue with/ }).click()
  await expect(page.getByText('Sample collection')).toBeVisible()

  await page.getByRole('button', { name: 'Gwent Tracker home' }).click()
  await page.getByRole('button', { name: 'Forget this save' }).click()
  await expect(page.getByRole('button', { name: /Continue with/ })).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Drop your save file here')).toBeVisible()
})

test('missables use quest progress from the save', async ({ page }) => {
  const owned = JSON.parse(readFileSync(SAMPLE, 'utf8')).gwentCards
  delete owned[1004] // High Stakes leader
  delete owned[101] // A Dangerous Game card
  delete owned[7] // Thaler's card: no rule, shows advice
  await page.addInitScript((o) => {
    const last = { fileName: 'Test.sav', owned: o, facts: ['sq306_completed'], savedAt: Date.now() }
    localStorage.setItem('gwent-tracker:last-save', JSON.stringify(last))
  }, owned)
  await page.goto('./')
  await expect(page.getByText('Plus 1 already missed in this playthrough.')).toBeVisible()
  await page.getByRole('tab', { name: /Missable/ }).click()
  await expect(page.getByText(/Missed in this playthrough: your save is past High Stakes/)).toBeVisible()
  await expect(page.getByText(/Still possible: you haven't reached The Isle of Mists/)).toBeVisible()
  await expect(page.getByText(/Play Gwent with Thaler at the Seven Cats Inn/)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
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
