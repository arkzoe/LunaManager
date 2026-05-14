import type { ApiError } from '../../../shared/types'

const APP_NAME = 'LunaManager'
const APP_URL = 'https://github.com/arkzoe/lunamanager'

export function buildUserAgent(username?: string): string {
  const user = username || 'User'
  return `${user}/${APP_NAME} (${APP_URL})`
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('timed out') || msg.includes('TIMEOUT')) {
      return { code: 'TIMEOUT', message: '请求超时，请稍后重试' }
    }
    if (msg.includes('401') || msg.includes('403')) {
      return { code: 'AUTH_FAILED', message: '认证失败，请检查 API Key / Token' }
    }
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('RATE_LIMITED')) {
      return { code: 'RATE_LIMITED', message: '请求频率过高，请稍后重试' }
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      return { code: 'NOT_FOUND', message: '未找到相关数据' }
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
      return { code: 'SERVER_ERROR', message: '服务器错误，请稍后重试' }
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
      return { code: 'NETWORK', message: '网络连接失败，请检查网络' }
    }
    return { code: 'NETWORK', message: msg }
  }
  return { code: 'NETWORK', message: '未知网络错误' }
}

export async function safeFetch<T>(fn: () => Promise<Response>): Promise<T> {
  let resp: Response
  try {
    resp = await fn()
  } catch (err) {
    throw normalizeError(err)
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    if (resp.status === 401 || resp.status === 403) {
      throw { code: 'AUTH_FAILED', message: '认证失败，请检查 API Key / Token' } satisfies ApiError
    }
    if (resp.status === 429) {
      throw { code: 'RATE_LIMITED', message: '请求频率过高，请稍后重试' } satisfies ApiError
    }
    if (resp.status === 404) {
      throw { code: 'NOT_FOUND', message: '未找到相关数据' } satisfies ApiError
    }
    if (resp.status >= 500) {
      throw { code: 'SERVER_ERROR', message: `服务器错误 (${resp.status})` } satisfies ApiError
    }
    throw { code: 'NETWORK', message: text || `HTTP ${resp.status}` } satisfies ApiError
  }

  try {
    return (await resp.json()) as T
  } catch {
    throw { code: 'PARSE_ERROR', message: '响应数据解析失败' } satisfies ApiError
  }
}
