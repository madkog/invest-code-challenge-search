import { getCurrentScope, onScopeDispose, watch, type Ref } from 'vue'

/**
 * Lets the browser's back action close something that covers the page, such as a drawer.
 * On a phone that is the back button or the swipe-back gesture, which would otherwise leave the
 * site. Opening adds a history entry, going back closes it, and closing another way removes the
 * entry again so the history stays as it was.
 */
export function useCloseOnBack(isOpen: Ref<boolean>, close: () => void) {
  // True while the history entry this added is still there.
  let hasEntry = false

  function onBack() {
    if (!hasEntry) return
    hasEntry = false
    close()
  }

  watch(isOpen, (open) => {
    if (open && !hasEntry) {
      history.pushState({ closeOnBack: true }, '')
      hasEntry = true
    } else if (!open && hasEntry) {
      // Closed with its own button, so remove the entry that was added.
      hasEntry = false
      history.back()
    }
  })

  window.addEventListener('popstate', onBack)
  if (getCurrentScope()) onScopeDispose(() => window.removeEventListener('popstate', onBack))
}
