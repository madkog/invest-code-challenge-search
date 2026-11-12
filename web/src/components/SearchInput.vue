<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import AutoComplete, {
  type AutoCompleteCompleteEvent,
  type AutoCompleteOptionSelectEvent,
} from 'primevue/autocomplete'
import Button from 'primevue/button'

import type { SuggestionGroup, SuggestionOption } from '../types/ui'
import HighlightedText from './HighlightedText.vue'

withDefaults(
  defineProps<{
    // The text in the box. Typing updates it, but a search only runs on submit.
    modelValue: string
    groups?: SuggestionGroup[]
    placeholder?: string
    // The label for screen readers. The box has no visible label.
    label?: string
    buttonLabel?: string
    emptyText?: string
  }>(),
  {
    groups: () => [],
    placeholder: '',
    label: 'Search',
    buttonLabel: 'Search',
    emptyText: 'No matches yet. Press Enter to search anyway.',
  },
)

const emit = defineEmits<{
  'update:modelValue': [text: string]
  // The box wants suggestions for this text. The text is empty when the box gets focus.
  complete: [text: string]
  // Search for this text, from the button or Enter.
  submit: [text: string]
  // A suggestion was picked. This does not submit the text.
  select: [option: SuggestionOption]
}>()

// PrimeVue's AutoComplete has a hide() method that its type does not list.
const autoComplete = useTemplateRef<{ hide?: () => void }>('autoComplete')
// The text the current suggestions are for, so it can be shown in bold.
const typed = ref('')

const icons = {
  recent: 'pi pi-clock',
  popular: 'pi pi-chart-line',
  search: 'pi pi-search',
  item: '',
} as const

// Picking a suggestion makes the box report an option instead of text, which is ignored here.
function onUpdate(value: unknown) {
  if (typeof value === 'string') emit('update:modelValue', value)
}

function onComplete(event: AutoCompleteCompleteEvent) {
  typed.value = event.query.trim()
  emit('complete', typed.value)
}

function onSelect(event: AutoCompleteOptionSelectEvent) {
  emit('select', event.value as SuggestionOption)
}

function onSubmit(modelValue: string) {
  autoComplete.value?.hide?.()
  emit('submit', modelValue)
}
</script>

<template>
  <form class="search" role="search" @submit.prevent="onSubmit(modelValue)">
    <label for="search-input" class="sr-only">{{ label }}</label>
    <div class="field">
      <i class="pi pi-search icon" aria-hidden="true"></i>
      <AutoComplete
        ref="autoComplete"
        :model-value="modelValue"
        input-id="search-input"
        fluid
        :suggestions="groups"
        option-label="label"
        option-group-label="title"
        option-group-children="items"
        :delay="150"
        :min-length="0"
        complete-on-focus
        :placeholder="placeholder"
        @update:model-value="onUpdate"
        @complete="onComplete"
        @option-select="onSelect"
      >
        <template #optiongroup="{ option }">
          <span class="group">{{ option.title }}</span>
        </template>
        <template #option="{ option }">
          <span class="suggestion">
            <i
              v-if="icons[option.icon as SuggestionOption['icon']]"
              :class="icons[option.icon as SuggestionOption['icon']]"
              aria-hidden="true"
            ></i>
            <span v-if="option.badge" class="badge">
              <HighlightedText :text="option.badge" :terms="[typed]" variant="bold" />
            </span>
            <span class="text">
              <HighlightedText :text="option.label" :terms="[typed]" variant="bold" />
            </span>
            <span v-if="option.meta" class="meta">{{ option.meta }}</span>
          </span>
        </template>
        <template #empty>
          <span class="meta">{{ emptyText }}</span>
        </template>
      </AutoComplete>
    </div>
    <Button type="submit" :label="buttonLabel" class="go" />
  </form>
</template>

<style scoped>
.search {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.field {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
}

.icon {
  position: absolute;
  top: 50%;
  left: 15px;
  z-index: 1;
  color: var(--p-text-muted-color);
  pointer-events: none;
  transform: translateY(-50%);
}

.field :deep(.p-autocomplete) {
  flex: 1;
  min-width: 0;
}

.field :deep(.p-autocomplete-input) {
  height: 54px;
  padding-left: 44px;
  font-size: 17px;
  border-radius: 12px;
}

.go {
  height: 54px;
  padding-inline: 22px;
  font-weight: 600;
  border-radius: 12px;
}

.group {
  font: 600 11px var(--f-body);
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.suggestion {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.suggestion i {
  flex: none;
  color: var(--p-text-muted-color);
}

.text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  min-width: 3.4em;
  padding: 1px 6px;
  font: 600 12px var(--f-mono);
  text-align: center;
  background: var(--p-surface-100);
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}

.app-dark .badge {
  background: var(--p-surface-800);
}

.meta {
  font-size: 12px;
  color: var(--p-text-muted-color);
  white-space: nowrap;
}
</style>
