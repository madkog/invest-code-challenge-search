<script setup lang="ts">
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Skeleton from 'primevue/skeleton'

import AvatarBadge from '../../../components/AvatarBadge.vue'
import type { Instrument } from '../../../types/search'
import { formatUnits, issuerName, kindLabel } from '../utils/format'

defineProps<{
  visible: boolean
  // The instrument to show. Null until it has loaded.
  instrument: Instrument | null
  state: 'idle' | 'loading' | 'success' | 'not-found' | 'error'
}>()

defineEmits<{ 'update:visible': [visible: boolean]; retry: [] }>()

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}
</script>

<template>
  <Drawer
    :visible="visible"
    position="right"
    :header="instrument?.symbol ?? 'Details'"
    style="width: min(420px, 100vw)"
    @update:visible="$emit('update:visible', $event)"
  >
    <p v-if="state === 'not-found'" class="message" role="status">
      We couldn’t find that ETF or share.
    </p>
    <div v-else-if="state === 'error'" class="error" role="alert">
      <p class="message">We couldn’t load the details.</p>
      <span><Button label="Try again" size="small" @click="$emit('retry')" /></span>
    </div>
    <div v-else-if="!instrument" class="loading" aria-busy="true" aria-label="Loading details">
      <Skeleton height="1.4rem" width="80%" />
      <Skeleton v-for="row in 6" :key="row" height="1rem" />
    </div>
    <div v-else class="content">
      <div class="top">
        <AvatarBadge
          class="avatar"
          :label="instrument.symbol"
          :image-url="instrument.logoUrl"
          size="xlarge"
        />
        <div class="title">
          <div class="name">{{ instrument.name }}</div>
          <div class="id">{{ instrument.id }}</div>
        </div>
      </div>

      <dl class="details">
        <dt>Type</dt>
        <dd>{{ kindLabel(instrument.kind) }}</dd>
        <dt>Issuer</dt>
        <dd>{{ instrument.issuer ? issuerName(instrument.issuer) : 'Not listed' }}</dd>
        <dt>Ticker</dt>
        <dd>
          <code>{{ instrument.symbol }}</code>
        </dd>
        <dt>Currency</dt>
        <dd>{{ instrument.currency }}</dd>
        <dt>Betashares fund</dt>
        <dd>{{ yesNo(instrument.isBetashares) }}</dd>
        <dt>Flagship fund</dt>
        <dd>{{ yesNo(instrument.isFlagshipFund) }}</dd>
        <dt>Auto Invest</dt>
        <dd>{{ instrument.isAutoInvestIncluded ? 'Included' : 'Not included' }}</dd>
        <dt>Portfolios</dt>
        <dd>{{ instrument.isPortfolioExcluded ? 'Excluded' : 'Allowed' }}</dd>
        <dt>Shares on issue</dt>
        <dd>
          {{
            instrument.unitsCirculating !== null
              ? formatUnits(instrument.unitsCirculating)
              : 'Not reported'
          }}
        </dd>
      </dl>
    </div>
  </Drawer>
</template>

<style scoped>
.message {
  margin: 0;
  color: var(--p-text-muted-color);
}

.error,
.loading,
.content {
  display: grid;
  gap: 18px;
}

.top {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* A long name wraps beside the logo, so the logo must keep its round shape. */
.avatar {
  flex: none;
}

.title {
  min-width: 0;
}

.name {
  font: 700 18px var(--f-display);
}

.id {
  font-size: 13px;
  color: var(--p-text-muted-color);
}

.details {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 16px;
  margin: 0;
  font-size: 14px;
}

.details dt {
  color: var(--p-text-muted-color);
}

.details dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.details code {
  font: 500 13px var(--f-mono);
}
</style>
