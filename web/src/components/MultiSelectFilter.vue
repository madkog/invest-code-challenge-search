<script setup lang="ts">
import { useId } from 'vue'
import MultiSelect from 'primevue/multiselect'

import type { Option } from '../types/ui'

withDefaults(
  defineProps<{
    label: string
    modelValue: string[]
    options: Option[]
    placeholder?: string
    // Shown when more than 2 are chosen. {0} is replaced by the number, for example "{0} issuers".
    selectedLabel?: string
  }>(),
  { placeholder: 'All', selectedLabel: '{0} selected' },
)

defineEmits<{ 'update:modelValue': [value: string[]] }>()

const inputId = useId()
</script>

<template>
  <div>
    <label :for="inputId" class="lbl">{{ label }}</label>
    <MultiSelect
      :model-value="modelValue"
      :input-id="inputId"
      :options="options"
      option-label="label"
      option-value="value"
      filter
      :placeholder="placeholder"
      :max-selected-labels="2"
      :selected-items-label="selectedLabel"
      size="small"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #option="{ option }">
        <span class="option">
          {{ option.label }}
          <span v-if="option.count !== undefined" class="n">{{ option.count }}</span>
        </span>
      </template>
    </MultiSelect>
  </div>
</template>

<style scoped>
.lbl {
  display: block;
  margin-bottom: 8px;
  font: 700 13px var(--f-display);
}

.option {
  display: flex;
  width: 100%;
  gap: 8px;
}

.n {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

:deep(.p-multiselect) {
  width: 100%;
}
</style>
