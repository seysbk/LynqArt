import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

const EMPTY_SESSION = {
  user: null,
  accessToken: '',
  refreshToken: '',
  loading: true,
  error: '',
}

export function useSession() {
  const [session, setSession] = useState(() => {
    const accessToken = localStorage.getItem('lynqart_access_token') || ''
    const refreshToken = localStorage.getItem('lynqart_refresh_token') || ''
    return {
      ...EMPTY_SESSION,
      accessToken,
      refreshToken,
      loading: Boolean(accessToken),
    }
  })

  useEffect(() => {
    const accessToken = localStorage.getItem('lynqart_access_token') || ''
    const refreshToken = localStorage.getItem('lynqart_refresh_token') || ''

    if (!accessToken) {
      setAuthToken('')
      return
    }

    setAuthToken(accessToken)
    api
      .get('/accounts/profile/')
      .then(({ data }) => setSession({ user: data, accessToken, refreshToken, loading: false, error: '' }))
      .catch(() => {
        localStorage.removeItem('lynqart_access_token')
        localStorage.removeItem('lynqart_refresh_token')
        setAuthToken('')
        setSession({ ...EMPTY_SESSION, loading: false })
      })
  }, [])

  const signIn = async (credentials) => {
    const { data } = await api.post('/accounts/token/', credentials)
    localStorage.setItem('lynqart_access_token', data.access)
    localStorage.setItem('lynqart_refresh_token', data.refresh)
    setAuthToken(data.access)
    const profile = await api.get('/accounts/profile/')
    setSession({ user: profile.data, accessToken: data.access, refreshToken: data.refresh, loading: false, error: '' })
  }

  const signOut = () => {
    localStorage.removeItem('lynqart_access_token')
    localStorage.removeItem('lynqart_refresh_token')
    setAuthToken('')
    setSession({ ...EMPTY_SESSION, loading: false })
  }

  const register = async (payload) => {
    await api.post('/accounts/register/', payload)
    await signIn({ username: payload.username, password: payload.password })
  }

  return { ...session, signIn, signOut, register }
}
