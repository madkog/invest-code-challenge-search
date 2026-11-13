import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import { POPULAR } from '../../../stories/fixtures'
import PopularSearches from './PopularSearches.vue'

const meta = {
  title: 'Search/PopularSearches',
  component: PopularSearches,
  args: { terms: POPULAR, onPick: fn() },
} satisfies Meta<typeof PopularSearches>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Used in the no-results message, without the label.
export const WithoutLabel: Story = { args: { label: '', terms: POPULAR.slice(0, 4) } }

// On a phone the pills scroll sideways in one row.
export const OnAPhone: Story = { globals: { viewport: { value: 'mobile1' } } }
