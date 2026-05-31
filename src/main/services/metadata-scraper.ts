import Fuse, { type IFuseOptions } from 'fuse.js'
import type { GameRecord, SearchResult, MatchedRow } from '../../shared/types'
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

// ===== 模糊匹配引擎 =====

const RE_VERSION_TAG = /[[(][^)\]]*?(?:v[\d.]+|ver[\s.]?[\d.]+|version)[^)\]]*?[\])]/gi
const RE_LANG_TAG = /[[(][A-Za-z]{2,8}[)\]]/g
const RE_SPECIAL_CHARS = /[_ ]+/g
const RE_WHITESPACE = /\s+/g

function cleanQuery(query: string): string {
  return query
    .replace(RE_VERSION_TAG, '')
    .replace(RE_LANG_TAG, '')
    .replace(RE_SPECIAL_CHARS, ' ')
    .replace(RE_WHITESPACE, ' ')
    .trim()
}

const FUSE_OPTIONS: IFuseOptions<SearchResult> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'titleCn', weight: 1 }
  ],
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  distance: 100
}

const FUSE_CACHE_MAX = 3
const fuseCache = new Map<string, Fuse<SearchResult>>()

function getFuse(results: SearchResult[]): Fuse<SearchResult> {
  const key = results.map((r) => r.id).join(',')
  const cached = fuseCache.get(key)
  if (cached) {
    // LRU: move to end by re-inserting
    fuseCache.delete(key)
    fuseCache.set(key, cached)
    return cached
  }

  const fuse = new Fuse(results, FUSE_OPTIONS)
  fuseCache.set(key, fuse)

  // Evict oldest if over capacity
  if (fuseCache.size > FUSE_CACHE_MAX) {
    const firstKey = fuseCache.keys().next().value
    if (firstKey) fuseCache.delete(firstKey)
  }

  return fuse
}

const AUTO_MATCH_THRESHOLD = 0.35
const REJECT_THRESHOLD = 0.5

export function pickBestMatch(
  query: string,
  results: SearchResult[],
  threshold = AUTO_MATCH_THRESHOLD
): SearchResult | null {
  const cleaned = cleanQuery(query)
  if (!cleaned || results.length === 0) return null

  if (results.length === 1) return results[0]

  const fuse = getFuse(results)
  const scored = fuse.search(cleaned)
  if (scored.length === 0) return null

  const best = scored[0]
  const score = best.score ?? 1

  if (score < threshold) return best.item

  return null
}

export function sortByMatch(query: string, results: SearchResult[]): SearchResult[] {
  const cleaned = cleanQuery(query)
  if (!cleaned || results.length <= 1) return results

  const fuse = getFuse(results)
  return fuse.search(cleaned).map((r) => r.item)
}

/** 从 fetchMetadataDetail 返回的 detail 中提取 MatchedRow 字段 */
function extractMatchedFields(
  detail: Partial<GameRecord>
): Pick<MatchedRow, 'title' | 'developer' | 'releaseDate' | 'description' | 'customTags'> {
  return {
    title: detail.title || '',
    developer: detail.developer,
    releaseDate: detail.release_date,
    description: detail.description,
    customTags: detail.custom_tags
  }
}

/** 批量匹配：单次 IPC 完成搜索 + 模糊匹配 + 详情获取（替代 N*2 次 IPC） */
export async function batchMatch(params: {
  rows: { query: string; title?: string; folderName?: string }[]
  source: string
  vndbToken?: string
  bangumiToken?: string
}): Promise<MatchedRow[]> {
  const { rows, source, vndbToken, bangumiToken } = params
  const concurrency = 4

  // 按索引存储以保证结果顺序与输入一致
  const results: { index: number; data: MatchedRow }[] = []

  const processOne = async (row: { query: string }, rowIndex: number): Promise<void> => {
    try {
      // 根据 source 选择数据源搜索
      let allResults: SearchResult[] = []

      if (source === 'mixed') {
        const tasks: Promise<SearchResult[]>[] = []
        if (vndbToken) tasks.push(searchMetadata(row.query, 'vndb', vndbToken))
        if (bangumiToken) tasks.push(searchMetadata(row.query, 'bangumi', bangumiToken))
        const settled = await Promise.allSettled(tasks)
        for (const r of settled) {
          if (r.status === 'fulfilled') allResults.push(...r.value)
        }
      } else {
        const token = source === 'bangumi' ? bangumiToken : vndbToken
        allResults = await searchMetadata(row.query, source as 'vndb' | 'bangumi', token)
      }

      const best = pickBestMatch(row.query, allResults, REJECT_THRESHOLD)
      if (best && best.id) {
        const fetchToken = best.source === 'bangumi' ? bangumiToken : vndbToken
        const detail = await fetchMetadataDetail(best.id, best.source, fetchToken)
        const fields = extractMatchedFields(detail)

        const { title: _detailTitle, releaseDate: _detailDate, ...restFields } = fields
        results.push({
          index: rowIndex,
          data: {
            query: row.query,
            title: best.titleCn || best.title || _detailTitle || row.query,
            bangumiId: best.source === 'bangumi' ? best.id : undefined,
            vndbId: best.source === 'vndb' ? best.id : undefined,
            cover: best.cover,
            releaseDate: best.date || _detailDate,
            ...restFields
          }
        })
        return
      }
    } catch {
      // 单行失败不影响整体
    }
    results.push({ index: rowIndex, data: { query: row.query, title: row.query } })
  }

  // 并发池实现
  let idx = 0
  const workers: Promise<void>[] = []
  for (let i = 0; i < concurrency && i < rows.length; i++) {
    workers.push(
      (async () => {
        while (idx < rows.length) {
          const current = idx++
          await processOne(rows[current], current)
        }
      })()
    )
  }
  await Promise.allSettled(workers)

  // 恢复原始顺序
  return results.sort((a, b) => a.index - b.index).map((r) => r.data)
}
