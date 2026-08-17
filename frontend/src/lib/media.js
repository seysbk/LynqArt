import { api } from './api'

export const mediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return `${api.defaults.baseURL.replace(/\/api$/, '')}${url}`
}