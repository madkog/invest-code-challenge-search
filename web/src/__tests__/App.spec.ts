import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import type { useSearchApi } from '../composables/useSearchApi'
import { withPrimeVue } from './primeVue'

type Api = ReturnType<typeof useSearchApi>

vi.mock('../composables/useSearchApi', () => ({
  useSearchApi: () => ({
    search: vi.fn<Api['search']>().mockResolvedValue({ results: [], count: 0 }),
    getSuggestions: vi.fn<Api['getSuggestions']>().mockResolvedValue({ results: [], count: 0 }),
    getFacetCounts: vi.fn<Api['getFacetCounts']>().mockResolvedValue([]),
    getFlagCount: vi.fn<Api['getFlagCount']>().mockResolvedValue(0),
    getFlagshipFunds: vi.fn<Api['getFlagshipFunds']>().mockResolvedValue({ results: [], count: 0 }),
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
