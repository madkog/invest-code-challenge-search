import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ListSkeleton from './ListSkeleton.vue'

const meta = {
  title: 'Generic/ListSkeleton',
  component: ListSkeleton,
  args: { rows: 6 },
} satisfies Meta<typeof ListSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FewRows: Story = { args: { rows: 2 } }
