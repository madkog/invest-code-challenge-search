/**
 * The app's own types for search. They use the app's names and formats, not the API's.
 * Only useSearchApi translates between the two.
 */

export interface Instrument {
  id: string
  symbol: string
  name: string
  kind: string
  currency: string
  logoUrl: string | null
  issuer: string | null
  isBetashares: boolean
  isFlagshipFund: boolean
  isPortfolioExcluded: boolean
  isAutoInvestIncluded: boolean
  unitsCirculating: number | null
}

// The light result used for suggestions.
export type Suggestion = Pick<Instrument, 'symbol' | 'name'>

// The filters the user has chosen.
export interface Filters {
  kind: string[]
  issuer: string[]
  // null means the user has not chosen.
  isBetashares: boolean | null
  isFlagshipFund: boolean | null
}

// A filter that has options with counts.
export type FacetKey = 'kind' | 'issuer'

// A yes/no filter. Its count is how many results have it switched on.
export type FlagKey = 'isBetashares' | 'isFlagshipFund'

export type SortField = 'symbol' | 'name'

export interface Sort {
  field: SortField
  direction: 'asc' | 'desc'
}

// What the app asks for. Everything is optional.
export interface SearchParams {
  text?: string
  filters?: Filters
  // null or undefined means ranked by relevance.
  sort?: Sort | null
  // Page number, starting at 1.
  page?: number
  size?: number
}

export interface SearchResponse<T = Instrument> {
  results: T[]
  // Total matches before pagination.
  count: number
}

export interface FacetCount {
  value: string
  count: number
}
