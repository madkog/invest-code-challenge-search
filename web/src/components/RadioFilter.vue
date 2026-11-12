<script setup lang="ts">
import { computed, useId } from 'vue'
import RadioButton from 'primevue/radiobutton'

import type { Option } from '../types/ui'
import FilterGroup from './FilterGroup.vue'

const props = withDefaults(
  defineProps<{
    legend: string
    // The empty value means no filter.
    modelValue: string
    options: Option[]
    anyLabel?: string
  }>(),
  { anyLabel: 'Any' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const name = useId()

// PrimeVue's RadioButton never shows an empty value as selected, so Any uses a marker value.
const ANY = '__any__'
const selected = computed(() => props.modelValue || ANY)

function onUpdate(value: string) {
  emit('update:modelValue', value === ANY ? '' : value)
}
</script>

<template>
  <FilterGroup :legend="legend">
    <div class="row">
      <RadioButton
        :model-value="selected"
        :input-id="`${name}-any`"
        :name="name"
        :value="ANY"
        @update:model-value="onUpdate"
      />
      <label :for="`${name}-any`">{{ anyLabel }}</label>
    </div>
    <div v-for="(option, index) in options" :key="option.value" class="row">
      <RadioButton
        :model-value="selected"
        :input-id="`${name}-${index}`"
        :name="name"
        :value="option.value"
        @update:model-value="onUpdate"
      />
      <label :for="`${name}-${index}`">{{ option.label }}</label>
      <span v-if="option.count !== undefined" class="n">{{ option.count }}</span>
    </div>
    <span v-if="$slots.default" class="hint"><slot /></span>
  </FilterGroup>
</template>

<style scoped>
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

label {
  cursor: pointer;
}

.n {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.hint {
  font-size: 13px;
  color: var(--p-text-muted-color);
}
</style>
