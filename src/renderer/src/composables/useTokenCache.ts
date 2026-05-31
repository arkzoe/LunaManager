export function useTokenCache() {
  let cachedSource: string | null = null
  let cachedToken: string | null = null
  let cachedVndbToken: string | null = null
  let cachedBangumiToken: string | null = null

  const invalidateTokenCache = (): void => {
    cachedSource = null
    cachedToken = null
    cachedVndbToken = null
    cachedBangumiToken = null
  }

  const ensureTokenCache = async (): Promise<{
    source: string
    token: string | null
    vndbToken: string | null
    bangumiToken: string | null
  }> => {
    if (cachedSource === null) {
      cachedSource = (await window.api.getConfig('metadataSource')) || 'bangumi'
      cachedBangumiToken = await window.api.getConfig('bangumiToken')
      cachedVndbToken = await window.api.getConfig('vndbApiKey')
      if (cachedSource === 'mixed') {
        cachedToken = cachedVndbToken || cachedBangumiToken || null
      } else {
        cachedToken = cachedSource === 'bangumi' ? cachedBangumiToken : cachedVndbToken
      }
    }
    return {
      source: cachedSource,
      token: cachedToken,
      vndbToken: cachedVndbToken,
      bangumiToken: cachedBangumiToken
    }
  }

  return { ensureTokenCache, invalidateTokenCache }
}
