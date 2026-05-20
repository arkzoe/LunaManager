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
  autoSyncMetadata: true,
  theme: 'light',
  language: 'zh-CN',
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
  Object.assign(configStore.store, config)
}
