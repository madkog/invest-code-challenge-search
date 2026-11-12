<script setup lang="ts">
import Button from 'primevue/button'
import Chip from 'primevue/chip'

import type { FilterChip } from '../types/ui'

withDefaults(
  defineProps<{
    chips: FilterChip[]
    clearLabel?: string
  }>(),
  { clearLabel: 'Clear all' },
)

defineEmits<{
  remove: [key: string]
  clear: []
}>()
</script>

<template>
  <div v-if="chips.length" class="chips">
    <Chip
      v-for="chip in chips"
      :key="chip.key"
      :label="chip.label"
      removable
      @remove="$emit('remove', chip.key)"
    />
    <Button :label="clearLabel" link size="small" @click="$emit('clear')" />
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>
