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
    <div class="pills">
      <Button
        v-for="term in terms"
        :key="term"
        :label="term"
        size="small"
        severity="secondary"
        outlined
        rounded
        class="pill"
        @click="$emit('pick', term)"
      />
    </div>
  </div>
</template>

<style scoped>
.popular,
.pills {
  min-width: 0;
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

/* White pills with a clear border, like the Betashares site. PrimeVue's secondary outline is too
   faint on the warm page background. */
.pill {
  background: var(--p-content-background);
  border-color: var(--pill-border);
}

.pill:not(:disabled):hover {
  background: var(--p-content-background);
  border-color: var(--pill-border-hover);
}

/* On a phone the pills sit in one row that scrolls sideways, with the label on its own line above.
   A fade on the right shows there is more to swipe to, and the pills are taller to tap. */
@media (max-width: 560px) {
  .popular {
    flex-direction: column;
    /* Without nowrap, a wrapping column sizes the pills row to its content instead of the page. */
    flex-wrap: nowrap;
    gap: 6px;
    align-items: stretch;
  }

  .pills {
    flex-wrap: nowrap;
    /* Room for the focus ring, and space at the end so the last pill can scroll clear of the fade. */
    padding: 4px 32px 4px 2px;
    overflow-x: auto;
    /* Swiping the pills only scrolls the pills, never the page behind them. */
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, black calc(100% - 32px), transparent);
  }

  .pills::-webkit-scrollbar {
    display: none;
  }

  .pill {
    flex: none;
    min-height: 40px;
    padding-inline: 16px;
    font-size: 14px;
  }
}
</style>
