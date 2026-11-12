import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Button from 'primevue/button'

import preset from '../preset'

describe('PrimeVue setup', () => {
  it('renders a PrimeVue component with the app preset', () => {
    const wrapper = mount(Button, {
      props: { label: 'Search' },
      global: { plugins: [[PrimeVue, { theme: { preset } }]] },
    })

    expect(wrapper.text()).toBe('Search')
    expect(wrapper.classes()).toContain('p-button')
  })
})
