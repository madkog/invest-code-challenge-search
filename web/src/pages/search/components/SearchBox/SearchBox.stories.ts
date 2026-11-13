import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import { A200, CBA, POPULAR, toSuggestion, VAS } from '../../../../stories/fixtures'
import SearchBox from './SearchBox.vue'

const meta = {
  title: 'Search/SearchBox',
  component: SearchBox,
  args: {
    modelValue: '',
    instruments: [],
    kinds: [],
    flagshipFunds: [toSuggestion(A200)],
    recent: ['gold', 'vanguard'],
    popular: POPULAR,
    label: 'Search by ticker, name or issuer',
    placeholder: 'Ticker, fund name or issuer, e.g. A200, bank, vanguard',
    'onUpdate:modelValue': fn(),
    onComplete: fn(),
    onSearch: fn(),
    onOpen: fn(),
  },
  // Room for the dropdown below the box.
  decorators: [() => ({ template: '<div style="min-height: 460px"><story /></div>' })],
} satisfies Meta<typeof SearchBox>

export default meta
type Story = StoryObj<typeof meta>

// With nothing typed: recent and popular searches, and flagship funds.
export const EmptyBox: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'))
  },
}

// With text typed: search for it everywhere or in ETFs or shares, and the matches.
export const Typing: Story = {
  args: {
    modelValue: 'a',
    instruments: [A200, VAS, CBA].map(toSuggestion),
    kinds: [
      { value: 'etf', count: 120 },
      { value: 'share', count: 64 },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('combobox'), 'ustralia')
  },
}

export const NoSuggestions: Story = {
  args: { modelValue: 'zzz' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('combobox'), 'q')
  },
}
