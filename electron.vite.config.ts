import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

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
    plugins: [
      vue(),
      UnoCSS(),
      visualizer({
        filename: resolve('out/renderer/stats.html'),
        open: false,
        gzipSize: true,
        template: 'treemap'
      })
    ],
    build: {
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/vue') || id.includes('node_modules/pinia')) {
              return 'vue-vendor'
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'chart-vendor'
            }
          }
        }
      }
    }
  }
})
