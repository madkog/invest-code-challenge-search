<script setup lang="ts">
import { useId } from 'vue'
import Select from 'primevue/select'

import type { Option } from '../types/ui'

withDefaults(
  defineProps<{
    modelValue: string
    options: Option[]
    label?: string
  }>(),
  { label: 'Sort by' },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = useId()
</script>

<template>
  <div class="sort">
    <label :for="inputId">{{ label }}</label>
    <Select
      :model-value="modelValue"
      :input-id="inputId"
      :options="options"
      option-label="label"
      option-value="value"
      option-disabled="disabled"
      size="small"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.sort {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: var(--p-text-muted-color);
}
</style>
