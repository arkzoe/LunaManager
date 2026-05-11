import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify()
  ],
  transformers: [
    transformerDirectives()
  ],
  theme: {
    colors: {
      // ========== 主色调系统 ==========
      // 品牌主色 - 柔和蓝紫色系，降低饱和度更护眼
      brand: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b7ce8', // 主色 - 柔和紫
        600: '#7c6ad4', // 悬停色
        700: '#6d5bbf', // 按下色
        800: '#5e4aa8',
        900: '#4c3d8a',
      },

      // ========== 中性色系统 ==========
      // 背景层级 - 增强对比度，确保视觉层次清晰
      bg: {
        base: 'var(--bg-base)',
        sidebar: 'var(--bg-sidebar)',
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        quaternary: 'var(--bg-quaternary)',
        hover: 'var(--bg-hover)',
        active: 'var(--bg-active)',
      },

      // 文字颜色 - 引用 CSS 变量以支持暗色模式切换
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        brand: 'var(--text-brand)',
      },

      // 边框颜色 - 引用 CSS 变量以支持暗色模式切换
      border: {
        DEFAULT: 'var(--border-color)',
        light: 'var(--border-color-light)',
        medium: 'var(--border-color-medium)',
        strong: 'var(--border-color-strong)',
        brand: 'var(--border-brand)',
      },

      // ========== 功能色系统 ==========
      // 成功色 - 柔和绿色系
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#10b981', // 柔和绿
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },

      // 警告色 - 柔和橙色系
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b', // 柔和琥珀
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },

      // 危险色 - 柔和红色系
      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444', // 柔和红
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },

      // 信息色 - 柔和蓝色系
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6', // 柔和蓝
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },

      // ========== 扩展色板 ==========
      // 紫色调 - 用于特殊强调
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },

      // 粉色调 - 用于收藏、喜欢等
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
        900: '#831843',
      },

      // 青绿色调
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
        900: '#134e4a',
      },

      // 琥珀色调
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
        900: '#78350f',
      },
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
      full: '9999px',
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
      // 品牌色按钮阴影 - 柔和紫
      'brand': '0 2px 4px rgba(139, 124, 232, 0.2), 0 4px 8px rgba(139, 124, 232, 0.12)',
      'brand-lg': '0 4px 8px rgba(139, 124, 232, 0.25), 0 8px 16px rgba(139, 124, 232, 0.15)',
      // 危险色按钮阴影 - 柔和红
      'danger': '0 2px 4px rgba(239, 68, 68, 0.2), 0 4px 8px rgba(239, 68, 68, 0.12)',
      'danger-lg': '0 4px 8px rgba(239, 68, 68, 0.25), 0 8px 16px rgba(239, 68, 68, 0.15)',
      // 成功色按钮阴影 - 柔和绿
      'success': '0 2px 4px rgba(16, 185, 129, 0.2), 0 4px 8px rgba(16, 185, 129, 0.12)',
      'success-lg': '0 4px 8px rgba(16, 185, 129, 0.25), 0 8px 16px rgba(16, 185, 129, 0.15)',
    },

    // ========== 过渡动画 ==========
    transitionDuration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },

    // ========== 字体系统 ==========
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
  },

  // ========== 快捷类定义 ==========
  shortcuts: {
    // ===== 按钮组件 =====
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 select-none shadow-sm hover:shadow-md',
    'btn-brand': 'btn bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-brand hover:shadow-brand-lg',
    'btn-brand-outline': 'btn bg-transparent text-brand-600 border border-brand-500 hover:bg-brand-50',
    'btn-secondary': 'btn bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-quaternary hover:border-border-medium shadow-sm hover:shadow-md',
    'btn-ghost': 'btn bg-transparent text-text-secondary hover:bg-bg-secondary',
    'btn-danger': 'btn bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-danger hover:shadow-danger-lg',
    'btn-danger-outline': 'btn bg-transparent text-danger-600 border border-danger-500 hover:bg-danger-50',
    'btn-success': 'btn bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-success hover:shadow-success-lg',
    'btn-sm': 'px-3 py-1.5 text-sm rounded-md',
    'btn-lg': 'px-6 py-3 text-base rounded-xl',
    'btn-icon': 'w-9 h-9 p-0 rounded-lg',

    // ===== 卡片组件 =====
    'card': 'bg-bg-primary rounded-xl border border-border shadow-sm',
    'card-hover': 'card hover:border-border-medium hover:shadow-md transition-all duration-200',
    'card-interactive': 'card-hover cursor-pointer',
    'card-elevated': 'bg-bg-primary rounded-xl border border-border shadow-md',
    'card-filled': 'bg-bg-secondary rounded-xl border border-border-light',

    // ===== 输入框组件 =====
    'input': 'w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200',
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
    'text-brand': 'text-brand-600 font-medium',

    // ===== 滚动条 =====
    'scrollbar-thin': 'scrollbar:w-2 scrollbar:h-2 scrollbar-track:bg-transparent scrollbar-thumb:bg-border-medium scrollbar-thumb:rounded',

    // ===== 游戏卡片 =====
    'game-card': 'bg-bg-primary rounded-xl border border-border shadow-sm overflow-hidden cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:border-border-medium hover:shadow-md',
    'game-cover': 'w-full aspect-[4/3] bg-gradient-to-br from-bg-secondary to-bg-tertiary flex items-center justify-center',

    // ===== 侧边栏导航 =====
    'nav-item': 'w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
    'nav-item-active': 'nav-item bg-white shadow-sm border border-border text-brand-700',
    'nav-item-inactive': 'nav-item text-text-secondary hover:bg-white hover:shadow-sm hover:text-text-primary',

    // ===== 标签组件 =====
    'tag': 'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
    'tag-brand': 'tag bg-brand-100 text-brand-700',
    'tag-success': 'tag bg-success-100 text-success-700',
    'tag-warning': 'tag bg-warning-100 text-warning-700',
    'tag-danger': 'tag bg-danger-100 text-danger-700',
    'tag-info': 'tag bg-info-100 text-info-700',
    'tag-purple': 'tag bg-purple-100 text-purple-700',
    'tag-pink': 'tag bg-pink-100 text-pink-700',
    'tag-teal': 'tag bg-teal-100 text-teal-700',
    'tag-amber': 'tag bg-amber-100 text-amber-700',

    // ===== 分隔线 =====
    'divider': 'h-px bg-border',
    'divider-vertical': 'w-px h-full bg-border',

    // ===== 空状态 =====
    'empty-state': 'flex-col-center py-12 text-center',
    'empty-state-icon': 'w-20 h-20 flex-center bg-bg-secondary rounded-2xl mb-6',

    // ===== 工具栏 =====
    'toolbar': 'flex items-center justify-between gap-4 mb-6',
    'search-box': 'relative flex items-center flex-1 max-w-md',
    'search-input': 'w-full h-10 pl-10 pr-4 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-all duration-200',

    // ===== 图标按钮 =====
    'icon-btn': 'w-9 h-9 flex-center bg-bg-primary border border-border rounded-lg text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary hover:border-border-medium transition-all duration-200 cursor-pointer',
    'icon-btn-sm': 'w-8 h-8 rounded-md',

    // ===== 下拉菜单 =====
    'dropdown-btn': 'h-10 flex items-center gap-2 px-3 bg-bg-primary border border-border rounded-lg text-sm text-text-secondary hover:bg-bg-secondary transition-all duration-200 cursor-pointer',

    // ===== 表单组件 =====
    'form-label': 'block text-sm font-medium text-text-secondary mb-1.5',
    'form-group': 'mb-4',

    // ===== 开关组件 =====
    'toggle': 'relative w-11 h-6 bg-border-medium rounded-full cursor-pointer transition-colors duration-300',
    'toggle-active': 'toggle bg-brand-500',

    // ===== 统计卡片 =====
    'stat-card': 'bg-bg-primary rounded-xl border border-border p-5',
    'stat-icon': 'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
    'stat-value': 'text-2xl font-bold text-text-primary',
    'stat-label': 'text-sm text-text-tertiary',

    // ===== 模块容器 =====
    'module': 'bg-bg-primary rounded-xl border border-border p-6',
    'module-filled': 'bg-bg-secondary rounded-xl border border-border-light p-6',
    'module-elevated': 'bg-bg-primary rounded-xl border border-border p-6',
  }
})
