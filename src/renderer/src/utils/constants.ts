export const GAME_STATUSES = ['want', 'playing', 'played', 'shelved', 'abandoned'] as const

export const STATUS_LABELS: Record<string, string> = {
  want: '想玩',
  playing: '在玩',
  played: '已玩',
  shelved: '搁置',
  abandoned: '抛弃'
}

export const CATEGORY_LABELS: Record<string, string> = {
  action: '动作',
  rpg: '角色扮演',
  strategy: '策略',
  sports: '体育',
  adventure: '冒险',
  simulation: '模拟',
  puzzle: '解谜',
  shooter: '射击',
  horror: '恐怖',
  visual_novel: '视觉小说'
}

export const LAUNCH_MODES = [
  { value: 'normal', label: '直接启动' },
  { value: 'le', label: 'LE 转区启动' },
  { value: 'magpie', label: 'Magpie 超分启动' }
] as const

export const CATEGORY_COLORS: string[] = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#f97316', '#ef4444', '#4f46e5'
]
