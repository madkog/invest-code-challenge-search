import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import SearchInput from './SearchInput.vue'

const meta = {
  title: 'Generic/SearchInput',
  component: SearchInput,
  args: {
    modelValue: '',
    label: 'Search by ticker, name or issuer',
    placeholder: 'Ticker, fund name or issuer, e.g. A200, bank, vanguard',
    groups: [
      {
        title: 'Recent searches',
        items: [{ key: 'recent:gold', label: 'gold', icon: 'recent' }],
      },
      {
        title: 'Popular searches',
        items: [
          { key: 'popular:bank', label: 'bank', icon: 'popular' },
          { key: 'popular:nasdaq', label: 'nasdaq', icon: 'popular' },
        ],
      },
      {
        title: 'Flagship funds',
        items: [
          {
            key: 'item:A200',
            label: 'Betashares Australia 200 ETF',
            icon: 'item',
            badge: 'A200',
            meta: 'Betashares',
          },
        ],
      },
    ],
    'onUpdate:modelValue': fn(),
    onComplete: fn(),
    onSubmit: fn(),
    onSelect: fn(),
  },
  // Room for the dropdown below the box.
  decorators: [() => ({ template: '<div style="min-height: 380px"><story /></div>' })],
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// Focusing the box opens the suggestions.
export const WithSuggestionsOpen: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'))
  },
}

export const WithText: Story = { args: { modelValue: 'vanguard' } }
