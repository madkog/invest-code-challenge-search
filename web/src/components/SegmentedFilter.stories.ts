import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import SegmentedFilter from './SegmentedFilter.vue'

const meta = {
  title: 'Generic/SegmentedFilter',
  component: SegmentedFilter,
  args: {
    label: 'Type',
    modelValue: 'all',
    options: [
      { value: 'all', label: 'All', count: 834 },
      { value: 'etf', label: 'ETFs', count: 456 },
      { value: 'share', label: 'Shares', count: 378 },
    ],
    'onUpdate:modelValue': fn(),
  },
  decorators: [() => ({ template: '<div style="max-width: 270px"><story /></div>' })],
} satisfies Meta<typeof SegmentedFilter>

export default meta
type Story = StoryObj<typeof meta>

export const AllChosen: Story = {}

export const EtfsChosen: Story = { args: { modelValue: 'etf' } }
