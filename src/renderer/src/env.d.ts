/// <reference types="vite/client" />

import type { IElectronAPI } from '../../shared/types'

declare global {
  interface Window {
    api: IElectronAPI
  }
}
