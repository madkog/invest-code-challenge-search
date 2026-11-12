import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import ThemeToggle from '../ThemeToggle.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

function mountToggle(dark: boolean) {
  return mount(ThemeToggle, { props: { dark }, global: withPrimeVue })
}

describe('ThemeToggle', () => {
  it('offers the dark theme while light, with a moon', () => {
    const button = mountToggle(false).get('button')

    expect(button.attributes('aria-label')).toBe('Switch to dark theme')
    expect(button.find('.pi-moon').exists()).toBe(true)
  })

  it('offers the light theme while dark, with a sun', () => {
    const button = mountToggle(true).get('button')

    expect(button.attributes('aria-label')).toBe('Switch to light theme')
    expect(button.find('.pi-sun').exists()).toBe(true)
  })

  it('reports a press', async () => {
    const wrapper = mountToggle(false)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[]])
  })
})
