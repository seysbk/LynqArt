import { useCallback } from 'react'

/**
 * Provides refetch utilities for shared data across the app
 * Each component can get and trigger refetches for different data types
 */
export function useDataRefresh() {
  // List of listeners for each data type
  // In a real app with React Query, this would be cache invalidation
  // For now, we provide a simple callback registration pattern

  const registerArtworksRefetchListener = useCallback((callback) => {
    // Store callback in a Map or Set in window object
    // This allows any component to trigger refetch of all artwork listeners
    if (!window.__artworksRefetchListeners) {
      window.__artworksRefetchListeners = new Set()
    }
    window.__artworksRefetchListeners.add(callback)
    return () => window.__artworksRefetchListeners.delete(callback)
  }, [])

  const registerExhibitionsRefetchListener = useCallback((callback) => {
    if (!window.__exhibitionsRefetchListeners) {
      window.__exhibitionsRefetchListeners = new Set()
    }
    window.__exhibitionsRefetchListeners.add(callback)
    return () => window.__exhibitionsRefetchListeners.delete(callback)
  }, [])

  const registerNotificationsRefetchListener = useCallback((callback) => {
    if (!window.__notificationsRefetchListeners) {
      window.__notificationsRefetchListeners = new Set()
    }
    window.__notificationsRefetchListeners.add(callback)
    return () => window.__notificationsRefetchListeners.delete(callback)
  }, [])

  const refetchAllArtworks = useCallback(() => {
    if (window.__artworksRefetchListeners) {
      window.__artworksRefetchListeners.forEach((callback) => {
        try {
          callback()
        } catch (err) {
          console.warn('Error refetching artworks:', err)
        }
      })
    }
  }, [])

  const refetchAllExhibitions = useCallback(() => {
    if (window.__exhibitionsRefetchListeners) {
      window.__exhibitionsRefetchListeners.forEach((callback) => {
        try {
          callback()
        } catch (err) {
          console.warn('Error refetching exhibitions:', err)
        }
      })
    }
  }, [])

  const refetchAllNotifications = useCallback(() => {
    if (window.__notificationsRefetchListeners) {
      window.__notificationsRefetchListeners.forEach((callback) => {
        try {
          callback()
        } catch (err) {
          console.warn('Error refetching notifications:', err)
        }
      })
    }
  }, [])

  return {
    registerArtworksRefetchListener,
    registerExhibitionsRefetchListener,
    registerNotificationsRefetchListener,
    refetchAllArtworks,
    refetchAllExhibitions,
    refetchAllNotifications,
  }
}
