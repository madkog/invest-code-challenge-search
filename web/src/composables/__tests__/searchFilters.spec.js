import { describe, it, expect } from 'vitest'

import { createEmptyFilters, buildFilterQuery } from '../searchFilters'

describe('createEmptyFilters', () => {
  it('has empty lists and unset booleans', () => {
    expect(createEmptyFilters()).toEqual({
      kind: [],
      issuer: [],
      is_betashares: null,
      is_flagship_fund: null,
    })
  })

  it('returns a new object each time', () => {
    expect(createEmptyFilters()).not.toBe(createEmptyFilters())
  })
})

describe('buildFilterQuery', () => {
  it('is empty when no filter is set', () => {
    expect(buildFilterQuery(createEmptyFilters())).toEqual({})
  })

  it('sends multi-select filters as lists', () => {
    const filters = { ...createEmptyFilters(), kind: ['etf'], issuer: ['betashares', 'vaneck'] }

    expect(buildFilterQuery(filters)).toEqual({
      kind: ['etf'],
      issuer: ['betashares', 'vaneck'],
    })
  })

  it('sends booleans as { value } and keeps false', () => {
    const filters = { ...createEmptyFilters(), is_betashares: true, is_flagship_fund: false }

    expect(buildFilterQuery(filters)).toEqual({
      is_betashares: { value: true },
      is_flagship_fund: { value: false },
    })
  })

  it('leaves out empty lists and unset booleans', () => {
    const filters = { ...createEmptyFilters(), kind: ['etf'] }

    expect(buildFilterQuery(filters)).toEqual({ kind: ['etf'] })
  })
})
