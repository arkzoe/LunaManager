import type { ApiError } from '../../../shared/types'

const APP_NAME = 'LunaManager'
const APP_URL = 'https://github.com/arkzoe/lunamanager'

export function buildUserAgent(username?: string): string {
  const user = username || 'User'
  return `${user}/${APP_NAME} (${APP_URL})`
}

export function apiError(code: ApiError['code'], message: string): Error {
  const err = new Error(message)
  ;(err as any).code = code
  return err
}

export function normalizeError(err: unknown): ApiError {
  if (err && typeof err === 'object' && 'code' in err) {
    const e = err as { code: string; message?: string }
    return { code: e.code as ApiError['code'], message: e.message || '未知错误' }
  }
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
      throw apiError('AUTH_FAILED', '认证失败，请检查 API Key / Token')
    }
    if (resp.status === 429) {
      throw apiError('RATE_LIMITED', '请求频率过高，请稍后重试')
    }
    if (resp.status === 404) {
      throw apiError('NOT_FOUND', '未找到相关数据')
    }
    if (resp.status >= 500) {
      throw apiError('SERVER_ERROR', `服务器错误 (${resp.status})`)
    }
    throw apiError('NETWORK', text || `HTTP ${resp.status}`)
  }

  try {
    return (await resp.json()) as T
  } catch {
    throw apiError('PARSE_ERROR', '响应数据解析失败')
  }
}

const RETRYABLE_CODES = new Set(['TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR', 'NETWORK'])

export async function safeFetchWithRetry<T>(
  fn: () => Promise<Response>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await safeFetch(fn)
    } catch (err: unknown) {
      lastErr = err
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as any).code
          : ''
      if (RETRYABLE_CODES.has(code) && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
  throw lastErr
}
