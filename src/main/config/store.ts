import StoreModule from 'electron-store'
import type { Options, default as ElectronStoreType } from 'electron-store'
import { getDataDir } from './paths'

// electron-store 在 ESM/CJS 混合环境下的兼容处理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((StoreModule as any).default || StoreModule) as typeof ElectronStoreType

const getConfigPath = (): string => getDataDir()

export interface AppConfig {
  // 窗口设置
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
  }

  // 基础配置
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string

  // 元数据设置
  metadataSource: 'vndb' | 'bangumi'
  autoSyncMetadata: boolean

  // 外观设置
  theme: 'dark' | 'light'
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  showGameCover: boolean

  // 游玩配置
  trackPlaytime: boolean
  recordHistory: boolean

  // 数据库配置
  dbPath: string

  // 启动器配置
  lePath: string
  magpiePath: string
  magpieScale: string

  // API 密钥
  bangumiToken: string
  vndbApiKey: string

  // 备份配置
  backupDir: string
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupMaxCopies: number
}

const defaultConfig: AppConfig = {
  windowBounds: {
    width: 1200,
    height: 800
  },
  autoStart: false,
  autoUpdate: true,
  downloadPath: '',
  metadataSource: 'vndb',
  autoSyncMetadata: true,
  theme: 'dark',
  language: 'zh-CN',
  sidebarCollapsed: false,
  showGameCover: true,
  trackPlaytime: true,
  recordHistory: true,
  dbPath: '',
  lePath: '',
  magpiePath: '',
  magpieScale: '2x',
  bangumiToken: '',
  vndbApiKey: '',
  backupDir: '',
  autoBackup: false,
  backupFrequency: 'weekly',
  backupMaxCopies: 5
}

const storeOptions: Options<AppConfig> = {
  name: 'config',
  cwd: getConfigPath(),
  defaults: defaultConfig,
  migrations: {
    '>=1.0.0': (_store) => {
      // 迁移逻辑
      console.log('Running config migration for v1.0.0')
    }
  }
}

export const configStore = new Store<AppConfig>(storeOptions)

// 配置访问方法
export const getConfig = <K extends keyof AppConfig>(key: K): AppConfig[K] => {
  return configStore.get(key)
}

export const setConfig = <K extends keyof AppConfig>(key: K, value: AppConfig[K]): void => {
  configStore.set(key, value)
}

export const getAllConfig = (): AppConfig => {
  return configStore.store
}

export const setAllConfig = (config: Partial<AppConfig>): void => {
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      configStore.set(key as keyof AppConfig, value as AppConfig[keyof AppConfig])
    }
  }
}

