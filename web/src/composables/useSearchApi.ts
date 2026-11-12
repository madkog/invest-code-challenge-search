import type {
  FacetCount,
  FacetKey,
  Filters,
  FlagKey,
  Instrument,
  Kind,
  SearchParams,
  SearchResponse,
  Sort,
  Suggestion,
} from '../types/search'
import { buildUrl, request } from '../utils/httpClient'

const BASE_URL = '/api'
const SUGGESTION_SIZE = 6

// --- The API's data format. Nothing outside this file should know about it. ---

interface ApiInstrument {
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
  // A numeric string, the way the API stores numbers.
  units_circulating: string | null
}

type ApiSuggestion = Pick<
  ApiInstrument,
  'symbol' | 'symbol_openfigi' | 'display_name' | 'kind' | 'issuer'
>

// The API sends every facet value as text, including "true" and "false" for yes/no filters.
interface ApiFacetCount {
  value: string
  count: number
}

interface ApiSearchResponse<T> {
  results: T[]
  count: number
  indexed_at: number
}

// The request body of POST /search and POST /facets/:key. Every key is optional.
interface ApiSearchQuery {
  search_text?: string
  kind?: string[]
  issuer?: string[]
  is_betashares?: { value: boolean }
  is_flagship_fund?: { value: boolean }
  is_auto_invest_included?: { value: boolean }
  order_by?: string
  from?: number
  size?: number
}

const API_FACET_KEYS: Record<FacetKey, string> = {
  kind: 'kind',
  issuer: 'issuer',
}

const API_KINDS: Record<Kind, string> = {
  etf: 'etf',
  share: 'equity',
}

const API_FLAG_KEYS = {
  isBetashares: 'is_betashares',
  isFlagshipFund: 'is_flagship_fund',
  isAutoInvestIncluded: 'is_auto_invest_included',
} as const satisfies Record<FlagKey, string>

const API_SORT_FIELDS: Record<Sort['field'], string> = {
  symbol: 'symbol',
  name: 'display_name',
  unitsCirculating: 'units_circulating',
}

const SUGGESTION_FIELDS = ['symbol', 'symbol_openfigi', 'display_name', 'kind', 'issuer']
const FLAGSHIP_SIZE = 4
const FLAG_FILTERS = ['isBetashares', 'isFlagshipFund', 'isAutoInvestIncluded'] as const

// --- Translating the app's params into the API's request body ---

// Missing filters, empty lists and unset (null) booleans are left out of the body.
function buildFilterQuery(filters: Partial<Filters>): ApiSearchQuery {
  const query: ApiSearchQuery = {}
  if (filters.kind?.length) query.kind = filters.kind.map((kind) => API_KINDS[kind])
  if (filters.issuer?.length) query.issuer = filters.issuer
  for (const key of FLAG_FILTERS) {
    const value = filters[key]
    if (value !== undefined && value !== null) query[API_FLAG_KEYS[key]] = { value }
  }
  return query
}

function buildSearchQuery({ text, filters, sort, page, size }: SearchParams): ApiSearchQuery {
  return {
    ...(text ? { search_text: text } : {}),
    ...(filters ? buildFilterQuery(filters) : {}),
    ...(sort ? { order_by: `${API_SORT_FIELDS[sort.field]}.${sort.direction}` } : {}),
    ...(page !== undefined ? { from: page } : {}),
    ...(size !== undefined ? { size } : {}),
  }
}

// --- Translating the API's responses into the app's types ---

// Anything that is not a share is treated as an ETF.
function toKind(apiKind: string): Kind {
  return apiKind === API_KINDS.share ? 'share' : 'etf'
}

function toInstrument(api: ApiInstrument): Instrument {
  return {
    id: api.symbol_openfigi,
    symbol: api.symbol,
    name: api.display_name,
    kind: toKind(api.kind),
    currency: api.currency,
    logoUrl: api.logo,
    issuer: api.issuer,
    isBetashares: api.is_betashares,
    isFlagshipFund: api.is_flagship_fund,
    isPortfolioExcluded: api.is_portfolio_excluded,
    isAutoInvestIncluded: api.is_auto_invest_included,
    unitsCirculating: api.units_circulating === null ? null : Number(api.units_circulating),
  }
}

