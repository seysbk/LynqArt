function normalizeMessage(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (!responseData) {
    return fallbackMessage
  }

  if (typeof responseData.detail === 'string' && responseData.detail.trim()) {
    return responseData.detail
  }

  const fieldMessages = Object.entries(responseData)
    .filter(([key]) => key !== 'detail')
    .flatMap(([, value]) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return [value]
      return []
    })
    .map(normalizeMessage)
    .filter(Boolean)

  if (fieldMessages.length > 0) {
    return fieldMessages[0]
  }

  return fallbackMessage
}
