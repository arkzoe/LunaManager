export function useTokenCache() {
  let cachedSource: 'vndb' | 'bangumi' | null = null
  let cachedToken: string | null = null

  const invalidateTokenCache = (): void => {
    cachedSource = null
    cachedToken = null
  }

  const ensureTokenCache = async (): Promise<{
    source: 'vndb' | 'bangumi'
    token: string | null
  }> => {
    if (cachedSource === null) {
      cachedSource = (await window.api.getConfig('metadataSource')) || 'vndb'
    }
    if (cachedToken === null) {
      cachedToken =
        cachedSource === 'bangumi'
          ? await window.api.getConfig('bangumiToken')
          : await window.api.getConfig('vndbApiKey')
    }
    return { source: cachedSource, token: cachedToken }
  }

  return { ensureTokenCache, invalidateTokenCache }
}