function toSuggestion(api: ApiSuggestion): Suggestion {
  return {
    id: api.symbol_openfigi,
    symbol: api.symbol,
    name: api.display_name,
    kind: toKind(api.kind),
    issuer: api.issuer,
  }
}

// --- Requests ---

interface ApiOptions {
  signal?: AbortSignal
}

function endpoint(path: string, params?: Parameters<typeof buildUrl>[1]): string {
  return `${BASE_URL}${buildUrl(path, params)}`
}

// POST /search. `fields` limits which fields come back on each result.
function postSearch<T>(
  params: SearchParams,
  { fields, signal }: ApiOptions & { fields?: string[] } = {},
): Promise<ApiSearchResponse<T>> {
  const url = endpoint('/search', { fields: fields?.join(',') })
  return request(url, { method: 'POST', body: buildSearchQuery(params), signal })
}

/**
 * The only place that knows the search API: its endpoints, request body and data format.
 * Every function takes and returns the app's own types, and accepts an optional AbortSignal.
 */
export function useSearchApi() {
  async function search(
    params: SearchParams = {},
    { signal }: ApiOptions = {},
  ): Promise<SearchResponse<Instrument>> {
    const response = await postSearch<ApiInstrument>(params, { signal })
    return { results: response.results.map(toInstrument), count: response.count }
  }

  async function getSuggestions(
    text: string,
    { size = SUGGESTION_SIZE, signal }: ApiOptions & { size?: number } = {},
  ): Promise<SearchResponse<Suggestion>> {
    const response = await postSearch<ApiSuggestion>(
      { text, size },
      { fields: SUGGESTION_FIELDS, signal },
    )
    return { results: response.results.map(toSuggestion), count: response.count }
  }

  // The flagship funds, as suggestions for an empty search box.
  async function getFlagshipFunds({
    size = FLAGSHIP_SIZE,
    signal,
  }: ApiOptions & { size?: number } = {}): Promise<SearchResponse<Suggestion>> {
    const response = await postSearch<ApiSuggestion>(
      { filters: { isFlagshipFund: true }, size },
      { fields: SUGGESTION_FIELDS, signal },
    )
    return { results: response.results.map(toSuggestion), count: response.count }
  }

  // Filter options with counts, for the given text and filters.
  async function getFacetCounts(
    key: FacetKey,
    params: SearchParams = {},
    { omitEmptyCounts = false, signal }: ApiOptions & { omitEmptyCounts?: boolean } = {},
  ): Promise<FacetCount[]> {
    const url = endpoint(`/facets/${API_FACET_KEYS[key]}`, {
      omit_empty_counts: omitEmptyCounts ? 'true' : undefined,
    })
    const counts = await request<FacetCount[]>(url, {
      method: 'POST',
      body: buildSearchQuery(params),
      signal,
    })
    return key === 'kind'
      ? counts.map((entry) => ({ ...entry, value: toKind(entry.value) }))
      : counts
  }

  // How many results have a yes/no filter switched on, for the given text and filters.
  async function getFlagCount(
    key: FlagKey,
    params: SearchParams = {},
    { signal }: ApiOptions = {},
  ): Promise<number> {
    const url = endpoint(`/facets/${API_FLAG_KEYS[key]}`)
    const counts = await request<ApiFacetCount[]>(url, {
      method: 'POST',
      body: buildSearchQuery(params),
      signal,
    })
    return counts.find((entry) => entry.value === 'true')?.count ?? 0
  }

  async function getInstrument(id: string, { signal }: ApiOptions = {}): Promise<Instrument> {
    const url = endpoint(`/instruments/${encodeURIComponent(id)}`)
    return toInstrument(await request<ApiInstrument>(url, { signal }))
  }

  return { search, getSuggestions, getFlagshipFunds, getFacetCounts, getFlagCount, getInstrument }
}
