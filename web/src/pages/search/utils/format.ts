import type { Kind } from '../../../types/search'
import { ISSUER_NAMES } from '../config'

export function issuerName(issuer: string): string {
  return ISSUER_NAMES[issuer] ?? humanise(issuer)
}

// "alliance_bernstein" becomes "Alliance Bernstein".
function humanise(id: string): string {
  return id
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function kindLabel(kind: Kind): string {
  return kind === 'etf' ? 'ETF' : 'Share'
}

export function kindPluralLabel(kind: Kind): string {
  return kind === 'etf' ? 'ETFs' : 'Shares'
}

/**
 * A short size for a number of shares, for example 1.67bn or 381m.
 */
export function formatUnits(units: number): string {
  if (units >= 1e9) return `${Number((units / 1e9).toFixed(2))}bn`
  if (units >= 1e6) return `${Math.round(units / 1e6)}m`
  return Math.round(units).toLocaleString('en-AU')
}
