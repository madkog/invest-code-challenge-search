<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'

import ActiveFilters from '../../components/ActiveFilters.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorMessage from '../../components/ErrorMessage.vue'
import ListSkeleton from '../../components/ListSkeleton.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import ResultsList from '../../components/ResultsList.vue'
import ThemeToggle from '../../components/ThemeToggle.vue'
import { useCloseOnBack } from '../../composables/useCloseOnBack'
import { useColourScheme } from '../../composables/useColourScheme'
import { useDelayedFlag } from '../../composables/useDelayedFlag'
import { useRecentSearches } from './composables/useRecentSearches'
import { SEARCH_STATUS, useSearchStore } from '../../stores/search'
import type { FlagKey, Instrument, Kind } from '../../types/search'
import type { FilterChip } from '../../types/ui'
import { searchTerms } from '../../utils/text'
import FilterPanel from './components/FilterPanel.vue'
import InstrumentDrawer from './components/InstrumentDrawer.vue'
import InstrumentRow from './components/InstrumentRow.vue'
import PopularSearches from './components/PopularSearches.vue'
import ResultsToolbar from './components/ResultsToolbar.vue'
import SearchBox from './components/SearchBox/SearchBox.vue'
import { FLAG_FILTERS, LOADING_DELAY_MS, POPULAR_SEARCHES } from './config'
import { issuerName, kindPluralLabel } from './utils/format'
import { buildSortOptions, sortFromId, sortToId, type SortId } from './utils/sortOptions'

const store = useSearchStore()
const {
  query,
  filters,
  sortBy,
  page,
  pageSize,
  results,
  count,
  status,
  suggestions,
  suggestionKinds,
  flagshipFunds,
  facets,
  flagCounts,
  instrument,
  instrumentStatus,
  isEmpty,
} = storeToRefs(store)

const { searches: recentSearches, add: addRecentSearch } = useRecentSearches()
const { scheme, toggle: toggleScheme } = useColourScheme()
const toolbar = useTemplateRef<InstanceType<typeof ResultsToolbar>>('toolbar')

// What is typed in the box. The search only changes when it is submitted or a suggestion is picked.
const draft = ref(query.value)
const drawerOpen = ref(false)
// The ETF or share shown in the drawer, so its details can be loaded again after a failure.
const openedId = ref<string | null>(null)

const isLoading = computed(() => status.value === SEARCH_STATUS.LOADING)
const hasError = computed(() => status.value === SEARCH_STATUS.ERROR)
const showSkeleton = useDelayedFlag(() => isLoading.value, LOADING_DELAY_MS)

const terms = computed(() => searchTerms(query.value))
// Only shares have shares on issue, so with ETFs only that sort has nothing to sort by.
const etfsOnly = computed(() => filters.value.kind.length === 1 && filters.value.kind[0] === 'etf')
const sortOptions = computed(() => buildSortOptions(Boolean(query.value), etfsOnly.value))
const sortId = computed(() => sortToId(sortBy.value))

const chips = computed<FilterChip[]>(() => [
  ...filters.value.kind.map((kind) => ({ key: `kind:${kind}`, label: kindPluralLabel(kind) })),
  ...filters.value.issuer.map((issuer) => ({ key: `issuer:${issuer}`, label: issuerName(issuer) })),
  ...FLAG_FILTERS.filter((flag) => filters.value[flag.key] === true).map((flag) => ({
    key: `flag:${flag.key}`,
    label: flag.label,
  })),
])

const emptyTitle = computed(() => (query.value ? `No matches for “${query.value}”` : 'No matches'))

function resultKey(instrument: Instrument): string {
  return instrument.id
}

// The filter options and counts depend on the text and filters, so they reload when those change.
function refreshFacets() {
  store.loadFacet('kind')
  store.loadFacet('issuer')
  for (const flag of FLAG_FILTERS) store.loadFlagCount(flag.key)
}

function updateSearch(change: () => void) {
  change()
  refreshFacets()
}

// Choosing ETFs only while sorted by shares on issue goes back to the default order, because ETFs
// have none.
function setKindFilter(kinds: Kind[]) {
  const onlyEtfs = kinds.length === 1 && kinds[0] === 'etf'
  if (onlyEtfs && sortId.value === 'units-desc') store.setSort(null)
  store.setFilter('kind', kinds)
}

function runSearch(text: string, kind?: Kind) {
  draft.value = text
  addRecentSearch(text)
  store.clearSuggestions()
  updateSearch(() => {
    if (kind) setKindFilter([kind])
    store.setQuery(text)
  })
}

function openInstrument(id: string) {
  openedId.value = id
  drawerOpen.value = true
  store.loadInstrument(id)
}

function retryInstrument() {
  if (openedId.value) store.loadInstrument(openedId.value)
}

// Picking an ETF or share in the search box searches for it, so the box and the results show the
// one that was picked, and opens its details.
function openInstrumentFromSearch(picked: { id: string; name: string }) {
  runSearch(picked.name)
  openInstrument(picked.id)
}

function onDrawerVisible(visible: boolean) {
  drawerOpen.value = visible
  if (!visible) store.clearInstrument()
}

// On a phone the drawer covers the page, so the back button or swipe closes it instead of leaving.
useCloseOnBack(drawerOpen, () => onDrawerVisible(false))

