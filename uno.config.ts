import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'

function toCSS(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
}

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      // ========== 品牌主色 - 月光灰系统 ==========
      // 用于所有 UI 表面和文字，克制中性
      brand: {
        50: '#fdfdfd',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#44484e',
        750: '#303235',
        800: '#1c1e1f',
        900: '#121416'
      },

      // ========== 中性色 - 石板灰（按钮专用） ==========
      neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      },

      // ========== 强调色 - 星光蓝 ==========
      accent: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },

      // ========== 背景层级 ==========
      bg: {
        base: 'var(--bg-base)',
        sidebar: 'var(--bg-sidebar)',
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        quaternary: '#e5e7eb',
        hover: 'var(--bg-hover)',
        active: 'var(--bg-active)'
      },

      // ========== 文字颜色 ==========
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        muted: 'var(--text-muted)',
        inverse: '#ffffff',
        brand: '#44484e'
      },

      // ========== 边框颜色 ==========
      border: {
        DEFAULT: 'var(--border-color)',
        light: 'var(--border-color-light)',
        medium: 'var(--border-color-medium)',
        strong: '#9ca3af',
        brand: '#cbd5e1'
      },

      // ========== 功能色系统 ==========
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b'
      },

      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      },

      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      },

      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },

      // ========== 扩展色板 ==========
      pink: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843'
      },

      teal: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a'
      },

      amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      }
    },

    // ========== 圆角系统 ==========
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      '3xl': '24px',
      full: '9999px'
    },

    // ========== 阴影系统 ==========
    boxShadow: {
      none: 'none',
      xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
      sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      md: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.02)',
      lg: '0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 15px rgba(0, 0, 0, 0.03)',
      xl: '0 10px 20px rgba(0, 0, 0, 0.05), 0 20px 25px rgba(0, 0, 0, 0.03)',
      '2xl': '0 20px 40px rgba(0, 0, 0, 0.06), 0 30px 50px rgba(0, 0, 0, 0.04)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.03)',
      // 主按钮阴影 - 中性深灰
      neutral: '0 2px 4px rgba(51, 65, 85, 0.2), 0 4px 8px rgba(51, 65, 85, 0.12)',
      'neutral-lg': '0 4px 8px rgba(51, 65, 85, 0.25), 0 8px 16px rgba(51, 65, 85, 0.15)',
      // 强调按钮阴影 - 星光蓝
      accent: '0 2px 4px rgba(59, 130, 246, 0.2), 0 4px 8px rgba(59, 130, 246, 0.12)',
      'accent-lg': '0 4px 8px rgba(59, 130, 246, 0.25), 0 8px 16px rgba(59, 130, 246, 0.15)',
      // 危险色按钮阴影
      danger: '0 2px 4px rgba(239, 68, 68, 0.2), 0 4px 8px rgba(239, 68, 68, 0.12)',
      'danger-lg': '0 4px 8px rgba(239, 68, 68, 0.25), 0 8px 16px rgba(239, 68, 68, 0.15)',
      // 成功色按钮阴影
      success: '0 2px 4px rgba(16, 185, 129, 0.2), 0 4px 8px rgba(16, 185, 129, 0.12)',
      'success-lg': '0 4px 8px rgba(16, 185, 129, 0.25), 0 8px 16px rgba(16, 185, 129, 0.15)'
    },

    // ========== CSS 变量 - 亮色模式 ==========
    themeLight: {
      '--bg-base': '#f8f9fa',
      '--bg-sidebar': '#ffffff',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f9fafb',
      '--bg-tertiary': '#f3f4f6',
      '--bg-hover': 'rgba(0, 0, 0, 0.03)',
      '--bg-active': 'rgba(59, 130, 246, 0.06)',
      '--text-primary': '#374151',
      '--text-secondary': '#4b5563',
      '--text-tertiary': '#6b7280',
      '--text-muted': '#9ca3af',
      '--border-color': 'rgba(0, 0, 0, 0.08)',
      '--border-color-light': 'rgba(0, 0, 0, 0.04)',
      '--border-color-medium': 'rgba(0, 0, 0, 0.12)',
      '--bg-overlay': 'rgba(0, 0, 0, 0.35)',
      '--accent-primary': '#3b82f6',
      '--accent-primary-dark': '#2563eb',
      '--success': '#10b981',
      '--danger': '#ef4444',
      '--warning': '#f59e0b',
      '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.03)',
      '--shadow-md': '0 4px 8px rgba(0, 0, 0, 0.04)'
    },

    // ========== CSS 变量 - 暗色模式 ==========
    themeDark: {
      '--bg-base': '#121416',
      '--bg-sidebar': '#1c1e1f',
      '--bg-primary': '#1c1e1f',
      '--bg-secondary': '#303235',
      '--bg-tertiary': '#27272a',
      '--bg-hover': 'rgba(255, 255, 255, 0.05)',
      '--bg-active': 'rgba(59, 130, 246, 0.12)',
      '--text-primary': '#f3f4f6',
      '--text-secondary': '#d1d5db',
      '--text-tertiary': '#9ca3af',
      '--text-muted': '#6b7280',
      '--border-color': 'rgba(255, 255, 255, 0.08)',
      '--border-color-light': 'rgba(255, 255, 255, 0.04)',
      '--border-color-medium': 'rgba(255, 255, 255, 0.12)',
      '--bg-overlay': 'rgba(0, 0, 0, 0.6)',
      '--accent-primary': '#60a5fa',
      '--accent-primary-dark': '#3b82f6',
      '--success': '#34d399',
      '--danger': '#f87171',
      '--warning': '#fbbf24',
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.35)'
    },

    // ========== 过渡动画 ==========
    transitionDuration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },

    // ========== 字体系统 ==========
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif'
      ]
    }
  },

  // ========== 快捷类定义 ==========
  shortcuts: {
    // ===== 按钮组件 =====
    btn: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 select-none shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    'btn-primary':
      'btn bg-neutral-700 text-white hover:bg-neutral-800 active:bg-neutral-900 shadow-neutral hover:shadow-neutral-lg',
    'btn-primary-outline':
      'btn bg-transparent text-neutral-700 border border-neutral-700 hover:bg-neutral-100',
    'btn-secondary':
      'btn bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-quaternary hover:border-border-medium',
    'btn-ghost': 'btn bg-transparent text-text-secondary hover:bg-bg-secondary',
    'btn-danger':
      'btn bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-danger hover:shadow-danger-lg',
    'btn-danger-outline':
      'btn bg-transparent text-danger-600 border border-danger-500 hover:bg-danger-50',
    'btn-success':
      'btn bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-success hover:shadow-success-lg',
    'btn-accent':
      'btn bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-accent hover:shadow-accent-lg',
    'btn-sm': 'px-3 py-1.5 text-sm rounded-md',
    'btn-lg': 'px-6 py-3 text-base rounded-xl',
    'btn-icon': 'w-9 h-9 p-0 rounded-lg',

    // ===== 卡片组件 =====
    card: 'bg-bg-primary rounded-xl border border-border',
    'card-hover': 'card hover:border-border-medium transition-all duration-200',
    'card-interactive': 'card-hover cursor-pointer',
    'card-elevated': 'bg-bg-primary rounded-xl border border-border',
    'card-filled': 'bg-bg-secondary rounded-xl border border-border-light',

    // ===== 输入框组件 =====
    input:
      'w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all duration-200',
    'input-error': 'input border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
    'input-success': 'input border-success-500 focus:border-success-500 focus:ring-success-500/20',

    // ===== 布局快捷类 =====
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',
    'flex-col-between': 'flex flex-col justify-between',

    // ===== 文本样式 =====
    'text-title': 'text-xl font-bold text-text-primary',
    'text-subtitle': 'text-lg font-semibold text-text-secondary',
    'text-body': 'text-sm text-text-secondary leading-relaxed',
    'text-caption': 'text-xs text-text-muted',
    'text-accent': 'text-accent-600 font-medium',

    // ===== 滚动条 =====
    'scrollbar-thin':
      'scrollbar:w-2 scrollbar:h-2 scrollbar-track:bg-transparent scrollbar-thumb:bg-border-medium scrollbar-thumb:rounded',

    // ===== 游戏卡片 =====
    'game-card':
      'bg-bg-primary rounded-xl border border-border overflow-hidden cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:border-border-medium',
    'game-cover':
      'w-full aspect-[4/3] bg-gradient-to-br from-bg-secondary to-bg-tertiary flex items-center justify-center',

    // ===== 侧边栏导航 =====
    'nav-item':
      'w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
    'nav-item-active': 'nav-item bg-accent-50 text-accent-700',
    'nav-item-inactive':
      'nav-item text-text-secondary hover:bg-bg-secondary hover:text-text-primary',

    // ===== 标签组件 =====
    tag: 'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
    'tag-neutral': 'tag bg-neutral-100 text-neutral-700',
    'tag-success': 'tag bg-success-100 text-success-700',
    'tag-warning': 'tag bg-warning-100 text-warning-700',
    'tag-danger': 'tag bg-danger-100 text-danger-700',
    'tag-info': 'tag bg-info-100 text-info-700',
    'tag-accent': 'tag bg-accent-100 text-accent-700',
    'tag-pink': 'tag bg-pink-100 text-pink-700',
    'tag-teal': 'tag bg-teal-100 text-teal-700',
    'tag-amber': 'tag bg-amber-100 text-amber-700',

    // ===== 分隔线 =====
    divider: 'h-px bg-border',
    'divider-vertical': 'w-px h-full bg-border',

    // ===== 空状态 =====
    'empty-state': 'flex-col-center py-12 text-center',
    'empty-state-icon': 'w-20 h-20 flex-center bg-bg-secondary rounded-2xl mb-6',

    // ===== 工具栏 =====
    toolbar: 'flex items-center justify-between gap-4 mb-6',
    'search-box': 'relative flex items-center flex-1 max-w-md',
    'search-input':
      'w-full h-10 pl-10 pr-4 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-500 transition-all duration-200',

    // ===== 图标按钮 =====
    'icon-btn':
      'w-9 h-9 flex-center bg-bg-primary border border-border rounded-lg text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary hover:border-border-medium transition-all duration-200 cursor-pointer',
    'icon-btn-sm': 'w-8 h-8 rounded-md',

    // ===== 下拉菜单 =====
    'dropdown-btn':
      'h-10 flex items-center gap-2 px-3 bg-bg-primary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-secondary transition-all duration-200 cursor-pointer',

    // ===== 表单组件 =====
    'form-label': 'block text-sm font-medium text-text-secondary mb-1.5',
    'form-group': 'mb-4',

    // ===== 开关组件 =====
    toggle:
      'relative w-11 h-6 bg-border-medium rounded-full cursor-pointer transition-colors duration-300',
    'toggle-active': 'toggle bg-accent-500',

    // ===== 统计卡片 =====
    'stat-card': 'bg-bg-primary rounded-xl border border-border p-5',
    'stat-icon': 'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
    'stat-value': 'text-2xl font-bold text-text-primary',
    'stat-label': 'text-sm text-text-tertiary',

    // ===== 模块容器 =====
    module: 'bg-bg-primary rounded-xl border border-border p-6',
    'module-filled': 'bg-bg-secondary rounded-xl border border-border-light p-6',
    'module-elevated': 'bg-bg-primary rounded-xl border border-border p-6',

    // ===== 对话框通用 =====
    'dialog-overlay':
      'fixed inset-0 z-1002 bg-black/45 flex items-center justify-center',
    'dialog-card':
      'bg-bg-primary border border-border rounded-xl shadow-2xl flex flex-col max-h-80vh',
    'dialog-header':
      'flex items-center justify-between px-5 py-4 border-b border-border-light shrink-0',
    'dialog-title': 'text-15px font-bold text-text-primary m-0',
    'dialog-close':
      'w-7 h-7 flex-center border-none bg-transparent text-text-tertiary text-lg cursor-pointer rounded-md transition-colors duration-100 hover:bg-bg-hover hover:text-text-primary',
    'dialog-body': 'px-5 py-6 overflow-y-auto flex-1',
    'dialog-footer':
      'flex justify-end gap-2 px-5 py-3.5 border-t border-border-light shrink-0',

    // ===== 过渡简写 =====
    'transition-ui':
      'transition-all duration-150',
    'transition-ui-slow':
      'transition-all duration-250',
  },
  preflights: [
    {
      getCSS: ({ theme }: any) =>
        `:root {
${toCSS(theme.themeLight || {})}
}
html.dark {
${toCSS(theme.themeDark || {})}
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes overlay-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modal-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.96) translateY(8px); }
}
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dropdown-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-4px) scale(0.96); }
}
@keyframes active-bar-in {
  from { transform: translateY(-50%) scaleY(0); }
  to { transform: translateY(-50%) scaleY(1); }
}
@keyframes icon-wiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg); }
  75% { transform: rotate(6deg); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-up {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
@keyframes fade-in-scale {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes fade-in-left {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fade-in-right {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}
@keyframes pulse-dot-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
}
@keyframes toast-shrink {
  from { width: 100%; }
  to { width: 0%; }
}
@keyframes slide-expand {
  from { max-height: 0; opacity: 0; transform: translateY(-8px); }
  to { max-height: 600px; opacity: 1; transform: translateY(0); }
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to { opacity: 0; transform: translateX(20px) scale(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`
    }
  ]
})
