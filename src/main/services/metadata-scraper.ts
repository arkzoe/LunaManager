import type { GameRecord, SearchResult } from '../../shared/types'
import { VndbApiClient } from './api/vndb-client'
import { BangumiApiClient } from './api/bangumi-client'

function getVndbClient(token?: string): VndbApiClient {
  return new VndbApiClient(token)
}

function getBangumiClient(token?: string): BangumiApiClient {
  return new BangumiApiClient(token)
}

/** 测试连接 */
export async function testApiConnection(
  source: 'vndb' | 'bangumi',
  token?: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const ok = source === 'vndb'
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
  if (source === 'vndb') {
    return getVndbClient(apiKey).searchVN(query)
  } else {
    return getBangumiClient(apiKey).searchSubjects(query)
  }
}

/** 获取完整详情（含标签提取 + 评分归一化） */
export async function fetchMetadataDetail(
  sourceId: string,
  source: 'vndb' | 'bangumi',
  apiKey?: string
): Promise<Partial<GameRecord>> {
  const detail = source === 'vndb'
    ? await getVndbClient(apiKey).getVNDetail(sourceId)
    : await getBangumiClient(apiKey).getSubjectDetail(sourceId)

  return detail
}
