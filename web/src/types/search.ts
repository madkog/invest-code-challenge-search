export interface Instrument {
  symbol: string
  symbol_openfigi: string
  display_name: string
  kind: string
  currency: string
  logo: string | null
  issuer: string | null
  is_betashares: boolean
  is_flagship_fund: boolean
  is_portfolio_excluded: boolean
  is_auto_invest_included: boolean
  units_circulating: string | null
}

export type Suggestion = Pick<Instrument, 'symbol' | 'display_name'>

// The filters the user has chosen. This is the app's own state, not the API's request format.
export interface Filters {
  kind: string[]
  issuer: string[]
  // null means the user has not chosen.
  is_betashares: boolean | null
  is_flagship_fund: boolean | null
}

// What the app asks the API for. The API composable turns this into the request body.
export interface SearchParams {
  text?: string
  filters?: Filters
  // "field", "field.asc" or "field.desc". Empty means ranked by relevance.
  sort?: string
  // Page number, starting at 1.
  page?: number
  size?: number
}

export interface SearchResponse<T = Instrument> {
  results: T[]
  count: number
  indexed_at: number
}

export interface FacetCount {
  value: string
  count: number
}
