import type { Instrument, Suggestion } from '../types/search'

// Sample data for stories, shaped like the app's own types.

export const A200: Instrument = {
  id: 'A200:AU',
  symbol: 'A200',
  name: 'Betashares Australia 200 ETF',
  kind: 'etf',
  currency: 'AUD',
  logoUrl: null,
  issuer: 'betashares',
  isBetashares: true,
  isFlagshipFund: true,
  isPortfolioExcluded: false,
  isAutoInvestIncluded: true,
  unitsCirculating: null,
}

export const VAS: Instrument = {
  ...A200,
  id: 'VAS:AU',
  symbol: 'VAS',
  name: 'Vanguard Australian Shares Index ETF',
  issuer: 'vanguard',
  isBetashares: false,
  isFlagshipFund: false,
  isAutoInvestIncluded: false,
}

export const CBA: Instrument = {
  ...A200,
  id: 'CBA:AU',
  symbol: 'CBA',
  name: 'Commonwealth Bank of Australia',
  kind: 'share',
  issuer: null,
  isBetashares: false,
  isFlagshipFund: false,
  isPortfolioExcluded: true,
  isAutoInvestIncluded: false,
  unitsCirculating: 1_673_000_000,
}

export const LONG_NAME: Instrument = {
  ...A200,
  id: 'QAU:AU',
  symbol: 'QAU',
  name: 'Betashares Gold Bullion ETF - Currency Hedged (Complex ETF)',
  isFlagshipFund: false,
}

export function toSuggestion(instrument: Instrument): Suggestion {
  const { id, symbol, name, kind, issuer } = instrument
  return { id, symbol, name, kind, issuer }
}

export const POPULAR = ['bank', 'gold', 'nasdaq', 'vanguard', 'ethical', 'mining']

// A small logo, so stories need no network.
export const LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#FC4D16"/><path d="M13 13h14v14H13z" fill="#fff"/></svg>',
  )
