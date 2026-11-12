<script setup lang="ts">
import { useId } from 'vue'
import SelectButton from 'primevue/selectbutton'

import type { Option } from '../types/ui'

defineProps<{
  label: string
  modelValue: string
  options: Option[]
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const labelId = useId()
</script>

<template>
  <div>
    <div :id="labelId" class="lbl">{{ label }}</div>
    <SelectButton
      :model-value="modelValue"
      :options="options"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      :aria-labelledby="labelId"
      size="small"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #option="{ option }">
        {{ option.label
        }}<span v-if="option.count !== undefined" class="n"> {{ option.count }}</span>
      </template>
    </SelectButton>
  </div>
</template>

<style scoped>
.lbl {
  margin-bottom: 8px;
  font: 700 13px var(--f-display);
}

.n {
  margin-left: 0.4em;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}

:deep(.p-selectbutton) {
  display: flex;
}

:deep(.p-togglebutton) {
  flex: 1 1 auto;
  min-width: 0;
  padding-inline: 6px;
  font-size: 13px;
  white-space: nowrap;
}

:deep(.p-togglebutton-content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
