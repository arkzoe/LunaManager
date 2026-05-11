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
      // 品牌主色 - 靛蓝色系，用于主要操作和强调
      brand: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1', // 主色
        600: '#4f46e5', // 悬停色
        700: '#4338ca', // 按下色
        800: '#3730a3',
        900: '#312e81',
      },

      // ========== 中性色系统 ==========
      // 背景层级 - 从深到浅，建立清晰的视觉层次
      bg: {
        base: '#f1f5f9',        // 最底层背景（页面背景）
        sidebar: '#ffffff',     // 侧边栏背景
        primary: '#ffffff',     // 主要卡片背景
        secondary: '#f8fafc',   // 次级卡片/模块背景
        tertiary: '#f1f5f9',    // 第三层级背景（输入框、按钮等）
        quaternary: '#e2e8f0',  // 第四层级（分隔区域、禁用状态）
        hover: '#f8fafc',       // 悬停状态
        active: '#e0e7ff',      // 激活状态（品牌色浅色调）
      },

      // 文字颜色 - 确保 WCAG AA 及以上对比度
      text: {
        primary: '#0f172a',     // 主要文字 - 对比度约 15:1
        secondary: '#334155',   // 次要文字 - 对比度约 7:1
        tertiary: '#64748b',    // 辅助文字 - 对比度约 4.5:1
        muted: '#94a3b8',       // 弱化文字 - 对比度约 3:1
        inverse: '#ffffff',     // 反色文字（用于深色背景）
        brand: '#4f46e5',       // 品牌色文字
      },

      // 边框颜色 - 建立清晰的边界感
      border: {
        DEFAULT: '#e2e8f0',     // 默认边框
        light: '#f1f5f9',       // 浅色边框（分隔线）
        medium: '#cbd5e1',      // 中等边框（悬停状态）
        strong: '#94a3b8',      // 强调边框（聚焦状态）
        brand: '#6366f1',       // 品牌色边框
      },

      // ========== 功能色系统 ==========
      // 成功色 - 绿色系
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },

      // 警告色 - 橙色系
      warning: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },

      // 危险色 - 红色系
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
        900: '#7f1d1d',
      },

      // 信息色 - 青色系
      info: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
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
      // 品牌色按钮阴影
      'brand': '0 2px 4px rgba(99, 102, 241, 0.25), 0 4px 8px rgba(99, 102, 241, 0.15)',
      'brand-lg': '0 4px 8px rgba(99, 102, 241, 0.3), 0 8px 16px rgba(99, 102, 241, 0.2)',
      // 危险色按钮阴影
      'danger': '0 2px 4px rgba(239, 68, 68, 0.25), 0 4px 8px rgba(239, 68, 68, 0.15)',
      'danger-lg': '0 4px 8px rgba(239, 68, 68, 0.3), 0 8px 16px rgba(239, 68, 68, 0.2)',
      // 成功色按钮阴影
      'success': '0 2px 4px rgba(34, 197, 94, 0.25), 0 4px 8px rgba(34, 197, 94, 0.15)',
      'success-lg': '0 4px 8px rgba(34, 197, 94, 0.3), 0 8px 16px rgba(34, 197, 94, 0.2)',
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
    'btn-secondary': 'btn bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-quaternary hover:border-border-medium',
    'btn-ghost': 'btn bg-transparent text-text-secondary hover:bg-bg-secondary',
    'btn-danger': 'btn bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-danger hover:shadow-danger-lg',
    'btn-danger-outline': 'btn bg-transparent text-danger-600 border border-danger-500 hover:bg-danger-50',
    'btn-success': 'btn bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-success hover:shadow-success-lg',
    'btn-sm': 'px-3 py-1.5 text-sm rounded-md',
    'btn-lg': 'px-6 py-3 text-base rounded-xl',
    'btn-icon': 'w-9 h-9 p-0 rounded-lg',

    // ===== 卡片组件 =====
    'card': 'bg-bg-primary rounded-xl border border-border',
    'card-hover': 'card hover:border-border-medium transition-all duration-200',
    'card-interactive': 'card-hover cursor-pointer',
    'card-elevated': 'bg-bg-primary rounded-xl border border-border',
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
    'game-card': 'bg-bg-primary rounded-xl border border-border overflow-hidden cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:border-border-medium',
    'game-cover': 'w-full aspect-[4/3] bg-gradient-to-br from-bg-secondary to-bg-tertiary flex items-center justify-center',

    // ===== 侧边栏导航 =====
    'nav-item': 'w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
    'nav-item-active': 'nav-item bg-brand-100 text-brand-700',
    'nav-item-inactive': 'nav-item text-text-secondary hover:bg-bg-secondary hover:text-text-primary',

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
