import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import FilterPanel from './FilterPanel.vue'

const noFilters = {
  kind: [],
  issuer: [],
  isBetashares: null,
  isFlagshipFund: null,
  isAutoInvestIncluded: null,
}

const meta = {
  title: 'Search/FilterPanel',
  component: FilterPanel,
  args: {
    filters: noFilters,
    kindCounts: [
      { value: 'etf', count: 456 },
      { value: 'share', count: 378 },
    ],
    issuerCounts: [
      { value: 'betashares', count: 102 },
      { value: 'vanguard', count: 38 },
      { value: 'blackrock', count: 61 },
    ],
    flagCounts: { isBetashares: 102, isFlagshipFund: 9, isAutoInvestIncluded: 95 },
    'onUpdate:kind': fn(),
    'onUpdate:issuer': fn(),
    'onUpdate:flag': fn(),
  },
  decorators: [() => ({ template: '<div style="max-width: 270px"><story /></div>' })],
} satisfies Meta<typeof FilterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const NoFilters: Story = {}

export const WithFilters: Story = {
  args: {
    filters: { ...noFilters, kind: ['etf'], issuer: ['vanguard'], isFlagshipFund: true },
  },
}

// Counts are left out while they load or when they fail.
export const CountsLoading: Story = {
  args: { kindCounts: [], issuerCounts: [], flagCounts: {} },
}
