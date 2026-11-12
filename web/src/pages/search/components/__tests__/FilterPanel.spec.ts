import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MultiSelect from 'primevue/multiselect'

import { withPrimeVue } from '@/__tests__/primeVue'
import type { Filters } from '../../../../types/search'
import FilterPanel from '../FilterPanel.vue'

const noFilters: Filters = {
  kind: [],
  issuer: [],
  isBetashares: null,
  isFlagshipFund: null,
  isAutoInvestIncluded: null,
}

function mountPanel(props: Partial<InstanceType<typeof FilterPanel>['$props']> = {}) {
  return mount(FilterPanel, {
    props: {
      filters: noFilters,
      kindCounts: [
        { value: 'etf', count: 8 },
        { value: 'share', count: 3 },
      ],
      issuerCounts: [
        { value: 'betashares', count: 22 },
        { value: 'blackrock', count: 6 },
      ],
      flagCounts: { isBetashares: 22, isFlagshipFund: 9 },
      ...props,
    },
    global: withPrimeVue,
  })
}

function checkbox(wrapper: ReturnType<typeof mountPanel>, label: string) {
  return wrapper
    .findAll('label')
    .find((item) => item.text().includes(label))!
    .element.closest('.row')!
    .querySelector('input')!
}

describe('FilterPanel', () => {
  it('is a labelled filters region', () => {
    expect(mountPanel().get('aside').attributes('aria-label')).toBe('Filters')
  })

  describe('type', () => {
    it('offers All, ETFs and Shares with counts, and All is the sum', () => {
      const buttons = mountPanel().findAll('button.p-togglebutton')

      expect(buttons.map((button) => button.text())).toEqual(['All11', 'ETFs8', 'Shares3'])
    })

    it('has All chosen when no kind is chosen', () => {
      const buttons = mountPanel().findAll('button.p-togglebutton')

      expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual([
        'true',
        'false',
        'false',
      ])
    })

    it('shows the chosen kind', () => {
      const buttons = mountPanel({ filters: { ...noFilters, kind: ['share'] } }).findAll(
        'button.p-togglebutton',
      )

      expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual([
        'false',
        'false',
        'true',
      ])
    })

    it('reports the chosen kind as a list of one', async () => {
      const wrapper = mountPanel()

      await wrapper.findAll('button.p-togglebutton')[1]!.trigger('click')

      expect(wrapper.emitted('update:kind')).toEqual([[['etf']]])
    })

    it('reports an empty list when All is chosen again', async () => {
      const wrapper = mountPanel({ filters: { ...noFilters, kind: ['etf'] } })

      await wrapper.findAll('button.p-togglebutton')[0]!.trigger('click')

      expect(wrapper.emitted('update:kind')).toEqual([[[]]])
    })

    it('shows counts of 0 when there are no counts yet', () => {
      const buttons = mountPanel({ kindCounts: [] }).findAll('button.p-togglebutton')

      expect(buttons.map((button) => button.text())).toEqual(['All0', 'ETFs0', 'Shares0'])
    })
  })

  describe('issuer', () => {
    it('lists the issuers with display names and counts', () => {
      const options = mountPanel().getComponent(MultiSelect).props('options')

      expect(options).toEqual([
        { value: 'betashares', label: 'Betashares', count: 22 },
        { value: 'blackrock', label: 'iShares (BlackRock)', count: 6 },
      ])
    })

    it('keeps a chosen issuer in the list with a count of 0', () => {
      const options = mountPanel({
        filters: { ...noFilters, issuer: ['vaneck'] },
      })
        .getComponent(MultiSelect)
        .props('options')

      expect(options).toContainEqual({ value: 'vaneck', label: 'VanEck', count: 0 })
    })

    it('reports a new choice of issuers', () => {
      const wrapper = mountPanel()

      wrapper.getComponent(MultiSelect).vm.$emit('update:modelValue', ['blackrock'])

      expect(wrapper.emitted('update:issuer')).toEqual([[['blackrock']]])
    })
  })

  describe('fund features', () => {
    it('has a checkbox for each flag, with its count when it has one', () => {
      const wrapper = mountPanel()

      expect(wrapper.get('legend').text()).toBe('Fund features')
      const rows = wrapper.findAll('fieldset .row').map((row) => row.text())
      expect(rows).toEqual(['Betashares funds22', 'Flagship funds9', 'In Auto Invest'])
    })

    it('ticks the flags that are switched on', () => {
      const wrapper = mountPanel({ filters: { ...noFilters, isFlagshipFund: true } })

      expect(checkbox(wrapper, 'Flagship funds').checked).toBe(true)
      expect(checkbox(wrapper, 'Betashares funds').checked).toBe(false)
    })

    it('reports ticking a flag', async () => {
      const wrapper = mountPanel()

      await wrapper.findAll('input[type="checkbox"]')[2]!.setValue(true)

      expect(wrapper.emitted('update:flag')).toEqual([
        [{ key: 'isAutoInvestIncluded', value: true }],
      ])
    })

    it('reports unticking a flag as no choice, not as false', async () => {
      const wrapper = mountPanel({ filters: { ...noFilters, isBetashares: true } })

      await wrapper.findAll('input[type="checkbox"]')[0]!.setValue(false)

      expect(wrapper.emitted('update:flag')).toEqual([[{ key: 'isBetashares', value: null }]])
    })
  })
})
