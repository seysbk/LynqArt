import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Axios response interceptor: If a request fails with 401 Unauthorized, clear stored tokens and auth header
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lynqart_access_token')
      localStorage.removeItem('lynqart_refresh_token')
      delete api.defaults.headers.common.Authorization
    }
    return Promise.reject(error)
  }
)

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function mediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiHost = import.meta.env.VITE_API_HOST || 'http://localhost:8000'
  return `${apiHost}${url.startsWith('/') ? '' : '/'}${url}`
}
