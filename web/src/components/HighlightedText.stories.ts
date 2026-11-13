import type { Meta, StoryObj } from '@storybook/vue3-vite'

import HighlightedText from './HighlightedText.vue'

const meta = {
  title: 'Generic/HighlightedText',
  component: HighlightedText,
  args: { text: 'Betashares Global Gold Miners ETF', terms: ['gold'] },
  argTypes: { variant: { control: 'inline-radio', options: ['mark', 'bold'] } },
} satisfies Meta<typeof HighlightedText>

export default meta
type Story = StoryObj<typeof meta>

// Used in the results: matches are underlined in the brand colour.
export const Underlined: Story = { args: { variant: 'mark' } }

// Used in the suggestions: matches are bold.
export const Bold: Story = { args: { variant: 'bold' } }

export const SeveralWords: Story = { args: { terms: ['gold', 'miners'] } }

export const NoMatch: Story = { args: { terms: ['bank'] } }
