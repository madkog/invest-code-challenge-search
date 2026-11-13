import { afterEach, describe, it, expect } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import Drawer from 'primevue/drawer'

import { withPrimeVue } from '@/__tests__/primeVue'
import type { Instrument } from '../../../../types/search'
import InstrumentDrawer from '../InstrumentDrawer.vue'

enableAutoUnmount(afterEach)

const A200: Instrument = {
  id: 'A200:AU',
  symbol: 'A200',
  name: 'Betashares Australia 200 ETF',
  kind: 'etf',
  currency: 'AUD',
  logoUrl: null,
  issuer: 'betashares',
  isBetashares: true,
  isFlagshipFund: true,
  isPortfolioExcluded: false,
  isAutoInvestIncluded: true,
  unitsCirculating: null,
}

const CBA: Instrument = {
  ...A200,
  id: 'CBA:AU',
  symbol: 'CBA',
  name: 'Commonwealth Bank of Australia',
  kind: 'share',
  issuer: null,
  isBetashares: false,
  isFlagshipFund: false,
  isPortfolioExcluded: true,
  isAutoInvestIncluded: false,
  unitsCirculating: 1_673_000_000,
}

// The drawer draws itself outside the component a moment after mounting, so wait for that.
async function mountDrawer(props: Partial<InstanceType<typeof InstrumentDrawer>['$props']> = {}) {
  const wrapper = mount(InstrumentDrawer, {
    props: { visible: true, instrument: A200, state: 'success', ...props },
    global: withPrimeVue,
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

// The drawer is drawn outside the component, so its content is found in the page.
function shown(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

// The value shown next to a label in the details list, for example detail('Type') is 'ETF'.
function detail(label: string): string | undefined {
  const term = [...document.body.querySelectorAll('dt')].find((item) => item.textContent === label)
  return term?.nextElementSibling?.textContent?.trim()
}

describe('InstrumentDrawer', () => {
  it('shows nothing while closed', async () => {
    await mountDrawer({ visible: false })

    expect(shown()).not.toContain('Betashares Australia 200 ETF')
  })

  it('shows the ticker as the heading, then the name and id', async () => {
    await mountDrawer()

    expect(document.body.querySelector('.p-drawer-title')?.textContent).toBe('A200')
    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('A200')
    expect(shown()).toContain('Betashares Australia 200 ETF')
    expect(shown()).toContain('A200:AU')
  })

  describe('details', () => {
    it('describes an ETF', async () => {
      await mountDrawer()

      expect(detail('Type')).toBe('ETF')
      expect(detail('Issuer')).toBe('Betashares')
      expect(detail('Ticker')).toBe('A200')
      expect(detail('Currency')).toBe('AUD')
      expect(detail('Betashares fund')).toBe('Yes')
      expect(detail('Flagship fund')).toBe('Yes')
      expect(detail('Auto Invest')).toBe('Included')
      expect(detail('Portfolios')).toBe('Allowed')
      expect(detail('Shares on issue')).toBe('Not reported')
    })

    it('describes a share', async () => {
      await mountDrawer({ instrument: CBA })

      expect(detail('Type')).toBe('Share')
      expect(detail('Issuer')).toBe('Not listed')
      expect(detail('Betashares fund')).toBe('No')
      expect(detail('Flagship fund')).toBe('No')
      expect(detail('Auto Invest')).toBe('Not included')
      expect(detail('Portfolios')).toBe('Excluded')
      expect(detail('Shares on issue')).toBe('1.67bn')
    })
  })

  describe('states', () => {
    it('shows placeholders while loading', async () => {
      await mountDrawer({ instrument: null, state: 'loading' })

      const loading = document.body.querySelector('[aria-busy="true"]')
      expect(loading?.getAttribute('aria-label')).toBe('Loading details')
      expect(document.body.querySelector('.p-drawer-title')?.textContent).toBe('Details')
    })

    it('says when the ETF or share could not be found', async () => {
      await mountDrawer({ instrument: null, state: 'not-found' })

      expect(shown()).toContain('We couldn’t find that ETF or share.')
    })

    it('says when loading failed, with a button to try again', async () => {
      const wrapper = await mountDrawer({ instrument: null, state: 'error' })
      const alert = document.body.querySelector('[role="alert"]')

      expect(alert?.textContent).toContain('We couldn’t load the details.')
      alert?.querySelector('button')?.click()

      expect(wrapper.emitted('retry')).toEqual([[]])
    })

    it('does not use the word instrument on screen', async () => {
      await mountDrawer({ instrument: null, state: 'not-found' })

      expect(shown().toLowerCase()).not.toContain('instrument')
    })
  })

  describe('closing', () => {
    it('reports when the drawer is closed', async () => {
      const wrapper = await mountDrawer()

      wrapper.getComponent(Drawer).vm.$emit('update:visible', false)

      expect(wrapper.emitted('update:visible')).toEqual([[false]])
    })
  })
})
