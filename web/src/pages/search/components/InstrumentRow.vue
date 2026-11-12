<script setup lang="ts">
import Tag from 'primevue/tag'

import AvatarBadge from '../../../components/AvatarBadge.vue'
import HighlightedText from '../../../components/HighlightedText.vue'
import type { Instrument } from '../../../types/search'
import { formatUnits, issuerName, kindLabel } from '../utils/format'

defineEmits<{ select: [instrument: Instrument] }>()

defineProps<{
  instrument: Instrument
  // The words of the search, highlighted in the ticker, name and issuer.
  terms: string[]
}>()
</script>

<template>
  <div class="row">
    <AvatarBadge :label="instrument.symbol" :image-url="instrument.logoUrl" class="avatar" />
    <span class="top">
      <span class="ticker"><HighlightedText :text="instrument.symbol" :terms="terms" /></span>
      <span class="name">
        <!-- The whole row is clickable through this button, so it is a single tab stop. -->
        <button
          type="button"
          class="open"
          :aria-label="`Show details for ${instrument.name} (${instrument.symbol})`"
          @click="$emit('select', instrument)"
        >
          <HighlightedText :text="instrument.name" :terms="terms" />
        </button>
      </span>
    </span>
    <span class="sub">
      <Tag :value="kindLabel(instrument.kind)" severity="secondary" />
      <HighlightedText
        v-if="instrument.issuer"
        :text="issuerName(instrument.issuer)"
        :terms="terms"
      />
      <Tag v-if="instrument.isFlagshipFund" value="Flagship" severity="info" />
      <Tag v-if="instrument.isAutoInvestIncluded" value="Auto Invest" severity="success" />
    </span>
    <span class="right">
      <template v-if="instrument.unitsCirculating !== null">
        <span>Shares on issue</span>
        <strong>{{ formatUnits(instrument.unitsCirculating) }}</strong>
      </template>
      <template v-else>
        <span>{{ instrument.currency }}</span>
        <strong>{{ instrument.id }}</strong>
      </template>
    </span>
  </div>
</template>

<style scoped>
.row {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 4px 14px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: var(--p-content-background);
}

.row:hover {
  background: var(--tint-background);
}

.row:hover .name {
  text-decoration: underline;
  text-decoration-color: var(--p-primary-500);
  text-underline-offset: 3px;
}

.row:has(.open:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: -2px;
}

.open {
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;
}

/* Stretches the button over the whole row, so a click anywhere on the row opens the details. */
.open::after {
  position: absolute;
  inset: 0;
  content: '';
}

.open:focus-visible {
  outline: none;
}

.avatar {
  grid-row: 1 / 3;
}

.top {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.ticker {
  display: inline-block;
  min-width: 3.4em;
  padding: 1px 6px;
  font: 600 12px var(--f-mono);
  text-align: center;
  background: var(--tint-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}

.name {
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.sub {
  display: flex;
  flex-wrap: wrap;
  grid-column: 2;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: var(--p-text-muted-color);
}

.right {
  display: grid;
  grid-column: 3;
  grid-row: 1 / 3;
  gap: 2px;
  justify-items: end;
  font-size: 12px;
  color: var(--p-text-muted-color);
  text-align: right;
}

.right strong {
  font: 600 14px var(--f-mono);
  font-variant-numeric: tabular-nums;
  color: var(--p-text-color);
}

@media (max-width: 560px) {
  .row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  /* On a narrow screen the ticker sits above the name, so a long name gets the full width. */
  .top {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .right {
    grid-column: 2;
    grid-row: auto;
    justify-items: start;
    text-align: left;
  }
}
</style>
