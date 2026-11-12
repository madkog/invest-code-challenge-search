import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from '../App.vue'
import preset from '../theme/preset'

vi.mock('../composables/useSearchApi', () => ({
  useSearchApi: () => ({
    search: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    getSuggestions: vi.fn().mockResolvedValue({ results: [] }),
    getFacetCounts: vi.fn().mockResolvedValue([]),
  }),
}))

describe('App', () => {
  it('renders the search page', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), [PrimeVue, { theme: { preset } }]] },
    })

    expect(wrapper.find('h1').text()).toBe('Fund search')
  })
})
