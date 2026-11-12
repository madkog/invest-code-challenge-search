const MULTI_SELECT_FILTERS = ['kind', 'issuer']
const BOOLEAN_FILTERS = ['is_betashares', 'is_flagship_fund']

export function createEmptyFilters() {
  return { kind: [], issuer: [], is_betashares: null, is_flagship_fund: null }
}

/**
 * Turns the filter state into the filter keys of a search request.
 * Empty lists and unset (null) booleans are left out.
 */
export function buildFilterQuery(filters) {
  const query = {}
  for (const key of MULTI_SELECT_FILTERS) {
    if (filters[key].length > 0) query[key] = filters[key]
  }
  for (const key of BOOLEAN_FILTERS) {
    if (filters[key] !== null) query[key] = { value: filters[key] }
  }
  return query
}
