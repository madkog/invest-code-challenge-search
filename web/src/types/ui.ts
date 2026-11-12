/**
 * Plain data shapes the generic components take as props. They know nothing about the search.
 */

// A choice in a filter or sort control. `count` is how many results it would give.
export interface Option {
  value: string
  label: string
  count?: number
}

export interface SuggestionOption {
  key: string
  label: string
  icon: 'recent' | 'popular' | 'search' | 'item'
  // A short code shown before the label, such as a ticker.
  badge?: string
  // Small text shown after the label.
  meta?: string
}

export interface SuggestionGroup {
  title: string
  items: SuggestionOption[]
}

// A removable chip for an applied filter.
export interface FilterChip {
  key: string
  label: string
}
