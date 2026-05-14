import { buildUserAgent, safeFetch } from './base-client'
import type { GameRecord, SearchResult } from '../../../shared/types'

const BGM_API = 'https://api.bgm.tv'

export class BangumiApiClient {
  private token: string
  private userAgent: string

  constructor(token?: string) {
    this.token = token || ''
    this.userAgent = buildUserAgent()
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent
    }
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`
    }
    return h
  }

  async testConnection(): Promise<boolean> {
    try {
      await safeFetch(() =>
        fetch(`${BGM_API}/v0/me`, {
          method: 'GET',
          headers: this.headers()
        })
      )
      return true
    } catch {
      return false
    }
  }

  async searchSubjects(
    keyword: string,
    filter?: { type?: number[]; tag?: string[]; nsfw?: boolean }
  ): Promise<SearchResult[]> {
    const body: Record<string, unknown> = {
      keyword,
      filter: {
        type: filter?.type ?? [4],
        ...(filter?.tag ? { tag: filter.tag } : {}),
        ...(filter?.nsfw !== undefined ? { nsfw: filter.nsfw } : {})
      }
    }

    const data = await safeFetch<any>(() =>
      fetch(`${BGM_API}/v0/search/subjects`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body)
      })
    )

    return (data.data || []).map((item: any) => ({
      id: String(item.id),
      title: item.name || '',
      titleCn: item.name_cn || '',
      cover: item.images?.large || item.images?.common || '',
      date: item.date || '',
      rating: item.rating?.score || 0,
      source: 'bangumi' as const
    }))
  }

  async getSubjectDetail(subjectId: string): Promise<Partial<GameRecord>> {
    const data = await safeFetch<any>(() =>
      fetch(`${BGM_API}/v0/subjects/${subjectId}`, {
        method: 'GET',
        headers: this.headers()
      })
    )

    if (!data || !data.id) throw { code: 'NOT_FOUND' as const, message: `未找到 Bangumi 条目: ${subjectId}` }

    const tags = (data.tags || [])
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map((t: any) => t.name)

    let developer = ''
    const infobox = data.infobox || []
    for (const item of infobox) {
      if (item.key === '开发' || item.key === 'Developer' || item.key === '开发商') {
        developer = (item.value || '').toString()
        break
      }
    }

    return {
      title: data.name || '',
      title_cn: data.name_cn || '',
      description: data.summary || '',
      cover: data.images?.large || data.images?.common || '',
      rating: data.rating?.score || 0,
      release_date: data.date || '',
      developer,
      publisher: '',
      custom_tags: JSON.stringify(tags),
      bangumi_id: String(data.id)
    }
  }
}
