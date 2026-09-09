import { useEffect } from 'react'

/**
 * Hook to refetch data when the browser window regains focus
 * @param {Function} refetchFn - Async function to call when window regains focus
 * @param {boolean} enabled - Whether to enable the hook (default: true)
 */
export function useRefetchOnFocus(refetchFn, enabled = true) {
  useEffect(() => {
    if (!enabled || !refetchFn) return

    const handleFocus = () => {
      refetchFn()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchFn, enabled])
}
