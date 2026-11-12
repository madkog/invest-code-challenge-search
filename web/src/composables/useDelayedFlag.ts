import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * A flag that follows `source`, but only turns on after `source` has been on for `delay` ms.
 * It turns off straight away. Used so a loading state does not flash for a fast request.
 */
export function useDelayedFlag(source: () => boolean, delay: number): Ref<boolean> {
  const delayed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(
    source,
    (active) => {
      clearTimeout(timer)
      if (!active) {
        delayed.value = false
        return
      }
      timer = setTimeout(() => {
        delayed.value = true
      }, delay)
    },
    { immediate: true },
  )

  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  return delayed
}
