import { api } from './api'

const apiRoot = () => (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

export function sharePreviewUrl(entityType, slug) {
  const encodedSlug = encodeURIComponent(slug)
  return `${apiRoot()}/api/${entityType}/${encodedSlug}/share-preview/`
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Clipboard access is unavailable')
}

export async function shareLink({ url, title, text }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      // Closing the native share sheet is not an error. Other share failures
      // fall through to copying so the button always has a useful outcome.
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }

  await copyText(url)
  return 'copied'
}
