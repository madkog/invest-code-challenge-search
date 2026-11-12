export interface TextPart {
  text: string
  match: boolean
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Splits text into parts, marking the parts that match any of the terms (ignoring case).
 */
export function splitMatches(text: string, terms: string[]): TextPart[] {
  const cleaned = terms
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  if (!text) return []
  if (cleaned.length === 0) return [{ text, match: false }]

  const pattern = new RegExp(`(${cleaned.map(escapeRegExp).join('|')})`, 'gi')
  // With one capture group, the odd positions are the matches.
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text !== '')
}

/**
 * The words of a search, for highlighting. "OR" between words is not a word to highlight.
 */
export function searchTerms(search: string): string[] {
  return search
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word !== '' && word !== 'OR')
}
