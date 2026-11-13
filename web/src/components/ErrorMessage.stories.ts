import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import ErrorMessage from './ErrorMessage.vue'

const meta = {
  title: 'Generic/ErrorMessage',
  component: ErrorMessage,
  args: {
    title: 'We couldn’t load results.',
    message: 'Please try again in a moment.',
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TitleOnly: Story = { args: { message: '' } }
