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

function itemOption(item: Suggestion, actions: Map<string, SuggestionAction>): SuggestionOption {
  const key = `item:${item.symbol}`
  actions.set(key, { type: 'item', id: item.id, name: item.name })
  const meta =
    item.kind === 'etf'
      ? item.issuer
        ? issuerName(item.issuer)
        : kindLabel('etf')
      : kindLabel('share')
  return { key, label: item.name, icon: 'item', badge: item.symbol, meta }
}

/**
 * Builds the suggestion dropdown. With nothing typed it offers recent and popular searches and
 * flagship funds. With text typed it offers searching for the text (all, or only ETFs or shares),
 * the matching ETFs and shares, and popular searches that contain the text.
 */
export function buildSuggestionGroups(input: SuggestionInput): SuggestionModel {
  const actions = new Map<string, SuggestionAction>()
  const groups: SuggestionGroup[] = []
  const text = input.text.trim()

  if (!text) {
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
    return { groups, actions }
  }

  const total = input.kinds.reduce((sum, entry) => sum + entry.count, 0)
  if (total > 0) {
    const items: SuggestionOption[] = [
      { key: 'scope:all', label: text, icon: 'search', meta: `All results · ${total}` },
      ...input.kinds.map((entry) => ({
        key: `scope:${entry.value}`,
        label: `${text} in ${kindPluralLabel(entry.value as Kind)}`,
        icon: 'search' as const,
        meta: String(entry.count),
      })),
    ]
    actions.set('scope:all', { type: 'search', text })
    for (const entry of input.kinds) {
      actions.set(`scope:${entry.value}`, { type: 'search', text, kind: entry.value as Kind })
    }
    groups.push({ title: 'Search for', items })
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

  return { groups, actions }
}
