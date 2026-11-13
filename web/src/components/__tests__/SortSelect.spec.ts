import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from 'primevue/select'

import SortSelect from '../SortSelect.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

const options = [
  { value: '', label: 'Best match' },
  { value: 'symbol.asc', label: 'Ticker A to Z' },
]

describe('SortSelect', () => {
  it('has a label that points at the select', () => {
    const wrapper = mount(SortSelect, { props: { modelValue: '', options }, global: withPrimeVue })

    const label = wrapper.get('label')
    expect(label.text()).toBe('Sort by')
    expect(wrapper.find(`[id="${label.attributes('for')}"]`).exists()).toBe(true)
  })

  it('names the select with its label for screen readers', () => {
    const wrapper = mount(SortSelect, { props: { modelValue: '', options }, global: withPrimeVue })

    const labelId = wrapper.get('label').attributes('id')
    expect(wrapper.get('[role="combobox"]').attributes('aria-labelledby')).toBe(labelId)
  })

  it('uses the label it is given', () => {
    const wrapper = mount(SortSelect, {
      props: { modelValue: '', options, label: 'Order' },
      global: withPrimeVue,
    })

    expect(wrapper.get('label').text()).toBe('Order')
  })

  it('shows the label of the chosen option', () => {
    const wrapper = mount(SortSelect, {
      props: { modelValue: 'symbol.asc', options },
      global: withPrimeVue,
    })

    expect(wrapper.text()).toContain('Ticker A to Z')
  })

  it('lets the select disable an option that is marked disabled', () => {
    const wrapper = mount(SortSelect, {
      props: { modelValue: '', options: [...options, { value: 'x', label: 'X', disabled: true }] },
      global: withPrimeVue,
    })

    expect(wrapper.getComponent(Select).props('optionDisabled')).toBe('disabled')
  })

  it('reports a new choice', () => {
    const wrapper = mount(SortSelect, { props: { modelValue: '', options }, global: withPrimeVue })

    wrapper.getComponent(Select).vm.$emit('update:modelValue', 'symbol.asc')

    expect(wrapper.emitted('update:modelValue')).toEqual([['symbol.asc']])
  })
})
