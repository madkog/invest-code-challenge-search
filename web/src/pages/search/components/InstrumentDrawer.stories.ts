import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import { A200, CBA, LOGO } from '../../../stories/fixtures'
import InstrumentDrawer from './InstrumentDrawer.vue'

const meta = {
  title: 'Search/InstrumentDrawer',
  component: InstrumentDrawer,
  args: {
    visible: true,
    instrument: A200,
    state: 'success',
    'onUpdate:visible': fn(),
    onRetry: fn(),
  },
  // The drawer opens over the page, so the story needs some height.
  parameters: { layout: 'fullscreen' },
  decorators: [() => ({ template: '<div style="min-height: 640px"><story /></div>' })],
} satisfies Meta<typeof InstrumentDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Etf: Story = { args: { instrument: { ...A200, logoUrl: LOGO } } }

export const Share: Story = { args: { instrument: CBA } }

export const Loading: Story = { args: { instrument: null, state: 'loading' } }

export const NotFound: Story = { args: { instrument: null, state: 'not-found' } }

export const Failed: Story = { args: { instrument: null, state: 'error' } }
