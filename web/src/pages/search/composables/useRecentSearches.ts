import { ref } from 'vue'

const STORAGE_KEY = 'fund-search-recent'
const MAX_SEARCHES = 5

// Storage can be missing, full or blocked, and then recent searches just are not kept.
function load(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved)
      ? saved.filter((item): item is string => typeof item === 'string').slice(0, MAX_SEARCHES)
      : []
  } catch {
    return []
  }
}

function save(searches: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // Not being able to save is fine.
  }
}

/**
 * The last few searches, newest first, kept in localStorage.
 */
export function useRecentSearches() {
  const searches = ref<string[]>(load())

  function add(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    searches.value = [trimmed, ...searches.value.filter((item) => item !== trimmed)].slice(
      0,
      MAX_SEARCHES,
    )
    save(searches.value)
  }

  return { searches, add }
}
