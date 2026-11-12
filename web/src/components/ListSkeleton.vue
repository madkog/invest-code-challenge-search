<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

withDefaults(
  defineProps<{
    rows?: number
    label?: string
  }>(),
  { rows: 6, label: 'Loading results' },
)
</script>

<template>
  <div class="list" aria-busy="true" :aria-label="label" role="status">
    <div v-for="row in rows" :key="row" class="row" aria-hidden="true">
      <Skeleton shape="circle" size="2.5rem" />
      <div class="lines">
        <Skeleton width="55%" height="1rem" />
        <Skeleton width="35%" height=".75rem" />
      </div>
      <Skeleton width="4rem" height="1.6rem" />
    </div>
  </div>
</template>

<style scoped>
.list {
  display: grid;
  overflow: hidden;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
}

.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px 14px;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--p-content-border-color);
}

.row:last-child {
  border-bottom: 0;
}

.lines {
  display: grid;
  gap: 8px;
}
</style>
