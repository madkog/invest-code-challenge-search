import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from 'primevue/chip'

import ActiveFilters from '../ActiveFilters.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

const chips = [
  { key: 'kind', label: 'ETFs' },
  { key: 'issuer:vanguard', label: 'Vanguard' },
]

describe('ActiveFilters', () => {
  it('shows nothing when there are no chips', () => {
    const wrapper = mount(ActiveFilters, { props: { chips: [] }, global: withPrimeVue })

    expect(wrapper.find('.chips').exists()).toBe(false)
  })

  it('shows a removable chip for each filter', () => {
    const wrapper = mount(ActiveFilters, { props: { chips }, global: withPrimeVue })

    expect(wrapper.findAllComponents(Chip).map((chip) => chip.props('label'))).toEqual([
      'ETFs',
      'Vanguard',
    ])
    expect(wrapper.findAllComponents(Chip).every((chip) => chip.props('removable'))).toBe(true)
  })

  it('reports which chip was removed', () => {
    const wrapper = mount(ActiveFilters, { props: { chips }, global: withPrimeVue })

    wrapper.findAllComponents(Chip)[1]!.vm.$emit('remove')

    expect(wrapper.emitted('remove')).toEqual([['issuer:vanguard']])
  })

  it('clears everything with the link button', async () => {
    const wrapper = mount(ActiveFilters, { props: { chips }, global: withPrimeVue })

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').text()).toBe('Clear all')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('uses the clear label it is given', () => {
    const wrapper = mount(ActiveFilters, {
      props: { chips, clearLabel: 'Reset' },
      global: withPrimeVue,
    })

    expect(wrapper.get('button').text()).toBe('Reset')
  })
})
