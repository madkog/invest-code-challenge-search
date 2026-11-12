import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import CheckboxFilter from '../CheckboxFilter.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

function mountFilter(props: { modelValue: boolean; count?: number }) {
  return mount(CheckboxFilter, {
    props: { label: 'Flagship funds', ...props },
    global: withPrimeVue,
  })
}

describe('CheckboxFilter', () => {
  it('has a label that points at the checkbox', () => {
    const wrapper = mountFilter({ modelValue: false })

    const label = wrapper.get('label')
    expect(label.text()).toBe('Flagship funds')
    expect(wrapper.get('input').attributes('id')).toBe(label.attributes('for'))
  })

  it('shows the count when it has one', () => {
    expect(mountFilter({ modelValue: false, count: 4 }).get('.n').text()).toBe('4')
    expect(mountFilter({ modelValue: false }).find('.n').exists()).toBe(false)
  })

  it('shows a count of 0', () => {
    expect(mountFilter({ modelValue: false, count: 0 }).get('.n').text()).toBe('0')
  })

  it('is ticked when the value is true', () => {
    expect(mountFilter({ modelValue: true }).get('input').element.checked).toBe(true)
    expect(mountFilter({ modelValue: false }).get('input').element.checked).toBe(false)
  })

  it('reports ticking and unticking', async () => {
    const wrapper = mountFilter({ modelValue: false })

    await wrapper.get('input').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })
})
