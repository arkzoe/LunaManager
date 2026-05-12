export const formatPlaytime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours < 24) return rem ? `${hours}小时${rem}分钟` : `${hours}小时`
  const days = Math.floor(hours / 24)
  const rh = hours % 24
  return rh ? `${days}天${rh}小时` : `${days}天`
}

export const formatPlaytimeShort = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export const formatDate = (ts: number): string => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const formatDateTime = (ts: number): string => {
  const d = new Date(ts)
  return `${formatDate(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 30) return `${Math.floor(d / 30)}个月前`
  if (d > 0) return `${d}天前`
  if (h > 0) return `${h}小时前`
  if (m > 0) return `${m}分钟前`
  return '刚刚'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
}
