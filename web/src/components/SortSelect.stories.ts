import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import SortSelect from './SortSelect.vue'

const meta = {
  title: 'Generic/SortSelect',
  component: SortSelect,
  args: {
    modelValue: 'best',
    options: [
      { value: 'best', label: 'Best match' },
      { value: 'symbol-asc', label: 'Ticker A to Z' },
      { value: 'name-asc', label: 'Name A to Z' },
      { value: 'units-desc', label: 'Most shares on issue' },
    ],
    'onUpdate:modelValue': fn(),
  },
  decorators: [() => ({ template: '<div style="min-height: 260px"><story /></div>' })],
} satisfies Meta<typeof SortSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// An option can be shown but not picked, like shares on issue when only ETFs are shown.
export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'best', label: 'Best match' },
      { value: 'units-desc', label: 'Most shares on issue (shares only)', disabled: true },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'))
  },
}
