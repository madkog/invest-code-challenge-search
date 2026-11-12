import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { withPrimeVue } from '@/__tests__/primeVue'
import ActiveFilters from '../../../components/ActiveFilters.vue'
import EmptyState from '../../../components/EmptyState.vue'
import ErrorMessage from '../../../components/ErrorMessage.vue'
import ListSkeleton from '../../../components/ListSkeleton.vue'
import PaginationBar from '../../../components/PaginationBar.vue'
import { useSearchStore } from '../../../stores/search'
import type { Instrument } from '../../../types/search'
import FilterPanel from '../components/FilterPanel.vue'
import InstrumentDrawer from '../components/InstrumentDrawer.vue'
import InstrumentRow from '../components/InstrumentRow.vue'
import PopularSearches from '../components/PopularSearches.vue'
import ResultsToolbar from '../components/ResultsToolbar.vue'
import SearchBox from '../components/SearchBox/SearchBox.vue'
import SearchPage from '../SearchPage.vue'

vi.mock('../../../composables/useSearchApi', () => ({
  useSearchApi: () => ({
    search: vi.fn(),
    getSuggestions: vi.fn(),
    getFlagshipFunds: vi.fn(),
    getFacetCounts: vi.fn(),
    getFlagCount: vi.fn(),
    getInstrument: vi.fn(),
  }),
}))

const ACTIONS = [
  'search',
  'setQuery',
  'setFilter',
  'clearFilters',
  'setSort',
  'setPage',
  'setPageSize',
  'loadSuggestions',
  'clearSuggestions',
  'loadFlagshipFunds',
  'loadFacet',
  'loadFlagCount',
  'loadInstrument',
  'clearInstrument',
] as const

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
  name: 'Commonwealth Bank',
  kind: 'share',
}

enableAutoUnmount(afterEach)

// The real store with its actions replaced by spies, so the tests check only what the page does.
function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSearchStore()
  for (const action of ACTIONS) {
    vi.spyOn(store, action).mockResolvedValue(undefined)
  }
  const wrapper = mount(SearchPage, {
    global: { ...withPrimeVue, plugins: [pinia, ...(withPrimeVue.plugins ?? [])] },
    attachTo: document.body,
  })
  return { wrapper, store }
}

