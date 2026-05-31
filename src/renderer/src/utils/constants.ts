export const GAME_STATUSES = ['want', 'playing', 'played', 'shelved', 'abandoned'] as const

export const STATUS_LABELS: Record<string, string> = {
  want: '想玩',
  playing: '在玩',
  played: '已玩',
  shelved: '搁置',
  abandoned: '抛弃'
}

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'want', label: '想玩' },
  { value: 'playing', label: '在玩' },
  { value: 'played', label: '已玩' },
  { value: 'shelved', label: '搁置' },
  { value: 'abandoned', label: '抛弃' }
]

export const LAUNCH_MODES = [
  { value: 'normal', label: '直接启动' },
  { value: 'le', label: 'LE 转区启动' },
  { value: 'magpie', label: 'Magpie 超分启动' }
] as const
