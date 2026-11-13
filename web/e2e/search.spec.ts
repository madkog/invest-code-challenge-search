import { test, expect, type Page } from '@playwright/test'

// --- Finding things on the page, the way a user would where possible ---

function searchBox(page: Page) {
  return page.getByRole('combobox', { name: 'Search by ticker, name or issuer' })
}

// The text above the results, such as "12 results for “gold”".
function summary(page: Page) {
  return page.getByTestId('results-summary')
}

function resultRows(page: Page) {
  return page.getByRole('button', { name: /^Show details for/ })
}

function resultItems(page: Page) {
  return page.getByRole('list', { name: 'Search results' }).getByRole('listitem')
}

// The ETF or Share tag on each result.
function kindTags(page: Page) {
  return resultItems(page).getByTestId('kind')
}

function tickersOnPage(page: Page): Promise<string[]> {
  return resultItems(page).getByTestId('ticker').allInnerTexts()
}

// --- Actions ---

// Typed one key at a time, like a person, so the suggestions update as they would.
async function typeInSearch(page: Page, text: string) {
  await searchBox(page).click()
  await searchBox(page).pressSequentially(text, { delay: 30 })
}

// Does something that runs a search, and waits until its results are on the page.
// Waiting for the response is more reliable than watching the list, which can look right early:
// the default order happens to be alphabetical too.
async function andWaitForResults(page: Page, action: () => Promise<void>) {
  const response = page.waitForResponse(
    (res) => res.url().endsWith('/api/search') && res.request().method() === 'POST',
  )
  await action()
  await response
  await expect(summary(page)).not.toContainText('Searching')
}

function isSorted(items: string[]): boolean {
  return items.join() === [...items].sort().join()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(summary(page)).toContainText('ETFs and shares, Betashares first')
})

test.describe('results', () => {
  test('shows the first page of ETFs and shares on load', async ({ page }) => {
    await expect(resultRows(page)).toHaveCount(15)
  })

  test('filters, sorts and pages through the results', async ({ page }) => {
    await andWaitForResults(page, () =>
      page.getByRole('group', { name: 'Type' }).getByRole('button', { name: /^ETFs/ }).click(),
    )
    await expect(kindTags(page)).toHaveText(Array(15).fill('ETF'))

    await page.getByRole('combobox', { name: 'Sort by' }).click()
    await andWaitForResults(page, () => page.getByRole('option', { name: 'Ticker A to Z' }).click())
    const firstPage = await tickersOnPage(page)
    expect(isSorted(firstPage)).toBe(true)

    await andWaitForResults(page, () =>
      page.getByRole('button', { name: 'Page 2', exact: true }).click(),
    )
    const secondPage = await tickersOnPage(page)

    // Page 2 carries on where page 1 ended.
    expect(isSorted(secondPage)).toBe(true)
    expect(secondPage[0]! > firstPage.at(-1)!).toBe(true)
  })

  test('shows a friendly message when nothing matches', async ({ page }) => {
    await typeInSearch(page, 'zzqqxx')
    await searchBox(page).press('Enter')

    await expect(page.getByRole('heading', { name: 'No matches for “zzqqxx”' })).toBeVisible()
  })
})

test.describe('suggestions', () => {
  test('suggests as you type and searches on Enter', async ({ page }) => {
    await typeInSearch(page, 'gold')

    await expect(page.getByRole('option', { name: /gold in ETFs/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /Gold/ }).first()).toBeVisible()

    await searchBox(page).press('Enter')

    await expect(summary(page)).toContainText('results for “gold”')
    await expect(resultRows(page).first()).toContainText(/gold/i)
  })

  test('refines the search from a suggestion before it is run', async ({ page }) => {
    await typeInSearch(page, 'bank')

    await page.getByRole('option', { name: /bank in Shares/ }).click()

    await expect(summary(page)).toContainText('results for “bank”')
    await expect(page.getByRole('button', { name: /^Shares/, pressed: true })).toBeVisible()
    const count = await kindTags(page).count()
    expect(count).toBeGreaterThan(0)
    await expect(kindTags(page)).toHaveText(Array(count).fill('Share'))
  })

  test('opens the details of an ETF picked from the suggestions', async ({ page }) => {
    await typeInSearch(page, 'vas')

    await page
      .getByRole('option', { name: /Vanguard Australian Shares/ })
      .first()
      .click()

    await expect(page.getByRole('dialog', { name: 'VAS' })).toBeVisible()
    await expect(searchBox(page)).toHaveValue(/Vanguard/)
  })
})

test.describe('errors', () => {
  test('shows a friendly error when the API fails, and recovers on retry', async ({ page }) => {
    await page.route('**/api/search*', (route) =>
      route.fulfill({ status: 502, body: 'Bad gateway' }),
    )
    await typeInSearch(page, 'gold')
    await searchBox(page).press('Enter')

    await expect(page.getByText('We couldn’t load results.')).toBeVisible()
    await expect(page.getByText('Bad gateway')).toHaveCount(0)

    await page.unroute('**/api/search*')
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(summary(page)).toContainText('results for “gold”')
  })
})

// Runs on an emulated phone (see the mobile project in playwright.config.ts).
test.describe('on a phone', { tag: '@mobile' }, () => {
  test('closes the details with the back button', async ({ page }) => {
    await resultRows(page).first().tap()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.goBack()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(resultRows(page)).toHaveCount(15)
  })
})
