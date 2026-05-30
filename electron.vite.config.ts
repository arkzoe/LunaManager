import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import type { PluginOption } from 'vite'

const plugins: PluginOption[] = [vue(), UnoCSS()]

// 仅在 ANALYZE 环境变量存在时加载 visualizer（避免每次构建都生成 stats 报告）
if (process.env.ANALYZE) {
  // 使用 require 而非顶层 await import，确保 electron-vite 配置加载兼容
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { visualizer } = require('rollup-plugin-visualizer')
  plugins.push(
    visualizer({
      filename: resolve('out/renderer/stats.html'),
      open: false,
      gzipSize: true,
      template: 'treemap'
    })
  )
}

export default defineConfig({
  main: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {}
        }
      }
    }
  },
  preload: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {}
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins,
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/vue')) {
              return 'vue-vendor'
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'chart-vendor'
            }
            if (id.includes('node_modules/fuse.js')) {
              return 'fuse-vendor'
            }
          }
        }
      }
    }
  }
})
