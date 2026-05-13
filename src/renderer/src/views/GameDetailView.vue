<script setup lang="ts">
import { ref } from 'vue'
import type { GameRecord, GameStatus } from '../../../shared/types'
import { formatRelativeTime } from '../utils/format'

const props = defineProps<{ game: GameRecord }>()
const emit = defineEmits<{ (e: 'back'): void }>()

const activeTab = ref<'stats' | 'edit' | 'backup'>('stats')
const showLaunchMenu = ref(false)
const showFullSummary = ref(false)
const tempStatus = ref<GameStatus>((props.game.status as GameStatus) || 'want')
const tempRating = ref(props.game.personal_rating || 0)
const tempNotes = ref(props.game.notes || '')

const tabs = [
  { id: 'stats' as const, label: '游玩统计', icon: 'chart' },
  { id: 'edit' as const, label: '编辑', icon: 'edit' },
  { id: 'backup' as const, label: '存档备份', icon: 'backup' }
]

const statuses: { id: GameStatus; label: string }[] = [
  { id: 'want', label: '想玩' },
  { id: 'playing', label: '在玩' },
  { id: 'played', label: '已玩' },
  { id: 'shelved', label: '搁置' },
  { id: 'abandoned', label: '抛弃' }
]

const launchModes = [
  { id: 'normal' as const, label: '直接启动', desc: '使用默认方式启动游戏' },
  { id: 'le' as const, label: 'Locale Emulator', desc: '转区启动，解决乱码问题' },
  { id: 'magpie' as const, label: 'Magpie 超分', desc: '放大窗口并优化画质' }
]

const toggleLaunchMenu = (): void => {
  showLaunchMenu.value = !showLaunchMenu.value
}

const handleLaunch = (mode: 'normal' | 'le' | 'magpie'): void => {
  showLaunchMenu.value = false
  // TODO: Phase 3 — call IPC launcher
  console.log('Launch with mode:', mode, 'game:', props.game.id)
}

const handleClickOutside = (): void => {
  showLaunchMenu.value = false
}

const iconPaths: Record<string, string> = {
  chart:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  backup:
    'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z'
}
</script>

