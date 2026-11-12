import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import { withPrimeVue } from '@/__tests__/primeVue'
import type { Instrument } from '../../../../types/search'
import InstrumentRow from '../InstrumentRow.vue'

const VAS: Instrument = {
  id: 'VAS:AU',
  symbol: 'VAS',
  name: 'Vanguard Australian Shares Index ETF',
  kind: 'etf',
  currency: 'AUD',
  logoUrl: null,
  issuer: 'vanguard',
  isBetashares: false,
  isFlagshipFund: false,
  isPortfolioExcluded: false,
  isAutoInvestIncluded: false,
  unitsCirculating: null,
}

const CBA: Instrument = {
  ...VAS,
  id: 'CBA:AU',
  symbol: 'CBA',
  name: 'Commonwealth Bank of Australia',
  kind: 'share',
  issuer: null,
  unitsCirculating: 1_673_000_000,
}

function mountRow(instrument: Instrument, terms: string[] = []) {
  return mount(InstrumentRow, { props: { instrument, terms }, global: withPrimeVue })
}

describe('InstrumentRow', () => {
  it('shows the ticker and the name', () => {
    const wrapper = mountRow(VAS)

    expect(wrapper.get('.ticker').text()).toBe('VAS')
    expect(wrapper.get('.name').text()).toBe('Vanguard Australian Shares Index ETF')
  })

  it('shows the kind and the issuer name for an ETF', () => {
    const sub = mountRow(VAS).get('.sub').text()

    expect(sub).toContain('ETF')
    expect(sub).toContain('Vanguard')
  })

  it('shows Share for a share, and no issuer when it has none', () => {
    const sub = mountRow(CBA).get('.sub').text()

    expect(sub).toContain('Share')
    expect(sub).not.toContain('ETF')
  })

  it('shows Flagship and Auto Invest tags only when they apply', () => {
    expect(mountRow(VAS).get('.sub').text()).not.toMatch(/Flagship|Auto Invest/)

    const both = mountRow({ ...VAS, isFlagshipFund: true, isAutoInvestIncluded: true })
    expect(both.get('.sub').text()).toContain('Flagship')
    expect(both.get('.sub').text()).toContain('Auto Invest')
  })

  it('shows the shares on issue for a share', () => {
    const right = mountRow(CBA).get('.right').text()

    expect(right).toContain('Shares on issue')
    expect(right).toContain('1.67bn')
  })

  it('shows the currency and id for an ETF', () => {
    const right = mountRow(VAS).get('.right').text()

    expect(right).toContain('AUD')
    expect(right).toContain('VAS:AU')
  })

  it('highlights the search words in the ticker, name and issuer', () => {
    const wrapper = mountRow(VAS, ['vas', 'australian', 'vanguard'])

    const marked = wrapper.findAll('mark').map((mark) => mark.text().toLowerCase())
    expect(marked).toContain('vas')
    expect(marked).toContain('australian')
    expect(marked).toContain('vanguard')
  })

  it('highlights nothing when there is no search', () => {
    expect(mountRow(VAS).find('mark').exists()).toBe(false)
  })

  it('shows the logo when there is one, and the ticker letters when there is not', () => {
    const withLogo = mountRow({ ...VAS, logoUrl: 'vas.png' })
    expect(withLogo.get('img').attributes('src')).toBe('vas.png')

    const without = mountRow(VAS)
    expect(without.find('img').exists()).toBe(false)
    expect(without.text()).toContain('VA')
  })
})
