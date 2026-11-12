import type { Option } from '../../../types/ui'
import type { Sort } from '../../../types/search'

export type SortId = 'best' | 'symbol-asc' | 'symbol-desc' | 'name-asc' | 'units-desc'

const SORTS: Record<SortId, Sort | null> = {
  best: null,
  'symbol-asc': { field: 'symbol', direction: 'asc' },
  'symbol-desc': { field: 'symbol', direction: 'desc' },
  'name-asc': { field: 'name', direction: 'asc' },
  'units-desc': { field: 'unitsCirculating', direction: 'desc' },
}

export function sortFromId(id: SortId): Sort | null {
  return SORTS[id]
}

export function sortToId(sort: Sort | null): SortId {
  const match = (Object.keys(SORTS) as SortId[]).find((id) => {
    const candidate = SORTS[id]
    return candidate?.field === sort?.field && candidate?.direction === sort?.direction
  })
  return match ?? 'best'
}

// Without a search, "no sort" means Betashares funds first, not best match.
export function buildSortOptions(hasQuery: boolean): Option[] {
  return [
    { value: 'best', label: hasQuery ? 'Best match' : 'Betashares first' },
    { value: 'symbol-asc', label: 'Ticker A to Z' },
    { value: 'symbol-desc', label: 'Ticker Z to A' },
    { value: 'name-asc', label: 'Name A to Z' },
    { value: 'units-desc', label: 'Most shares on issue' },
  ]
}
