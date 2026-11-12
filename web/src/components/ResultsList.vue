<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  itemKey: (item: T) => string | number
  label?: string
}>()

defineSlots<{
  item(props: { item: T }): unknown
}>()
</script>

<template>
  <ul class="list" :aria-label="label">
    <li v-for="item in items" :key="itemKey(item)">
      <slot name="item" :item="item" />
    </li>
  </ul>
</template>

<style scoped>
.list {
  display: grid;
  margin: 0;
  padding: 0;
  overflow: hidden;
  list-style: none;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
}

li + li {
  border-top: 1px solid var(--p-content-border-color);
}
</style>
