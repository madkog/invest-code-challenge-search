import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import ErrorMessage from '../ErrorMessage.vue'
import { withPrimeVue } from './primeVue'

describe('ErrorMessage', () => {
  it('shows the title and the detail', () => {
    const wrapper = mount(ErrorMessage, {
      props: { title: 'Search is unavailable right now.', message: 'The API said: “Bad query”' },
      global: withPrimeVue,
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('Search is unavailable right now.')
    expect(wrapper.text()).toContain('The API said: “Bad query”')
  })

  it('asks to try again with a button', async () => {
    const wrapper = mount(ErrorMessage, { props: { title: 'Failed' }, global: withPrimeVue })

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').text()).toBe('Try again')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('uses the label it is given for the button', () => {
    const wrapper = mount(ErrorMessage, {
      props: { title: 'Failed', retryLabel: 'Reload' },
      global: withPrimeVue,
    })

    expect(wrapper.get('button').text()).toBe('Reload')
  })
})