function onKind(kinds: Kind[]) {
  updateSearch(() => setKindFilter(kinds))
}

function onIssuer(issuers: string[]) {
  updateSearch(() => store.setFilter('issuer', issuers))
}

function onFlag(change: { key: FlagKey; value: boolean | null }) {
  updateSearch(() => store.setFilter(change.key, change.value))
}

function onRemoveChip(key: string) {
  const [type, value] = key.split(':') as [string, string]
  if (type === 'kind') onKind(filters.value.kind.filter((kind) => kind !== value))
  if (type === 'issuer') onIssuer(filters.value.issuer.filter((issuer) => issuer !== value))
  if (type === 'flag') onFlag({ key: value as FlagKey, value: null })
}

// A failed search may have left the filters empty too, so they are reloaded as well.
function retrySearch() {
  store.search()
  refreshFacets()
}

function clearFilters() {
  updateSearch(() => store.clearFilters())
}

function onSort(id: string) {
  store.setSort(sortFromId(id as SortId))
}

async function onPageChange(change: { page: number; pageSize: number }) {
  if (change.pageSize !== pageSize.value) store.setPageSize(change.pageSize)
  else store.setPage(change.page)
  await nextTick()
  toolbar.value?.focus()
}

onMounted(() => {
  store.search()
  refreshFacets()
  store.loadFlagshipFunds()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <span class="eyebrow">Search</span>
      <div class="title">
        <h1>Find an ETF or share</h1>
        <ThemeToggle :dark="scheme === 'dark'" @toggle="toggleScheme" />
      </div>

      <SearchBox
        v-model="draft"
        :instruments="suggestions"
        :kinds="suggestionKinds"
        :flagship-funds="flagshipFunds"
        :recent="recentSearches"
        :popular="POPULAR_SEARCHES"
        label="Search by ticker, name or issuer"
        placeholder="Ticker, fund name or issuer, e.g. A200, bank, vanguard"
        @complete="store.loadSuggestions($event)"
        @search="runSearch($event.text, $event.kind)"
        @open="openInstrumentFromSearch"
      />
      <div class="hint">
        Tip: use <code>OR</code> to search for either term, like <code>bank OR mining</code>.
      </div>
      <PopularSearches :terms="POPULAR_SEARCHES" @pick="runSearch($event)" />
    </header>

    <div class="layout">
      <FilterPanel
        :filters="filters"
        :kind-counts="facets.kind ?? []"
        :issuer-counts="facets.issuer ?? []"
        :flag-counts="flagCounts"
        @update:kind="onKind"
        @update:issuer="onIssuer"
        @update:flag="onFlag"
      />

      <main aria-labelledby="results-heading">
        <h2 id="results-heading" class="sr-only">Results</h2>
        <ResultsToolbar
          ref="toolbar"
          :count="count"
          :query="query"
          :loading="isLoading"
          :failed="hasError"
          :sort="sortId"
          :sort-options="sortOptions"
          @update:sort="onSort"
        />
        <ActiveFilters class="active" :chips="chips" @remove="onRemoveChip" @clear="clearFilters" />

        <ErrorMessage
          v-if="hasError"
          title="We couldn’t load results."
          message="Please try again in a moment."
          @retry="retrySearch"
        />
        <ListSkeleton v-else-if="showSkeleton" />
        <EmptyState v-else-if="isEmpty" :title="emptyTitle">
          Every word has to appear in the same place, like the name or the ticker. Try fewer words,
          a ticker code, or <code>OR</code> between terms.<template v-if="chips.length">
            Your filters may also be hiding results.</template
          >
          <template #actions>
            <Button v-if="chips.length" label="Clear filters" size="small" @click="clearFilters" />
            <PopularSearches
              :terms="POPULAR_SEARCHES.slice(0, 4)"
              label=""
              @pick="runSearch($event)"
            />
          </template>
        </EmptyState>
        <template v-else-if="results.length">
          <ResultsList :items="results" :item-key="resultKey" label="Search results">
            <template #item="{ item }">
              <InstrumentRow
                :instrument="item"
                :terms="terms"
                @select="openInstrument($event.id)"
              />
            </template>
          </ResultsList>
          <PaginationBar :page="page" :page-size="pageSize" :total="count" @change="onPageChange" />
        </template>
      </main>
    </div>

    <InstrumentDrawer
      :visible="drawerOpen"
      :instrument="instrument"
      :state="instrumentStatus"
      @update:visible="onDrawerVisible"
      @retry="retryInstrument"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 1140px;
  padding: 24px 16px 64px;
  margin: 0 auto;
}

.hero {
  display: grid;
  /* minmax(0, 1fr) lets wide content, such as the scrolling pills, shrink to the page width. */
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 26px;
}

.title {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.hero h1 {
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hint {
  font-size: 13px;
  color: var(--p-text-muted-color);
}

.hint code {
  padding: 1px 5px;
  font: 500 13px var(--f-mono);
  color: var(--p-text-color);
  background: var(--p-surface-100);
  border-radius: 4px;
}

.app-dark .hint code {
  background: var(--p-surface-800);
}

.layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

@media (max-width: 840px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.layout > * {
  min-width: 0;
}

.active {
  margin-bottom: 12px;
}
</style>
