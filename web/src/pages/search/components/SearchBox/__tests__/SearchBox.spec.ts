import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import { withPrimeVue } from '@/__tests__/primeVue'
import SearchInput from '../../../../../components/SearchInput.vue'
import type { Suggestion } from '../../../../../types/search'
import SearchBox from '../SearchBox.vue'

const VAS: Suggestion = {
  id: 'VAS:AU',
  symbol: 'VAS',
  name: 'Vanguard Australian Shares',
  kind: 'etf',
  issuer: 'vanguard',
}

function mountBox(props: Partial<InstanceType<typeof SearchBox>['$props']> = {}) {
  return mount(SearchBox, {
    props: {
      modelValue: '',
      instruments: [],
      kinds: [],
      flagshipFunds: [],
      recent: [],
      popular: ['bank', 'gold', 'nasdaq', 'vanguard', 'ethical'],
      ...props,
    },
    global: withPrimeVue,
  })
}

// The dropdown groups the box currently gives the generic search input.
function groupsOf(wrapper: ReturnType<typeof mountBox>) {
  return wrapper.getComponent(SearchInput).props('groups') ?? []
}

describe('SearchBox', () => {
  it('gives the search input its label and placeholder', () => {
    const wrapper = mountBox({ label: 'Search by ticker', placeholder: 'Try bank' })

    expect(wrapper.get('label').text()).toBe('Search by ticker')
    expect(wrapper.get('input').attributes('placeholder')).toBe('Try bank')
  })

  it('shows the text it is given and reports typing', async () => {
    const wrapper = mountBox({ modelValue: 'van' })
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('van')

    await wrapper.get('input').setValue('vang')

    expect(wrapper.emitted('update:modelValue')).toEqual([['vang']])
  })

  describe('suggestions', () => {
    it('offers recent and popular searches while the box is empty', () => {
      const wrapper = mountBox({ recent: ['etf'] })

      expect(groupsOf(wrapper).map((group) => group.title)).toEqual([
        'Recent searches',
        'Popular searches',
      ])
    })

    it('offers flagship funds while the box is empty', () => {
      const wrapper = mountBox({ flagshipFunds: [VAS] })

      expect(groupsOf(wrapper).map((group) => group.title)).toContain('Flagship funds')
    })

    it('asks for suggestions with the typed text', () => {
      const wrapper = mountBox()

      wrapper.getComponent(SearchInput).vm.$emit('complete', 'vas')

      expect(wrapper.emitted('complete')).toEqual([['vas']])
    })

    it('builds the dropdown for the typed text from the data it is given', async () => {
      const wrapper = mountBox({
        instruments: [VAS],
        kinds: [{ value: 'etf', count: 8 }],
      })

      wrapper.getComponent(SearchInput).vm.$emit('complete', 'vas')
      await wrapper.vm.$nextTick()

      expect(groupsOf(wrapper).map((group) => group.title)).toEqual([
        'Search for',
        'ETFs and shares',
      ])
    })
  })

  describe('searching', () => {
    it('searches for the trimmed text on submit', () => {
      const wrapper = mountBox()

      wrapper.getComponent(SearchInput).vm.$emit('submit', '  vas  ')

      expect(wrapper.emitted('search')).toEqual([[{ text: 'vas' }]])
    })

    it('searches with no text when the box is empty', () => {
      const wrapper = mountBox()

      wrapper.getComponent(SearchInput).vm.$emit('submit', '')

      expect(wrapper.emitted('search')).toEqual([[{ text: '' }]])
    })

    it('searches for a popular or recent term when it is picked, with no kind', () => {
      const wrapper = mountBox({ recent: ['etf'] })
      const [recent, popular] = groupsOf(wrapper)

      wrapper.getComponent(SearchInput).vm.$emit('select', recent!.items[0])
      wrapper.getComponent(SearchInput).vm.$emit('select', popular!.items[1])

      expect(wrapper.emitted('search')).toEqual([[{ text: 'etf' }], [{ text: 'gold' }]])
    })

    it('searches only ETFs or only shares when a scoped suggestion is picked', async () => {
      const wrapper = mountBox({ kinds: [{ value: 'share', count: 3 }] })
      wrapper.getComponent(SearchInput).vm.$emit('complete', 'bank')
      await wrapper.vm.$nextTick()

      const scope = groupsOf(wrapper)
        .find((group) => group.title === 'Search for')!
        .items.find((item) => item.key === 'scope:share')!
      wrapper.getComponent(SearchInput).vm.$emit('select', scope)

      expect(wrapper.emitted('search')).toEqual([[{ text: 'bank', kind: 'share' }]])
    })

    it('searches all kinds for the typed text when the first suggestion is picked', async () => {
      const wrapper = mountBox({ kinds: [{ value: 'etf', count: 8 }] })
      wrapper.getComponent(SearchInput).vm.$emit('complete', 'bank')
      await wrapper.vm.$nextTick()

      const all = groupsOf(wrapper).find((group) => group.title === 'Search for')!.items[0]!
      wrapper.getComponent(SearchInput).vm.$emit('select', all)

      expect(wrapper.emitted('search')).toEqual([[{ text: 'bank' }]])
    })

    it('reports the instrument, with its id and name, when a matching one is picked', async () => {
      const wrapper = mountBox({ instruments: [VAS] })
      wrapper.getComponent(SearchInput).vm.$emit('complete', 'vas')
      await wrapper.vm.$nextTick()

      const item = groupsOf(wrapper).find((group) => group.title === 'ETFs and shares')!.items[0]!
      wrapper.getComponent(SearchInput).vm.$emit('select', item)

      expect(wrapper.emitted('open')).toEqual([
        [{ id: 'VAS:AU', name: 'Vanguard Australian Shares' }],
      ])
      expect(wrapper.emitted('search')).toBeUndefined()
    })

    it('ignores a suggestion it does not know', () => {
      const wrapper = mountBox()

      wrapper
        .getComponent(SearchInput)
        .vm.$emit('select', { key: 'unknown', label: 'x', icon: 'item' })

      expect(wrapper.emitted('search')).toBeUndefined()
    })
  })
})
