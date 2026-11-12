import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'

import SearchPage from '../SearchPage.vue'
import { useSearchStore } from '../../stores/search'
import preset from '../../theme/preset'

vi.mock('../../composables/useSearchApi', () => ({
  useSearchApi: () => ({ search: vi.fn(), getSuggestions: vi.fn(), getFacetCounts: vi.fn() }),
}))

// Real store with the search action replaced by a spy, so the tests only check what the page does.
function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSearchStore()
  vi.spyOn(store, 'search').mockResolvedValue(undefined)
  const wrapper = mount(SearchPage, {
    global: { plugins: [pinia, [PrimeVue, { theme: { preset } }]] },
  })
  return { wrapper, store }
}

describe('SearchPage', () => {
  let wrapper: ReturnType<typeof mountPage>['wrapper']
  let store: ReturnType<typeof useSearchStore>

  beforeEach(() => {
    ;({ wrapper, store } = mountPage())
  })

  it('has a heading and the search, filters and results regions', () => {
    expect(wrapper.get('h1').text()).toBe('Fund search')
    expect(wrapper.find('[aria-label="Search"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Filters"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Results"]').exists()).toBe(true)
  })

  it('runs the first search when it loads', () => {
    expect(store.search).toHaveBeenCalledTimes(1)
  })

  it('shows the result count from the store', async () => {
    store.count = 42
    store.status = 'success'
    await nextTick()

    expect(wrapper.get('[aria-label="Results"]').text()).toContain('42 results')
  })

  it('shows a loading message while loading', async () => {
    store.status = 'loading'
    await nextTick()

    expect(wrapper.get('[aria-label="Results"]').text()).toContain('Loading results')
  })

  it('shows the error message when the search fails', async () => {
    store.status = 'error'
    store.error = 'Bad query'
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('Bad query')
  })

  it('retries the search from the error state', async () => {
    store.status = 'error'
    store.error = 'Bad query'
    await nextTick()

    await wrapper.get('button').trigger('click')

    expect(store.search).toHaveBeenCalledTimes(2)
  })
})
