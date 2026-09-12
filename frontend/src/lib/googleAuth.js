const GOOGLE_STATE_KEY = '__lynqartGoogleAuthState'

function getGoogleState() {
  if (!window[GOOGLE_STATE_KEY]) {
    window[GOOGLE_STATE_KEY] = {
      initialized: false,
      clientId: '',
      onCredential: null,
    }
  }
  return window[GOOGLE_STATE_KEY]
}

export function promptGoogleAuth(onCredential) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId || !window.google?.accounts?.id) {
    throw new Error('Google Sign-In is not configured for this site. Add a Google OAuth client ID to enable it.')
  }

  const state = getGoogleState()
  state.onCredential = onCredential

  if (!state.initialized) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => state.onCredential?.(response),
    })
    state.initialized = true
    state.clientId = clientId
  }

  if (state.clientId !== clientId) {
    throw new Error('Google Sign-In client configuration changed. Reload the page and try again.')
  }

  // Do not inspect prompt notification status methods here. Google is
  // deprecating those methods as FedCM becomes the default sign-in flow.
  window.google.accounts.id.prompt()
}
