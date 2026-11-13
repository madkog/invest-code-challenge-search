import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import ResultsToolbar from './ResultsToolbar.vue'

const meta = {
  title: 'Search/ResultsToolbar',
  component: ResultsToolbar,
  args: {
    count: 834,
    query: '',
    loading: false,
    failed: false,
    sort: 'best',
    sortOptions: [
      { value: 'best', label: 'Betashares first' },
      { value: 'symbol-asc', label: 'Ticker A to Z' },
      { value: 'name-asc', label: 'Name A to Z' },
    ],
    'onUpdate:sort': fn(),
  },
} satisfies Meta<typeof ResultsToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const NoSearch: Story = {}

export const WithSearch: Story = {
  args: {
    count: 12,
    query: 'gold',
    sortOptions: [
      { value: 'best', label: 'Best match' },
      { value: 'symbol-asc', label: 'Ticker A to Z' },
    ],
  },
}

export const OneResult: Story = { args: { count: 1, query: 'A200' } }

export const Loading: Story = { args: { loading: true } }

export const Failed: Story = { args: { failed: true } }
