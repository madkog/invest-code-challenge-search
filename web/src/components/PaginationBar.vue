<script setup lang="ts">
import { computed } from 'vue'
import Paginator, { type PageState } from 'primevue/paginator'

const props = withDefaults(
  defineProps<{
    // The current page, starting at 1.
    page: number
    pageSize: number
    total: number
    pageSizeOptions?: number[]
  }>(),
  { pageSizeOptions: () => [15, 30, 50] },
)

const emit = defineEmits<{ change: [change: { page: number; pageSize: number }] }>()

// One page of the smallest size or less never needs controls.
const visible = computed(() => props.total > Math.min(props.pageSize, ...props.pageSizeOptions))
// The paginator counts from 0 by position, while the page counts from 1.
const first = computed(() => (props.page - 1) * props.pageSize)

// Phones get a simpler pager with large buttons that are easy to tap: ‹ Page 2 of 31 ›.
const MOBILE_BREAKPOINT = '560px'
// Each pager gets its own copy, because PrimeVue changes the object it is given.
const layout = {
  [MOBILE_BREAKPOINT]: 'PrevPageLink CurrentPageReport NextPageLink RowsPerPageDropdown',
  default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
}

function onPage(state: PageState) {
  emit('change', { page: Math.floor(state.first / state.rows) + 1, pageSize: state.rows })
}
</script>

<template>
  <Paginator
    v-if="visible"
    class="pager"
    :rows="pageSize"
    :total-records="total"
    :first="first"
    :rows-per-page-options="pageSizeOptions"
    :template="layout"
    current-page-report-template="Page {currentPage} of {totalPages}"
    @page="onPage"
  />
</template>

<style scoped>
.pager {
  margin-top: 14px;
  background: transparent;
}

/* 44px buttons on phones, the recommended size for a touch target. */
@media (max-width: 560px) {
  .pager :deep(.p-paginator-prev),
  .pager :deep(.p-paginator-next) {
    min-width: 2.75rem;
    height: 2.75rem;
  }

  .pager :deep(.p-paginator-current) {
    white-space: nowrap;
  }
}
</style>
