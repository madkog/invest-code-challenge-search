import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import { withPrimeVue } from '@/__tests__/primeVue'
import SortSelect from '../../../../components/SortSelect.vue'
import ResultsToolbar from '../ResultsToolbar.vue'

const sortOptions = [
  { value: 'best', label: 'Best match' },
  { value: 'symbol-asc', label: 'Ticker A to Z' },
]

function mountToolbar(props: Partial<InstanceType<typeof ResultsToolbar>['$props']> = {}) {
  return mount(ResultsToolbar, {
    props: {
      count: 42,
      query: '',
      loading: false,
      failed: false,
      sort: 'best',
      sortOptions,
      ...props,
    },
    global: withPrimeVue,
    attachTo: document.body,
  })
}

describe('ResultsToolbar summary', () => {
  it('is a polite live region that can take focus', () => {
    const summary = mountToolbar().get('.summary')

    expect(summary.attributes('aria-live')).toBe('polite')
    expect(summary.attributes('tabindex')).toBe('-1')
  })

  it('says the number of results for the search', () => {
    expect(mountToolbar({ query: 'bank', count: 52 }).get('.summary').text()).toBe(
      '52 results for “bank”',
    )
  })

  it('uses the singular for one result', () => {
    expect(mountToolbar({ query: 'bank', count: 1 }).get('.summary').text()).toBe(
      '1 result for “bank”',
    )
  })

  it('says how many ETFs and shares there are when there is no search', () => {
    expect(mountToolbar({ count: 834 }).get('.summary').text()).toBe(
      '834 ETFs and shares, Betashares first',
    )
  })

  it('says it is searching while loading', () => {
    expect(mountToolbar({ loading: true }).get('.summary').text()).toBe('Searching…')
  })

  it('says the search did not finish after an error', () => {
    expect(mountToolbar({ failed: true }).get('.summary').text()).toBe('Search didn’t finish')
  })

  it('shows loading ahead of an error', () => {
    expect(mountToolbar({ loading: true, failed: true }).get('.summary').text()).toBe('Searching…')
  })

  it('moves focus to the summary when asked', () => {
    const wrapper = mountToolbar()

    wrapper.vm.focus()

    expect(document.activeElement).toBe(wrapper.get('.summary').element)
  })
})

describe('ResultsToolbar sort', () => {
  it('shows the chosen sort', () => {
    const wrapper = mountToolbar({ sort: 'symbol-asc' })

    expect(wrapper.getComponent(SortSelect).text()).toContain('Ticker A to Z')
  })

  it('reports a new sort', () => {
    const wrapper = mountToolbar()

    wrapper.getComponent(SortSelect).vm.$emit('update:modelValue', 'symbol-asc')

    expect(wrapper.emitted('update:sort')).toEqual([['symbol-asc']])
  })
})