describe('SearchPage', () => {
  let wrapper: ReturnType<typeof mountPage>['wrapper']
  let store: ReturnType<typeof useSearchStore>

  beforeEach(() => {
    localStorage.clear()
    ;({ wrapper, store } = mountPage())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('layout', () => {
    it('has the heading, the search box, the filters and the results', () => {
      expect(wrapper.get('h1').text()).toBe('Find an ETF or share')
      expect(wrapper.findComponent(SearchBox).exists()).toBe(true)
      expect(wrapper.findComponent(FilterPanel).exists()).toBe(true)
      expect(wrapper.get('main').attributes('aria-labelledby')).toBe('results-heading')
      expect(wrapper.findComponent(ResultsToolbar).exists()).toBe(true)
    })

    it('shows the OR tip and the popular searches', () => {
      expect(wrapper.get('.hint').text()).toContain('bank OR mining')
      expect(wrapper.getComponent(PopularSearches).props('terms')).toContain('bank')
    })
  })

  describe('on load', () => {
    it('runs the first search and loads the filter options, counts and flagship funds', () => {
      expect(store.search).toHaveBeenCalledTimes(1)
      expect(store.loadFacet).toHaveBeenCalledWith('kind')
      expect(store.loadFacet).toHaveBeenCalledWith('issuer')
      expect(store.loadFlagCount).toHaveBeenCalledWith('isBetashares')
      expect(store.loadFlagCount).toHaveBeenCalledWith('isFlagshipFund')
      expect(store.loadFlagCount).toHaveBeenCalledWith('isAutoInvestIncluded')
      expect(store.loadFlagshipFunds).toHaveBeenCalledTimes(1)
    })
  })

  describe('searching', () => {
    it('asks the store for suggestions as the box asks', () => {
      wrapper.getComponent(SearchBox).vm.$emit('complete', 'vas')

      expect(store.loadSuggestions).toHaveBeenCalledWith('vas')
    })

    it('gives the search box the suggestion data from the store', async () => {
      store.suggestions = [
        { id: 'VAS:AU', symbol: 'VAS', name: VAS.name, kind: 'etf', issuer: 'vanguard' },
      ]
      store.suggestionKinds = [{ value: 'etf', count: 8 }]
      store.flagshipFunds = [
        { id: 'A200:AU', symbol: 'A200', name: 'Australia 200', kind: 'etf', issuer: 'betashares' },
      ]
      await nextTick()

      const box = wrapper.getComponent(SearchBox)
      expect(box.props('instruments')).toEqual(store.suggestions)
      expect(box.props('kinds')).toEqual([{ value: 'etf', count: 8 }])
      expect(box.props('flagshipFunds')).toEqual(store.flagshipFunds)
      expect(box.props('popular')).toContain('bank')
    })

    it('searches for the text, clears the suggestions and refreshes the filter counts', () => {
      vi.mocked(store.loadFacet).mockClear()

      wrapper.getComponent(SearchBox).vm.$emit('search', { text: 'vas' })

      expect(store.setQuery).toHaveBeenCalledWith('vas')
      expect(store.clearSuggestions).toHaveBeenCalled()
      expect(store.loadFacet).toHaveBeenCalledWith('kind')
    })

    it('shows all ETFs and shares when the search is empty', () => {
      wrapper.getComponent(SearchBox).vm.$emit('search', { text: '' })

      expect(store.setQuery).toHaveBeenCalledWith('')
    })

    it('searches only one kind when the box asks for it', () => {
      wrapper.getComponent(SearchBox).vm.$emit('search', { text: 'bank', kind: 'etf' })

      expect(store.setFilter).toHaveBeenCalledWith('kind', ['etf'])
      expect(store.setQuery).toHaveBeenCalledWith('bank')
    })

    it('does not change the kind filter for a search without a kind', () => {
      wrapper.getComponent(SearchBox).vm.$emit('search', { text: 'bank' })

      expect(store.setFilter).not.toHaveBeenCalled()
    })

    it('remembers the search, and gives it back to the box as a recent search', async () => {
      wrapper.getComponent(SearchBox).vm.$emit('search', { text: 'vanguard' })
      await nextTick()

      expect(wrapper.getComponent(SearchBox).props('recent')).toEqual(['vanguard'])
      expect(JSON.parse(localStorage.getItem('fund-search-recent')!)).toEqual(['vanguard'])
    })

    it('searches for a popular term when its chip is picked', () => {
      wrapper.getComponent(PopularSearches).vm.$emit('pick', 'gold')

      expect(store.setQuery).toHaveBeenCalledWith('gold')
    })

    it('shows the searched text in the box', async () => {
      wrapper.getComponent(PopularSearches).vm.$emit('pick', 'gold')
      await nextTick()

      expect(wrapper.get<HTMLInputElement>('input#search-input').element.value).toBe('gold')
    })
  })

  describe('filters', () => {
    it('applies a kind choice and refreshes the filter counts', () => {
      vi.mocked(store.loadFacet).mockClear()

      wrapper.getComponent(FilterPanel).vm.$emit('update:kind', ['share'])

      expect(store.setFilter).toHaveBeenCalledWith('kind', ['share'])
      expect(store.loadFacet).toHaveBeenCalledWith('issuer')
    })

    it('applies an issuer choice', () => {
      wrapper.getComponent(FilterPanel).vm.$emit('update:issuer', ['vanguard'])

      expect(store.setFilter).toHaveBeenCalledWith('issuer', ['vanguard'])
    })

    it('applies a fund feature choice', () => {
      wrapper
        .getComponent(FilterPanel)
        .vm.$emit('update:flag', { key: 'isFlagshipFund', value: true })

      expect(store.setFilter).toHaveBeenCalledWith('isFlagshipFund', true)
    })

    it('gives the filter panel the options and counts from the store', async () => {
      store.facets = { kind: [{ value: 'etf', count: 8 }] }
      store.flagCounts = { isBetashares: 22 }
      await nextTick()

      const panel = wrapper.getComponent(FilterPanel)
      expect(panel.props('kindCounts')).toEqual([{ value: 'etf', count: 8 }])
      expect(panel.props('issuerCounts')).toEqual([])
      expect(panel.props('flagCounts')).toEqual({ isBetashares: 22 })
    })
  })

  describe('active filters', () => {
    beforeEach(async () => {
      store.filters = {
        kind: ['etf'],
        issuer: ['vanguard', 'blackrock'],
        isBetashares: null,
        isFlagshipFund: true,
        isAutoInvestIncluded: null,
      }
      await nextTick()
    })

    it('shows a chip for each filter in use', () => {
      expect(wrapper.getComponent(ActiveFilters).props('chips')).toEqual([
        { key: 'kind:etf', label: 'ETFs' },
        { key: 'issuer:vanguard', label: 'Vanguard' },
        { key: 'issuer:blackrock', label: 'iShares (BlackRock)' },
        { key: 'flag:isFlagshipFund', label: 'Flagship funds' },
      ])
    })

    it('removes a kind', () => {
      wrapper.getComponent(ActiveFilters).vm.$emit('remove', 'kind:etf')

      expect(store.setFilter).toHaveBeenCalledWith('kind', [])
    })

    it('removes one issuer and keeps the others', () => {
      wrapper.getComponent(ActiveFilters).vm.$emit('remove', 'issuer:vanguard')

      expect(store.setFilter).toHaveBeenCalledWith('issuer', ['blackrock'])
    })

    it('switches a fund feature off', () => {
      wrapper.getComponent(ActiveFilters).vm.$emit('remove', 'flag:isFlagshipFund')

      expect(store.setFilter).toHaveBeenCalledWith('isFlagshipFund', null)
    })

    it('clears every filter and refreshes the counts', () => {
      vi.mocked(store.loadFacet).mockClear()

      wrapper.getComponent(ActiveFilters).vm.$emit('clear')

      expect(store.clearFilters).toHaveBeenCalled()
      expect(store.loadFacet).toHaveBeenCalledWith('kind')
    })
  })

  describe('sorting', () => {
    it('applies a sort from the toolbar', () => {
      wrapper.getComponent(ResultsToolbar).vm.$emit('update:sort', 'name-asc')

      expect(store.setSort).toHaveBeenCalledWith({ field: 'name', direction: 'asc' })
    })

    it('applies best match as no sort', () => {
      wrapper.getComponent(ResultsToolbar).vm.$emit('update:sort', 'best')

      expect(store.setSort).toHaveBeenCalledWith(null)
    })

    it('shows the sort in use and names the default by whether there is a search', async () => {
      store.sortBy = { field: 'symbol', direction: 'desc' }
      await nextTick()
      expect(wrapper.getComponent(ResultsToolbar).props('sort')).toBe('symbol-desc')

      expect(wrapper.getComponent(ResultsToolbar).props('sortOptions')[0]!.label).toBe(
        'Betashares first',
      )
      store.query = 'bank'
      await nextTick()
      expect(wrapper.getComponent(ResultsToolbar).props('sortOptions')[0]!.label).toBe('Best match')
    })
  })

  describe('sorting by shares on issue with ETFs', () => {
    it('offers the sort while shares are included', () => {
      const units = wrapper
        .getComponent(ResultsToolbar)
        .props('sortOptions')
        .find((option) => option.value === 'units-desc')!

      expect(units.disabled).toBe(false)
    })

    it('disables it, and says why, when only ETFs are shown', async () => {
      store.filters = { ...store.filters, kind: ['etf'] }
      await nextTick()

      const units = wrapper
        .getComponent(ResultsToolbar)
        .props('sortOptions')
        .find((option) => option.value === 'units-desc')!
      expect(units.disabled).toBe(true)
      expect(units.label).toBe('Most shares on issue (shares only)')
    })

    it('goes back to the default order when ETFs are chosen while sorted by shares on issue', async () => {
      store.sortBy = { field: 'unitsCirculating', direction: 'desc' }
      await nextTick()

      wrapper.getComponent(FilterPanel).vm.$emit('update:kind', ['etf'])

      expect(store.setSort).toHaveBeenCalledWith(null)
      expect(store.setFilter).toHaveBeenCalledWith('kind', ['etf'])
    })

    it('does the same when "in ETFs" is picked in the search box', async () => {
      store.sortBy = { field: 'unitsCirculating', direction: 'desc' }
      await nextTick()

      wrapper.getComponent(SearchBox).vm.$emit('search', { text: 'bank', kind: 'etf' })

      expect(store.setSort).toHaveBeenCalledWith(null)
    })

    it('keeps another sort when ETFs are chosen', async () => {
      store.sortBy = { field: 'name', direction: 'asc' }
      await nextTick()

      wrapper.getComponent(FilterPanel).vm.$emit('update:kind', ['etf'])

      expect(store.setSort).not.toHaveBeenCalled()
    })

    it('keeps the sort when shares, or all kinds, are chosen', async () => {
      store.sortBy = { field: 'unitsCirculating', direction: 'desc' }
      await nextTick()

      wrapper.getComponent(FilterPanel).vm.$emit('update:kind', ['share'])
      wrapper.getComponent(FilterPanel).vm.$emit('update:kind', [])

      expect(store.setSort).not.toHaveBeenCalled()
    })
  })

  describe('results', () => {
    it('shows a row for each result, with the search words to highlight', async () => {
      store.query = 'bank OR gold'
      store.results = [VAS, CBA]
      store.count = 2
      store.status = 'success'
      await nextTick()

      const rows = wrapper.findAllComponents(InstrumentRow)
      expect(rows).toHaveLength(2)
      expect(rows[0]!.props('instrument')).toEqual(VAS)
      expect(rows[0]!.props('terms')).toEqual(['bank', 'gold'])
    })

    it('tells the toolbar the count and the query', async () => {
      store.query = 'bank'
      store.count = 52
      store.status = 'success'
      await nextTick()

      expect(wrapper.getComponent(ResultsToolbar).text()).toContain('52 results for “bank”')
    })

    it('shows nothing in the list area before the first results', () => {
      expect(wrapper.findComponent(InstrumentRow).exists()).toBe(false)
      expect(wrapper.findComponent(EmptyState).exists()).toBe(false)
      expect(wrapper.findComponent(ErrorMessage).exists()).toBe(false)
    })
  })

  describe('loading', () => {
    it('shows the skeleton only when loading takes longer than the delay', async () => {
      vi.useFakeTimers()
      store.status = 'loading'
      await nextTick()
      expect(wrapper.findComponent(ListSkeleton).exists()).toBe(false)
      expect(wrapper.getComponent(ResultsToolbar).text()).toContain('Searching…')

      vi.advanceTimersByTime(120)
      await nextTick()

      expect(wrapper.findComponent(ListSkeleton).exists()).toBe(true)
    })

    it('keeps showing the earlier results during a quick search', async () => {
      store.results = [VAS]
      store.count = 1
      store.status = 'success'
      await nextTick()

      store.status = 'loading'
      await nextTick()

      expect(wrapper.findAllComponents(InstrumentRow)).toHaveLength(1)
    })
  })

  describe('errors', () => {
    beforeEach(async () => {
      store.status = 'error'
      store.error = 'Bad query'
      await nextTick()
    })

    it('shows a friendly error, without the message from the API', () => {
      const error = wrapper.getComponent(ErrorMessage)

      expect(error.props('title')).toBe('We couldn’t load results.')
      expect(error.props('message')).toBe('Please try again in a moment.')
      expect(error.text()).not.toContain('Bad query')
      expect(wrapper.getComponent(ResultsToolbar).text()).toContain('Search didn’t finish')
    })

    it('searches again from the Try again button, and reloads the filters', async () => {
      vi.mocked(store.loadFacet).mockClear()

      await wrapper.get('[role="alert"] button').trigger('click')

      expect(store.search).toHaveBeenCalledTimes(2)
      expect(store.loadFacet).toHaveBeenCalledWith('kind')
      expect(store.loadFacet).toHaveBeenCalledWith('issuer')
    })
  })

  describe('no results', () => {
    async function showEmpty(query: string) {
      store.query = query
      store.results = []
      store.count = 0
      store.status = 'success'
      await nextTick()
    }

    it('names the search in the empty state', async () => {
      await showEmpty('zzz')

      expect(wrapper.getComponent(EmptyState).props('title')).toBe('No matches for “zzz”')
      expect(wrapper.getComponent(EmptyState).text()).toContain('Every word has to appear')
    })

    it('does not mention filters when none are in use', async () => {
      await showEmpty('zzz')

      expect(wrapper.getComponent(EmptyState).text()).not.toContain('filters may also')
      expect(wrapper.getComponent(EmptyState).text()).not.toContain('Clear filters')
    })

    it('says the filters may be hiding results, and offers to clear them', async () => {
      store.filters = { ...store.filters, kind: ['share'] }
      await showEmpty('zzz')

      const empty = wrapper.getComponent(EmptyState)
      expect(empty.text()).toContain('Your filters may also be hiding results.')

      const clear = empty.findAll('button').find((button) => button.text() === 'Clear filters')!
      await clear.trigger('click')
      expect(store.clearFilters).toHaveBeenCalled()
    })

    it('offers popular searches to try', async () => {
      await showEmpty('zzz')

      const chips = wrapper.getComponent(EmptyState).getComponent(PopularSearches)
      expect(chips.props('terms')).toHaveLength(4)

      chips.vm.$emit('pick', 'bank')
      expect(store.setQuery).toHaveBeenCalledWith('bank')
    })

    it('does not name a search when there was none', async () => {
      await showEmpty('')

      expect(wrapper.getComponent(EmptyState).props('title')).toBe('No matches')
    })
  })

  describe('pagination', () => {
    beforeEach(async () => {
      store.results = [VAS]
      store.count = 40
      store.status = 'success'
      await nextTick()
    })

    it('gives the pagination bar the page, size and total', () => {
      const bar = wrapper.getComponent(PaginationBar)

      expect(bar.props('page')).toBe(1)
      expect(bar.props('pageSize')).toBe(15)
      expect(bar.props('total')).toBe(40)
    })

    it('goes to the page that was chosen', () => {
      wrapper.getComponent(PaginationBar).vm.$emit('change', { page: 2, pageSize: 15 })

      expect(store.setPage).toHaveBeenCalledWith(2)
      expect(store.setPageSize).not.toHaveBeenCalled()
    })

    it('changes the page size when a different size was chosen', () => {
      wrapper.getComponent(PaginationBar).vm.$emit('change', { page: 1, pageSize: 30 })

      expect(store.setPageSize).toHaveBeenCalledWith(30)
      expect(store.setPage).not.toHaveBeenCalled()
    })

    it('moves focus to the results summary after changing page', async () => {
      wrapper.getComponent(PaginationBar).vm.$emit('change', { page: 2, pageSize: 15 })
      await nextTick()

      expect(document.activeElement).toBe(wrapper.get('.summary').element)
    })
  })

  describe('details drawer', () => {
    beforeEach(async () => {
      store.results = [VAS, CBA]
      store.count = 2
      store.status = 'success'
      await nextTick()
    })

    it('starts closed', () => {
      expect(wrapper.getComponent(InstrumentDrawer).props('visible')).toBe(false)
    })

    it('opens and loads the instrument when a result row is clicked', async () => {
      wrapper.findAllComponents(InstrumentRow)[1]!.vm.$emit('select', CBA)
      await nextTick()

      expect(store.loadInstrument).toHaveBeenCalledWith('CBA:AU')
      expect(wrapper.getComponent(InstrumentDrawer).props('visible')).toBe(true)
    })

    it('searches for the instrument and opens its details when it is picked in the search box', async () => {
      store.query = 'mining'
      wrapper.getComponent(SearchBox).vm.$emit('update:modelValue', 'char')
      await nextTick()

      wrapper.getComponent(SearchBox).vm.$emit('open', { id: 'CHC:AU', name: 'Charter Hall Group' })
      await nextTick()

      expect(store.setQuery).toHaveBeenCalledWith('Charter Hall Group')
      expect(store.loadInstrument).toHaveBeenCalledWith('CHC:AU')
      expect(wrapper.getComponent(InstrumentDrawer).props('visible')).toBe(true)
      expect(wrapper.getComponent(SearchBox).props('modelValue')).toBe('Charter Hall Group')
    })

    it('clears the suggestions and remembers the pick as a recent search', async () => {
      wrapper.getComponent(SearchBox).vm.$emit('open', { id: 'CHC:AU', name: 'Charter Hall Group' })
      await nextTick()

      expect(store.clearSuggestions).toHaveBeenCalled()
      expect(wrapper.getComponent(SearchBox).props('recent')).toEqual(['Charter Hall Group'])
    })

    it('keeps what was typed when a result row is clicked instead', async () => {
      wrapper.getComponent(SearchBox).vm.$emit('update:modelValue', 'van')
      await nextTick()

      wrapper.findAllComponents(InstrumentRow)[0]!.vm.$emit('select', VAS)
      await nextTick()

      expect(wrapper.getComponent(SearchBox).props('modelValue')).toBe('van')
      expect(store.setQuery).not.toHaveBeenCalled()
    })

    it('shows what the store has loaded', async () => {
      store.instrument = VAS
      store.instrumentStatus = 'success'
      await nextTick()

      const drawer = wrapper.getComponent(InstrumentDrawer)
      expect(drawer.props('instrument')).toEqual(VAS)
      expect(drawer.props('state')).toBe('success')
    })

    it('loads the same instrument again when the drawer asks to retry', async () => {
      wrapper.findAllComponents(InstrumentRow)[1]!.vm.$emit('select', CBA)
      await nextTick()
      vi.mocked(store.loadInstrument).mockClear()

      wrapper.getComponent(InstrumentDrawer).vm.$emit('retry')

      expect(store.loadInstrument).toHaveBeenCalledWith('CBA:AU')
    })

    it('closes and clears the instrument when the drawer is closed', async () => {
      wrapper.getComponent(SearchBox).vm.$emit('open', { id: 'VAS:AU', name: VAS.name })
      await nextTick()

      wrapper.getComponent(InstrumentDrawer).vm.$emit('update:visible', false)
      await nextTick()

      expect(store.clearInstrument).toHaveBeenCalled()
      expect(wrapper.getComponent(InstrumentDrawer).props('visible')).toBe(false)
    })
  })
})
