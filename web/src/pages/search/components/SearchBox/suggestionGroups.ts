import type { FacetCount, Kind, Suggestion } from '../../../../types/search'
import type { SuggestionGroup, SuggestionOption } from '../../../../types/ui'
import { issuerName, kindLabel, kindPluralLabel } from '../../utils/format'

// What happens when a suggestion is picked.
export type SuggestionAction =
  { type: 'search'; text: string; kind?: Kind } | { type: 'item'; id: string; name: string }

export interface SuggestionModel {
  groups: SuggestionGroup[]
  // The action for each option, by the option's key.
  actions: Map<string, SuggestionAction>
}

interface SuggestionInput {
  // The text the suggestions are for. Empty when the box is focused with nothing typed.
  text: string
  recent: string[]
  popular: string[]
  flagshipFunds: Suggestion[]
  instruments: Suggestion[]
  kinds: FacetCount[]
}

const RECENT_SHOWN = 3
const POPULAR_SHOWN = 4
const POPULAR_MATCHES_SHOWN = 3

function termOptions(
  terms: string[],
  icon: 'recent' | 'popular',
  actions: Map<string, SuggestionAction>,
): SuggestionOption[] {
  return terms.map((term) => {
    const key = `${icon}:${term}`
    actions.set(key, { type: 'search', text: term })
    return { key, label: term, icon }
  })
}

// ETFs show their issuer, shares just say they are a share.
function itemMeta(item: Suggestion): string {
  if (item.kind === 'share') return kindLabel('share')
  if (item.issuer) return issuerName(item.issuer)
  return kindLabel('etf')
}

function itemOption(item: Suggestion, actions: Map<string, SuggestionAction>): SuggestionOption {
  const key = `item:${item.symbol}`
  actions.set(key, { type: 'item', id: item.id, name: item.name })
  return { key, label: item.name, icon: 'item', badge: item.symbol, meta: itemMeta(item) }
}

// Searching for the text, in everything or in only ETFs or only shares.
function scopeOption(
  text: string,
  kind: Kind | null,
  count: number,
  actions: Map<string, SuggestionAction>,
): SuggestionOption {
  const key = `scope:${kind ?? 'all'}`
  actions.set(key, kind ? { type: 'search', text, kind } : { type: 'search', text })
  return kind
    ? { key, label: `${text} in ${kindPluralLabel(kind)}`, icon: 'search', meta: String(count) }
    : { key, label: text, icon: 'search', meta: `All results · ${count}` }
}

// With nothing typed: recent and popular searches, and flagship funds.
function emptyBoxGroups(input: SuggestionInput, actions: Map<string, SuggestionAction>) {
  const groups: SuggestionGroup[] = []
  if (input.recent.length) {
    groups.push({
      title: 'Recent searches',
      items: termOptions(input.recent.slice(0, RECENT_SHOWN), 'recent', actions),
    })
  }
  groups.push({
    title: 'Popular searches',
    items: termOptions(input.popular.slice(0, POPULAR_SHOWN), 'popular', actions),
  })
  if (input.flagshipFunds.length) {
    groups.push({
      title: 'Flagship funds',
      items: input.flagshipFunds.map((fund) => itemOption(fund, actions)),
    })
  }
  return groups
}

// With text typed: search for it (all, or only ETFs or shares), the matching ETFs and shares,
// and popular searches that contain it.
function typedTextGroups(
  text: string,
  input: SuggestionInput,
  actions: Map<string, SuggestionAction>,
) {
  const groups: SuggestionGroup[] = []

  const total = input.kinds.reduce((sum, entry) => sum + entry.count, 0)
  if (total > 0) {
    groups.push({
      title: 'Search for',
      items: [
        scopeOption(text, null, total, actions),
        ...input.kinds.map((entry) => scopeOption(text, entry.value as Kind, entry.count, actions)),
      ],
    })
  }

  if (input.instruments.length) {
    groups.push({
      title: 'ETFs and shares',
      items: input.instruments.map((item) => itemOption(item, actions)),
    })
  }

  const lower = text.toLowerCase()
  const matchingPopular = input.popular
    .filter((term) => term.includes(lower) && term !== lower)
    .slice(0, POPULAR_MATCHES_SHOWN)
  if (matchingPopular.length) {
    groups.push({
      title: 'Popular searches',
      items: termOptions(matchingPopular, 'popular', actions),
    })
  }

  return groups
}

/**
 * Builds the suggestion dropdown, and the action for each suggestion.
 */
export function buildSuggestionGroups(input: SuggestionInput): SuggestionModel {
  const actions = new Map<string, SuggestionAction>()
  const text = input.text.trim()
  const groups = text ? typedTextGroups(text, input, actions) : emptyBoxGroups(input, actions)
  return { groups, actions }
}
