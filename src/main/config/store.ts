import { safeStorage } from 'electron'
import StoreModule from 'electron-store'
import type { Options, default as ElectronStoreType } from 'electron-store'
import { getDataDir } from './paths'
import type { AppConfig } from '../../shared/types'

// electron-store 在 ESM/CJS 混合环境下的兼容处理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((StoreModule as any).default || StoreModule) as typeof ElectronStoreType

const getConfigPath = (): string => getDataDir()

const defaultConfig: AppConfig = {
  windowBounds: {
    width: 1200,
    height: 800
  },
  autoStart: false,
  autoUpdate: true,
  metadataSource: 'bangumi',
  theme: 'light',
  minimizeToTray: false,
  trackPlaytime: true,
  recordHistory: true,
  dbPath: '',
  magpiePath: '',
  magpieHotkey: 'fullscreen',
  autoLaunchMagpie: true,
  magpieDelay: 5000,
  bangumiToken: '',
  vndbApiKey: '',
  backupDir: '',
  lastUpdateCheckDate: ''
}

const storeOptions: Options<AppConfig> = {
  name: 'config',
  cwd: getConfigPath(),
  defaults: defaultConfig,
  migrations: {}
}

export const configStore = new Store<AppConfig>(storeOptions)

const SENSITIVE_KEYS: ReadonlySet<keyof AppConfig> = new Set(['vndbApiKey', 'bangumiToken'])
const ENC_PREFIX = 'safeStorage:v1:'

function encrypt(plain: string): string {
  if (!plain) return plain
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[store] safeStorage unavailable; storing token in plaintext')
    return plain
  }
  try {
    const buf = safeStorage.encryptString(plain)
    return ENC_PREFIX + buf.toString('base64')
  } catch (err) {
    console.error('[store] encryption failed; storing token in plaintext', err)
    return plain
  }
}

function decrypt(stored: string): string {
  if (!stored || !stored.startsWith(ENC_PREFIX)) return stored
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[store] safeStorage unavailable; cannot decrypt token')
    return stored
  }
  try {
    const base64 = stored.slice(ENC_PREFIX.length)
    const buf = Buffer.from(base64, 'base64')
    return safeStorage.decryptString(buf)
  } catch (err) {
    console.error('[store] decryption failed; returning raw value', err)
    return stored
  }
}

// 配置访问方法
export const getConfig = <K extends keyof AppConfig>(key: K): AppConfig[K] => {
  const raw = configStore.get(key)
  if (SENSITIVE_KEYS.has(key) && typeof raw === 'string') {
    return decrypt(raw) as AppConfig[K]
  }
  return raw
}

export const setConfig = <K extends keyof AppConfig>(key: K, value: AppConfig[K]): void => {
  const v = SENSITIVE_KEYS.has(key) && typeof value === 'string' ? encrypt(value) as AppConfig[K] : value
  configStore.set(key, v)
}

export const getAllConfig = (): AppConfig => {
  const raw = configStore.store
  return {
    ...raw,
    vndbApiKey: raw.vndbApiKey ? decrypt(raw.vndbApiKey) : raw.vndbApiKey as string,
    bangumiToken: raw.bangumiToken ? decrypt(raw.bangumiToken) : raw.bangumiToken as string
  }
}

export const setAllConfig = (config: Partial<AppConfig>): void => {
  const merged = { ...config }
  if (merged.vndbApiKey !== undefined) merged.vndbApiKey = encrypt(merged.vndbApiKey) as AppConfig['vndbApiKey']
  if (merged.bangumiToken !== undefined) merged.bangumiToken = encrypt(merged.bangumiToken) as AppConfig['bangumiToken']
  Object.assign(configStore.store, merged)
}
