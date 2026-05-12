import type { IElectronAPI, AppConfig } from '../shared/types'

export type { IElectronAPI, AppConfig }

declare global {
  interface Window {
    api: IElectronAPI
  }
}
