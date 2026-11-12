import type { FlagKey } from '../../types/search'

// Popular searches come from this list, because the API has no popularity data.
export const POPULAR_SEARCHES = [
  'bank',
  'gold',
  'nasdaq',
  'vanguard',
  'ethical',
  'mining',
  'hybrid',
  'bitcoin',
]

// Display names for the main issuers, by the ids the API uses. Any other issuer gets its id
// made readable, so wilson_asset_management shows as Wilson Asset Management.
export const ISSUER_NAMES: Record<string, string> = {
  betashares: 'Betashares',
  vanguard: 'Vanguard',
  blackrock: 'iShares (BlackRock)',
  state_street: 'SPDR (State Street)',
  vaneck: 'VanEck',
  globalx: 'Global X',
}

// The yes/no filters, in the order they are shown.
export const FLAG_FILTERS: { key: FlagKey; label: string }[] = [
  { key: 'isBetashares', label: 'Betashares funds' },
  { key: 'isFlagshipFund', label: 'Flagship funds' },
  { key: 'isAutoInvestIncluded', label: 'In Auto Invest' },
]

export const PAGE_SIZE_OPTIONS = [15, 30, 50]

// Skeleton rows only appear if loading takes longer than this, so quick searches don't flicker.
export const LOADING_DELAY_MS = 120
