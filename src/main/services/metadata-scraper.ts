import type { GameRecord, SearchResult } from '../../shared/types'
import { VndbApiClient } from './api/vndb-client'
import { BangumiApiClient } from './api/bangumi-client'

interface CacheEntry<T> {
  data: T
  expiry: number
}
const searchCache = new Map<string, CacheEntry<SearchResult[]>>()
const detailCache = new Map<string, CacheEntry<Partial<GameRecord>>>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX = 200

// 请求去重：正在进行中的请求复用同一个 Promise，避免并发重复请求
const pendingSearch = new Map<string, Promise<SearchResult[]>>()
const pendingDetail = new Map<string, Promise<Partial<GameRecord>>>()

let cachedVndbClient: VndbApiClient | null = null
let lastVndbToken: string | undefined
let cachedBangumiClient: BangumiApiClient | null = null
let lastBangumiToken: string | undefined

function getVndbClient(token?: string): VndbApiClient {
  if (!cachedVndbClient || lastVndbToken !== token) {
    cachedVndbClient = new VndbApiClient(token)
    lastVndbToken = token
  }
  return cachedVndbClient
}

function getBangumiClient(token?: string): BangumiApiClient {
  if (!cachedBangumiClient || lastBangumiToken !== token) {
    cachedBangumiClient = new BangumiApiClient(token)
    lastBangumiToken = token
  }
  return cachedBangumiClient
}

function trimCache(map: Map<string, any>): void {
  if (map.size > CACHE_MAX) {
    const iter = map.keys()
    let toDelete = map.size - CACHE_MAX
    while (toDelete-- > 0) {
      const { value, done } = iter.next()
      if (done) break
      map.delete(value)
    }
  }
}

/** 测试连接 */
export async function testApiConnection(
  source: 'vndb' | 'bangumi',
  token?: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const ok =
      source === 'vndb'
        ? await getVndbClient(token).testConnection()
        : await getBangumiClient(token).testConnection()
    if (ok) {
      const label = source === 'vndb' ? 'VNDB' : 'Bangumi'
      return { ok: true, message: `${label} 连接成功` }
    }
    return { ok: false, message: '连接失败，请检查 API Key / Token' }
  } catch (err: any) {
    return { ok: false, message: err.message || '连接失败' }
  }
}

/** 搜索元数据 */
export async function searchMetadata(
  query: string,
  source: 'vndb' | 'bangumi',
  apiKey?: string
): Promise<SearchResult[]> {
  const cacheKey = `${source}:${query}:${apiKey || ''}`

  // 结果缓存命中
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.data

  // 请求去重：并发相同请求复用同一个 Promise
  const pending = pendingSearch.get(cacheKey)
  if (pending) return pending

  const promise = (async () => {
    const data =
      source === 'vndb'
        ? await getVndbClient(apiKey).searchVN(query)
        : await getBangumiClient(apiKey).searchSubjects(query)

    searchCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL })
    trimCache(searchCache)
    return data
  })()

  pendingSearch.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    pendingSearch.delete(cacheKey)
  }
}

/** 获取完整详情（含标签提取 + 评分归一化） */
export async function fetchMetadataDetail(
  sourceId: string,
  source: 'vndb' | 'bangumi',
  apiKey?: string
): Promise<Partial<GameRecord>> {
  const cacheKey = `${source}:${sourceId}:${apiKey || ''}`

  // 结果缓存命中
  const cached = detailCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.data

  // 请求去重：并发相同请求复用同一个 Promise
  const pending = pendingDetail.get(cacheKey)
  if (pending) return pending

  const promise = (async () => {
    const detail =
      source === 'vndb'
        ? await getVndbClient(apiKey).getVNDetail(sourceId)
        : await getBangumiClient(apiKey).getSubjectDetail(sourceId)

    detailCache.set(cacheKey, { data: detail, expiry: Date.now() + CACHE_TTL })
    trimCache(detailCache)
    return detail
  })()

  pendingDetail.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    pendingDetail.delete(cacheKey)
  }
}
