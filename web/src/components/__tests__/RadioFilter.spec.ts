import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import RadioFilter from '../RadioFilter.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

const options = [
  { value: '0,100', label: 'Under 100m', count: 5 },
  { value: '100', label: 'Over 100m', count: 9 },
]

function mountFilter(modelValue = '', slots = {}) {
  return mount(RadioFilter, {
    props: { legend: 'Shares on issue', modelValue, options },
    slots,
    global: withPrimeVue,
  })
}

describe('RadioFilter', () => {
  it('groups the choices under a legend', () => {
    const wrapper = mountFilter()

    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.get('legend').text()).toBe('Shares on issue')
  })

  it('offers Any first, then each option with its count', () => {
    const rows = mountFilter().findAll('.row')

    expect(rows.map((row) => row.text())).toEqual(['Any', 'Under 100m5', 'Over 100m9'])
  })

  it('uses the any label it is given', () => {
    const wrapper = mount(RadioFilter, {
      props: { legend: 'Units', modelValue: '', options, anyLabel: 'All sizes' },
      global: withPrimeVue,
    })

    expect(wrapper.findAll('.row')[0]!.text()).toBe('All sizes')
  })

  it('gives every choice a label and one shared name', () => {
    const inputs = mountFilter().findAll('input')

    for (const input of inputs) {
      const label = mountFilter().find('label')
      expect(label.exists()).toBe(true)
      expect(input.attributes('type')).toBe('radio')
    }
    expect(new Set(inputs.map((input) => input.attributes('name'))).size).toBe(1)
    expect(new Set(inputs.map((input) => input.attributes('id'))).size).toBe(3)
  })

  it('selects the chosen option, and Any for the empty value', () => {
    const checked = (modelValue: string) =>
      mountFilter(modelValue)
        .findAll('input')
        .map((input) => input.element.checked)

    expect(checked('')).toEqual([true, false, false])
    expect(checked('100')).toEqual([false, false, true])
  })

  it('reports a new choice', async () => {
    const wrapper = mountFilter()

    await wrapper.findAll('input')[1]!.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([['0,100']])
  })

  it('reports Any as the empty value', async () => {
    const wrapper = mountFilter('100')

    await wrapper.findAll('input')[0]!.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('shows a hint when given one', () => {
    const wrapper = mountFilter('', { default: 'Only shares report this.' })

    expect(wrapper.get('.hint').text()).toBe('Only shares report this.')
  })
})
