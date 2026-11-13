<script setup lang="ts">
import { useTemplateRef } from 'vue'

import SortSelect from '../../../components/SortSelect.vue'
import type { Option } from '../../../types/ui'

defineProps<{
  count: number
  // The text that was searched for. Empty when there is no search.
  query: string
  loading: boolean
  failed: boolean
  sort: string
  sortOptions: Option[]
}>()

defineEmits<{ 'update:sort': [id: string] }>()

const summary = useTemplateRef<HTMLElement>('summary')

// Scrolls to the summary and moves keyboard and screen reader focus to it, for example after
// changing page.
function focus() {
  summary.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  summary.value?.focus({ preventScroll: true })
}

defineExpose({ focus })
</script>

<template>
  <div class="toolbar">
    <div
      ref="summary"
      class="summary"
      data-testid="results-summary"
      aria-live="polite"
      tabindex="-1"
    >
      <template v-if="loading">Searching…</template>
      <template v-else-if="failed">Search didn’t finish</template>
      <template v-else-if="query">
        <strong>{{ count }}</strong> result{{ count === 1 ? '' : 's' }} for
        <strong>“{{ query }}”</strong>
      </template>
      <template v-else
        ><strong>{{ count }}</strong> ETFs and shares, Betashares first</template
      >
    </div>
    <SortSelect
      :model-value="sort"
      :options="sortOptions"
      @update:model-value="$emit('update:sort', $event)"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.summary {
  font-size: 14px;
  color: var(--p-text-muted-color);
}

.summary strong {
  color: var(--p-text-color);
}
</style>
