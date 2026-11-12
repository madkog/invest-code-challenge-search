<script setup lang="ts">
import { computed, ref } from 'vue'

import SearchInput from '../../../../components/SearchInput.vue'
import type { FacetCount, Kind, Suggestion } from '../../../../types/search'
import type { SuggestionOption } from '../../../../types/ui'
import { buildSuggestionGroups } from './suggestionGroups'

const props = defineProps<{
  // The text in the box.
  modelValue: string
  // The suggestion data: matches for the typed text, ETF and share counts for it, and what to
  // offer when the box is empty.
  instruments: Suggestion[]
  kinds: FacetCount[]
  flagshipFunds: Suggestion[]
  recent: string[]
  popular: string[]
  placeholder?: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [text: string]
  // The box wants suggestions for this text. The text is empty when the box gets focus.
  complete: [text: string]
  // Search for this text, optionally only ETFs or only shares.
  search: [search: { text: string; kind?: Kind }]
  // An ETF or share was picked: show it in the results and open its details.
  open: [instrument: { id: string; name: string }]
}>()

// The text the current suggestions are for.
const suggestionText = ref('')

const suggestions = computed(() =>
  buildSuggestionGroups({
    text: suggestionText.value,
    recent: props.recent,
    popular: props.popular,
    flagshipFunds: props.flagshipFunds,
    instruments: props.instruments,
    kinds: props.kinds,
  }),
)

function onComplete(text: string) {
  suggestionText.value = text
  emit('complete', text)
}

function onSubmit(text: string) {
  emit('search', { text: text.trim() })
}

function onSelect(option: SuggestionOption) {
  const action = suggestions.value.actions.get(option.key)
  if (action?.type === 'search') {
    emit('search', action.kind ? { text: action.text, kind: action.kind } : { text: action.text })
  }
  if (action?.type === 'item') emit('open', { id: action.id, name: action.name })
}
</script>

<template>
  <SearchInput
    :model-value="modelValue"
    :groups="suggestions.groups"
    :label="label"
    :placeholder="placeholder"
    @update:model-value="emit('update:modelValue', $event)"
    @complete="onComplete"
    @submit="onSubmit"
    @select="onSelect"
  />
</template>
