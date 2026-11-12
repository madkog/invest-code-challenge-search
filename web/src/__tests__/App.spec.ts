import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import { withPrimeVue } from './primeVue'

vi.mock('../composables/useSearchApi', () => ({
  useSearchApi: () => ({
    search: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getSuggestions: vi.fn().mockResolvedValue({ results: [] }),
    getFacetCounts: vi.fn().mockResolvedValue([]),
    getFlagCount: vi.fn().mockResolvedValue(0),
    getFlagshipFunds: vi.fn().mockResolvedValue({ results: [], count: 0 }),
  }),
}))

describe('App', () => {
  it('renders the search page', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), ...(withPrimeVue.plugins ?? [])] },
    })

    expect(wrapper.find('h1').text()).toBe('Find an ETF or share')
  })
})
