import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

let refreshRequest = null

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = localStorage.getItem('lynqart_refresh_token')

    if (error.response?.status === 401 && refreshToken && !originalRequest?._retry && !originalRequest?.url?.includes('/accounts/token/refresh/')) {
      originalRequest._retry = true
      try {
        refreshRequest ||= axios.post(`${baseURL}/accounts/token/refresh/`, { refresh: refreshToken })
        const { data } = await refreshRequest
        refreshRequest = null
        localStorage.setItem('lynqart_access_token', data.access)
        if (data.refresh) localStorage.setItem('lynqart_refresh_token', data.refresh)
        setAuthToken(data.access)
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        refreshRequest = null
        localStorage.removeItem('lynqart_access_token')
        localStorage.removeItem('lynqart_refresh_token')
        setAuthToken('')
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('lynqart_access_token')
      localStorage.removeItem('lynqart_refresh_token')
      setAuthToken('')
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
