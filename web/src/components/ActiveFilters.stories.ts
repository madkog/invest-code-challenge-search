import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import ActiveFilters from './ActiveFilters.vue'

const meta = {
  title: 'Generic/ActiveFilters',
  component: ActiveFilters,
  args: {
    chips: [
      { key: 'kind:etf', label: 'ETFs' },
      { key: 'issuer:vanguard', label: 'Vanguard' },
      { key: 'flag:isFlagshipFund', label: 'Flagship funds' },
    ],
    onRemove: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof ActiveFilters>

export default meta
type Story = StoryObj<typeof meta>

export const WithFilters: Story = {}

// Nothing is shown when no filters are on.
export const NoFilters: Story = { args: { chips: [] } }
