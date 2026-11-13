import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Component } from 'vue'

import ResultsList from './ResultsList.vue'

const items = [
  { id: 1, name: 'Betashares Australia 200 ETF' },
  { id: 2, name: 'Vanguard Australian Shares Index ETF' },
  { id: 3, name: 'Commonwealth Bank of Australia' },
]

// The list is generic: each item is drawn by the parent through the item slot.
// Storybook's types can't describe a generic component, so this meta is untyped.
const meta: Meta = {
  title: 'Generic/ResultsList',
  render: () => ({
    // Cast for the same reason: a generic component has no plain Component type.
    components: { ResultsList: ResultsList as unknown as Component },
    setup: () => ({ items, itemKey: (item: { id: number }) => item.id }),
    template: `
      <ResultsList :items="items" :item-key="itemKey" label="Search results">
        <template #item="{ item }">
          <div style="padding: 14px 16px">{{ item.name }}</div>
        </template>
      </ResultsList>`,
  }),
}

export default meta
type Story = StoryObj

export const Default: Story = {}
