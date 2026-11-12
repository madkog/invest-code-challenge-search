<script setup lang="ts">
import Button from 'primevue/button'

withDefaults(
  defineProps<{
    terms: string[]
    label?: string
  }>(),
  { label: 'Popular' },
)

defineEmits<{ pick: [term: string] }>()
</script>

<template>
  <div class="popular" role="group" aria-label="Popular searches">
    <span v-if="label" class="label">{{ label }}</span>
    <Button
      v-for="term in terms"
      :key="term"
      :label="term"
      size="small"
      severity="secondary"
      outlined
      rounded
      @click="$emit('pick', term)"
    />
  </div>
</template>

<style scoped>
.popular {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
