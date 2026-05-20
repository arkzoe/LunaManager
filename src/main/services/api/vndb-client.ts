import { buildUserAgent, safeFetch, apiError } from './base-client'
import type { GameRecord, SearchResult } from '../../../shared/types'

const VNDB_API = 'https://api.vndb.org/kana'

const TITLE_FIELDS = 'titles.title, titles.latin, titles.lang, titles.official'

function pickChineseTitle(
  titles: Array<{ lang: string; title: string; official?: boolean }>
): string {
  if (!titles?.length) return ''
  const pref = ['zh-Hans', 'zh', 'zh-Hant']
  for (const lang of pref) {
    const match = titles.find((t) => t.lang === lang && t.official)
    if (match) return match.title
  }
  for (const lang of pref) {
    const match = titles.find((t) => t.lang === lang)
    if (match) return match.title
  }
  return ''
}

export class VndbApiClient {
  private token?: string
  private userAgent: string

  constructor(token?: string) {
    this.token = token
    this.userAgent = buildUserAgent()
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent
    }
    if (this.token) {
      h['Authorization'] = `Token ${this.token}`
    }
    return h
  }

  async testConnection(): Promise<boolean> {
    try {
      await safeFetch(() =>
        fetch(`${VNDB_API}/authinfo`, {
          method: 'GET',
          headers: this.headers()
        })
      )
      return true
    } catch {
      return false
    }
  }

  async searchVN(query: string): Promise<SearchResult[]> {
    const data = await safeFetch<any>(() =>
      fetch(`${VNDB_API}/vn`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          filters: ['search', '=', query],
          fields: `id, title, ${TITLE_FIELDS}, image.url, released, rating`,
          results: 10,
          sort: 'searchrank'
        })
      })
    )

    return (data.results || []).map((vn: any) => ({
      id: vn.id,
      title: vn.title || '',
      titleCn: pickChineseTitle(vn.titles),
      cover: vn.image?.url || '',
      date: vn.released || '',
      rating: vn.rating ? vn.rating / 10 : 0,
      source: 'vndb' as const
    }))
  }

  async getVNDetail(vndbId: string): Promise<Partial<GameRecord>> {
    const data = await safeFetch<any>(() =>
      fetch(`${VNDB_API}/vn`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          filters: ['id', '=', vndbId],
          fields: `id, title, ${TITLE_FIELDS}, description, image.url, rating, released, developers.name, tags.name, tags.rating, tags.spoiler, tags.lie`
        })
      })
    )

    const vn = data.results?.[0]
    if (!vn) throw apiError('NOT_FOUND', `未找到 VNDB 条目: ${vndbId}`)

    const tags =
      (vn.tags || [])
        ?.filter((t: any) => t.rating >= 2 && !t.lie)
        .sort((a: any, b: any) => b.rating - a.rating)
        .slice(0, 10)
        .map((t: any) => t.name) ?? []

    return {
      title: vn.title || '',
      title_cn: pickChineseTitle(vn.titles),
      description: vn.description || '',
      cover: vn.image?.url || '',
      release_date: vn.released || '',
      developer: vn.developers?.[0]?.name || '',
      custom_tags: JSON.stringify(tags),
      vndb_id: vn.id || ''
    }
  }
}