<template>
  <div class="detail" @click="handleClickOutside">
    <!-- 上半部：封面 + 信息 -->
    <div class="hero">
      <div class="hero-cover">
        <img v-if="game.cover" :src="game.cover" :alt="game.title" class="cover-img" />
        <div v-else class="cover-ph">
          <svg viewBox="0 0 24 24" class="w-16 h-16 fill-text-muted opacity-20">
            <path
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
            />
          </svg>
        </div>
      </div>

      <div class="hero-info">
        <!-- 标题 + 评分 -->
        <div class="hi-title-row">
          <h1 class="hi-title">{{ game.title }}</h1>
          <!-- 星级评分 -->
          <div class="star-rating">
            <button
              v-for="i in 5"
              :key="i"
              class="star"
              :class="{ filled: i <= Math.round(tempRating / 2) }"
              @click.stop="tempRating = i * 2"
            >
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </button>
            <span class="star-score">{{ tempRating }}/10</span>
          </div>
        </div>

        <!-- 状态 -->
        <div class="hi-status">
          <span class="hi-label">状态</span>
          <select v-model="tempStatus" class="status-select">
            <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
        </div>

        <!-- 详细信息 -->
        <div class="hi-meta">
          <div v-if="game.developer" class="meta-item">
            <span class="meta-k">开发商</span>
            <span class="meta-v">{{ game.developer }}</span>
          </div>
          <div v-if="game.publisher" class="meta-item">
            <span class="meta-k">发行商</span>
            <span class="meta-v">{{ game.publisher }}</span>
          </div>
          <div v-if="game.release_date" class="meta-item">
            <span class="meta-k">发行日期</span>
            <span class="meta-v">{{ game.release_date }}</span>
          </div>
          <div v-if="game.size" class="meta-item">
            <span class="meta-k">大小</span>
            <span class="meta-v">{{ game.size }}</span>
          </div>
          <div v-if="game.playtime" class="meta-item">
            <span class="meta-k">时长</span>
            <span class="meta-v">{{ game.playtime }}</span>
          </div>
          <div v-if="game.vndb_id" class="meta-item">
            <span class="meta-k">VNDB</span>
            <a
              class="meta-v link"
              :href="'https://vndb.org/' + game.vndb_id"
              target="_blank"
              @click.stop
              >{{ game.vndb_id }}</a
            >
          </div>
          <div v-if="game.bangumi_id" class="meta-item">
            <span class="meta-k">Bangumi</span>
            <a
              class="meta-v link"
              :href="'https://bgm.tv/subject/' + game.bangumi_id"
              target="_blank"
              @click.stop
              >{{ game.bangumi_id }}</a
            >
          </div>
        </div>

        <!-- 简介 -->
        <div v-if="game.description" class="hi-summary">
          <p :class="{ clamped: !showFullSummary }">{{ game.description }}</p>
          <button
            v-if="game.description.length > 100"
            class="expand-btn"
            @click.stop="showFullSummary = !showFullSummary"
          >
            {{ showFullSummary ? '收起' : '展开全文' }}
          </button>
        </div>

        <!-- 启动按钮 -->
        <div class="launch-area">
          <div class="launch-group">
            <button class="launch-main" @click.stop="handleLaunch('normal')">
              <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
              开始游戏
            </button>
            <button class="launch-dropdown" title="更多启动方式" @click.stop="toggleLaunchMenu">
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>

          <!-- 下拉菜单 -->
          <div v-if="showLaunchMenu" class="launch-menu" @click.stop>
            <button
              v-for="mode in launchModes"
              :key="mode.id"
              class="lm-item"
              @click="handleLaunch(mode.id)"
            >
              <div class="lm-label">{{ mode.label }}</div>
              <div class="lm-desc">{{ mode.desc }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path :d="iconPaths[tab.icon]" />
        </svg>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-body">
      <!-- ===== 游玩统计 Tab ===== -->
      <div v-if="activeTab === 'stats'" class="tab-panel">
        <div class="stats-grid">
          <div class="stat-box">
            <div class="sb-value">{{ game.playtime || '-' }}</div>
            <div class="sb-label">总游玩时长</div>
          </div>
          <div class="stat-box">
            <div class="sb-value">-</div>
            <div class="sb-label">总启动次数</div>
          </div>
          <div class="stat-box">
            <div class="sb-value">{{ formatRelativeTime(game.last_played) || '-' }}</div>
            <div class="sb-label">最后游玩</div>
          </div>
        </div>
        <!-- 图表占位 -->
        <div class="chart-placeholder">
          <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
          <p>游玩时长趋势图将在接入真实数据后显示</p>
        </div>
      </div>

      <!-- ===== 编辑 Tab ===== -->
      <div v-else-if="activeTab === 'edit'" class="tab-panel">
        <div class="edit-form">
          <div class="form-field">
            <label>游戏名称</label>
            <input type="text" :value="game.title" class="form-input" />
          </div>
          <div class="form-field">
            <label>中文名称</label>
            <input type="text" :value="game.title_cn" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>开发商</label>
              <input type="text" :value="game.developer" class="form-input" />
            </div>
            <div class="form-field">
              <label>发行商</label>
              <input type="text" :value="game.publisher" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>发行日期</label>
              <input type="text" :value="game.release_date" class="form-input" />
            </div>
          </div>
          <div class="form-field">
            <label>个人备注</label>
            <textarea
              v-model="tempNotes"
              class="form-textarea"
              rows="4"
              placeholder="添加备注..."
            />
          </div>
          <button class="btn-brand">保存修改</button>
        </div>
      </div>

      <!-- ===== 存档备份 Tab ===== -->
      <div v-else-if="activeTab === 'backup'" class="tab-panel">
        <div class="backup-section">
          <div class="form-field">
            <label>存档路径</label>
            <div class="input-row">
              <input
                type="text"
                :value="game.save_path"
                placeholder="未设置存档路径"
                class="form-input flex-1"
              />
              <button class="btn-secondary btn-sm">选择文件夹</button>
            </div>
          </div>
          <button class="btn-brand btn-sm mb-5">自动检测存档路径</button>

          <div class="snapshot-list">
            <div class="snapshot-empty">
              <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
                <path
                  d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                />
              </svg>
              <p>暂无备份快照</p>
              <button class="btn-brand btn-sm mt-4">立即备份</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail {
  max-width: 800px;
}

/* ===== Hero 区域 ===== */
.hero {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
}

.hero-cover {
  flex-shrink: 0;
  width: 200px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 标题行 */
.hi-title-row {
  margin-bottom: 14px;
}

.hi-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  line-height: 1.3;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--border-color-medium);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.star.filled {
  color: #f59e0b;
}

.star:hover {
  color: #fbbf24;
}

.star-score {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-left: 6px;
}

/* 状态 */
.hi-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.hi-label {
  font-size: 12px;
  color: var(--text-tertiary);
  width: 50px;
  flex-shrink: 0;
}

.status-select {
  height: 30px;
  padding: 0 30px 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  outline: none;
}

/* 元数据 */
.hi-meta {
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 5px;
}

.meta-k {
  color: var(--text-tertiary);
  flex-shrink: 0;
  width: 52px;
}

.meta-v {
  color: var(--text-secondary);
}

.meta-v.link {
  color: var(--accent-primary);
  text-decoration: none;
}

.meta-v.link:hover {
  text-decoration: underline;
}

/* 简介 */
.hi-summary {
  margin-bottom: 16px;
}

.hi-summary p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.hi-summary p.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  font-size: 12px;
  color: var(--accent-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
  font-family: inherit;
  margin-top: 4px;
}

.expand-btn:hover {
  text-decoration: underline;
}

/* 启动区域 */
.launch-area {
  position: relative;
  margin-top: auto;
}

.launch-group {
  display: flex;
}

.launch-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}

.launch-main:hover {
  opacity: 0.9;
}

.launch-dropdown {
  width: 32px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  opacity: 0.85;
  color: white;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.launch-dropdown:hover {
  opacity: 1;
}

.launch-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 100;
}

.lm-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.lm-item:hover {
  background: var(--bg-hover);
}

.lm-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.lm-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* ===== Tabs ===== */
.tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

/* ===== Tab 内容 ===== */
.tab-body {
  min-height: 200px;
}

.tab-panel {
  padding: 0;
}

/* Stats Tab */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-box {
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 18px 14px;
}

.sb-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.sb-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.chart-placeholder p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

/* Edit Tab */
.edit-form {
  max-width: 500px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--accent-primary);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  line-height: 1.5;
}

.form-textarea:focus {
  border-color: var(--accent-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Backup Tab */
.backup-section {
  max-width: 500px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.mb-5 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 16px;
}

.snapshot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  text-align: center;
}

.snapshot-empty p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}
</style>
