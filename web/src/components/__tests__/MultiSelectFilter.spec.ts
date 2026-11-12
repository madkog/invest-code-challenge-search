import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MultiSelect from 'primevue/multiselect'

import MultiSelectFilter from '../MultiSelectFilter.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

const options = [
  { value: 'betashares', label: 'Betashares', count: 22 },
  { value: 'vanguard', label: 'Vanguard', count: 6 },
]

function mountFilter(modelValue: string[] = []) {
  return mount(MultiSelectFilter, {
    props: { label: 'Issuer', modelValue, options, placeholder: 'All issuers' },
    global: withPrimeVue,
  })
}

describe('MultiSelectFilter', () => {
  it('has a label that points at the control', () => {
    const wrapper = mountFilter()

    const label = wrapper.get('label')
    expect(label.text()).toBe('Issuer')
    expect(wrapper.find(`[id="${label.attributes('for')}"]`).exists()).toBe(true)
  })

  it('shows the placeholder when nothing is chosen', () => {
    expect(mountFilter().text()).toContain('All issuers')
  })

  it('shows the labels of the chosen options', () => {
    expect(mountFilter(['vanguard']).text()).toContain('Vanguard')
  })

  it('reports a new choice', () => {
    const wrapper = mountFilter()

    wrapper.getComponent(MultiSelect).vm.$emit('update:modelValue', ['vanguard'])

    expect(wrapper.emitted('update:modelValue')).toEqual([[['vanguard']]])
  })
})
