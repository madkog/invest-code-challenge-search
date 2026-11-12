import { describe, it, expect } from 'vitest'

import { buildSortOptions, sortFromId, sortToId, type SortId } from '../sortOptions'

describe('sort options', () => {
  it('turns each id into a sort, with best match meaning no sort', () => {
    expect(sortFromId('best')).toBeNull()
    expect(sortFromId('symbol-asc')).toEqual({ field: 'symbol', direction: 'asc' })
    expect(sortFromId('name-asc')).toEqual({ field: 'name', direction: 'asc' })
    expect(sortFromId('units-desc')).toEqual({ field: 'unitsCirculating', direction: 'desc' })
  })

  it('turns a sort back into its id', () => {
    const ids: SortId[] = ['best', 'symbol-asc', 'symbol-desc', 'name-asc', 'units-desc']

    for (const id of ids) {
      expect(sortToId(sortFromId(id))).toBe(id)
    }
  })

  it('treats an unknown sort as best match', () => {
    expect(sortToId({ field: 'name', direction: 'desc' })).toBe('best')
  })

  it('offers shares on issue normally', () => {
    const units = buildSortOptions(false).find((option) => option.value === 'units-desc')!

    expect(units.label).toBe('Most shares on issue')
    expect(units.disabled).toBe(false)
  })

  it('disables shares on issue, and says why, when only ETFs are shown', () => {
    const options = buildSortOptions(false, true)
    const units = options.find((option) => option.value === 'units-desc')!

    expect(units.label).toBe('Most shares on issue (shares only)')
    expect(units.disabled).toBe(true)
    expect(options.filter((option) => option.disabled)).toHaveLength(1)
  })

  it('offers the same five sorts, and names the first one by whether there is a search', () => {
    expect(buildSortOptions(true).map((option) => option.value)).toEqual([
      'best',
      'symbol-asc',
      'symbol-desc',
      'name-asc',
      'units-desc',
    ])
    expect(buildSortOptions(true)[0]!.label).toBe('Best match')
    expect(buildSortOptions(false)[0]!.label).toBe('Betashares first')
  })
})
