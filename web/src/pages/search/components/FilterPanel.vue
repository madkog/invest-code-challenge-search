<script setup lang="ts">
import { computed } from 'vue'

import CheckboxFilter from '../../../components/CheckboxFilter.vue'
import FilterGroup from '../../../components/FilterGroup.vue'
import MultiSelectFilter from '../../../components/MultiSelectFilter.vue'
import SegmentedFilter from '../../../components/SegmentedFilter.vue'
import type { FacetCount, Filters, FlagKey, Kind } from '../../../types/search'
import type { Option } from '../../../types/ui'
import { FLAG_FILTERS } from '../config'
import { issuerName } from '../utils/format'

const props = defineProps<{
  filters: Filters
  kindCounts: FacetCount[]
  issuerCounts: FacetCount[]
  flagCounts: Partial<Record<FlagKey, number>>
}>()

const emit = defineEmits<{
  'update:kind': [kinds: Kind[]]
  'update:issuer': [issuers: string[]]
  'update:flag': [change: { key: FlagKey; value: boolean | null }]
}>()

function countOf(kind: Kind): number {
  return props.kindCounts.find((entry) => entry.value === kind)?.count ?? 0
}

const kindOptions = computed<Option[]>(() => [
  { value: 'all', label: 'All', count: countOf('etf') + countOf('share') },
  { value: 'etf', label: 'ETFs', count: countOf('etf') },
  { value: 'share', label: 'Shares', count: countOf('share') },
])

// The control picks one kind. No kind, or more than one, means all.
const kindValue = computed(() => (props.filters.kind.length === 1 ? props.filters.kind[0]! : 'all'))

// A chosen issuer stays in the list even when the other filters leave it with no results.
const issuerOptions = computed<Option[]>(() => {
  const options = props.issuerCounts.map((entry) => ({
    value: entry.value,
    label: issuerName(entry.value),
    count: entry.count,
  }))
  for (const issuer of props.filters.issuer) {
    if (!options.some((option) => option.value === issuer)) {
      options.push({ value: issuer, label: issuerName(issuer), count: 0 })
    }
  }
  return options
})

function onKind(value: string) {
  emit('update:kind', value === 'all' ? [] : [value as Kind])
}

function onFlag(key: FlagKey, checked: boolean) {
  emit('update:flag', { key, value: checked ? true : null })
}
</script>

<template>
  <aside class="rail" aria-label="Filters">
    <SegmentedFilter
      label="Type"
      :model-value="kindValue"
      :options="kindOptions"
      @update:model-value="onKind"
    />
    <MultiSelectFilter
      label="Issuer"
      :model-value="filters.issuer"
      :options="issuerOptions"
      placeholder="All issuers"
      selected-label="{0} issuers"
      @update:model-value="emit('update:issuer', $event)"
    />
    <FilterGroup legend="Fund features">
      <CheckboxFilter
        v-for="flag in FLAG_FILTERS"
        :key="flag.key"
        :label="flag.label"
        :model-value="filters[flag.key] === true"
        :count="flagCounts[flag.key]"
        @update:model-value="onFlag(flag.key, $event)"
      />
    </FilterGroup>
  </aside>
</template>

<style scoped>
.rail {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
  min-width: 0;
}
</style>
