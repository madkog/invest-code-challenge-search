import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import AvatarBadge from '../AvatarBadge.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

function mountBadge(props: Record<string, unknown>) {
  return mount(AvatarBadge, { props: { label: 'A200', ...props }, global: withPrimeVue })
}

describe('AvatarBadge', () => {
  it('shows the first 2 letters of the label in capitals when there is no image', () => {
    const wrapper = mountBadge({ label: 'dhhf' })

    expect(wrapper.text()).toBe('DH')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('uses the colour as the background', () => {
    const wrapper = mountBadge({ colour: '#FFCC00' })

    expect(wrapper.attributes('style')).toContain('rgb(255, 204, 0)')
  })

  it('picks readable text for the background', () => {
    const light = mountBadge({ colour: '#FFCC00' })
    const dark = mountBadge({ colour: '#1A1A1A' })

    expect(light.attributes('style')).toContain('rgb(15, 23, 42)')
    expect(dark.attributes('style')).toContain('rgb(255, 255, 255)')
  })

  it('uses a neutral background when there is no colour', () => {
    const wrapper = mountBadge({})

    expect(wrapper.attributes('style')).toContain('rgb(100, 116, 139)')
  })

  it('shows the image when there is one', () => {
    const wrapper = mountBadge({ imageUrl: 'a200.svg' })

    expect(wrapper.get('img').attributes('src')).toBe('a200.svg')
  })

  it('falls back to the letters when the image fails to load', async () => {
    const wrapper = mountBadge({ imageUrl: 'broken.svg' })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('A2')
  })

  it('tries again when the image changes', async () => {
    const wrapper = mountBadge({ imageUrl: 'broken.svg' })
    await wrapper.get('img').trigger('error')

    await wrapper.setProps({ imageUrl: 'fixed.svg' })

    expect(wrapper.get('img').attributes('src')).toBe('fixed.svg')
  })
})
