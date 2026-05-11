<script setup lang="ts">
interface Game {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: boolean
  favorite: boolean
  lastPlayed?: string
  description?: string
  developer?: string
  publisher?: string
  releaseDate?: string
  playtime?: string
}

const props = defineProps<{
  game: Game | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'play', gameId: string): void
  (e: 'install', gameId: string): void
  (e: 'toggleFavorite', gameId: string): void
}>()

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    action: '动作',
    rpg: '角色扮演',
    strategy: '策略',
    sports: '体育'
  }
  return labels[category] || category
}

const handleClose = (): void => {
  emit('close')
}

const handlePlay = (): void => {
  if (props.game) {
    emit('play', props.game.id)
  }
}

const handleInstall = (): void => {
  if (props.game) {
    emit('install', props.game.id)
  }
}

const handleToggleFavorite = (): void => {
  if (props.game) {
    emit('toggleFavorite', props.game.id)
  }
}
</script>

<template>
  <div v-if="game" class="game-detail-overlay" @click="handleClose">
    <div class="game-detail-modal" @click.stop>
      <button class="close-btn" @click="handleClose">
        <svg viewBox="0 0 24 24">
          <path
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>

      <div class="detail-header">
        <div class="detail-cover">
          <div class="cover-placeholder">
            <svg viewBox="0 0 24 24">
              <path
                d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
              />
            </svg>
          </div>
        </div>

        <div class="detail-info">
          <div class="info-header">
            <span class="game-category">{{ getCategoryLabel(game.category) }}</span>
            <button
              class="favorite-btn"
              :class="{ active: game.favorite }"
              @click="handleToggleFavorite"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>
          </div>

          <h1 class="game-title">{{ game.title }}</h1>

          <div class="game-rating">
            <div class="stars">
              <svg
                v-for="i in 5"
                :key="i"
                viewBox="0 0 24 24"
                :class="{ filled: i <= Math.floor(game.rating) }"
              >
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </div>
            <span class="rating-score">{{ game.rating }}</span>
          </div>

          <div class="game-meta">
            <div class="meta-item">
              <span class="meta-label">大小</span>
              <span class="meta-value">{{ game.size }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">状态</span>
              <span class="meta-value" :class="{ installed: game.installed }">
                {{ game.installed ? '已安装' : '未安装' }}
              </span>
            </div>
            <div v-if="game.lastPlayed" class="meta-item">
              <span class="meta-label">上次游玩</span>
              <span class="meta-value">{{ game.lastPlayed }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button v-if="game.installed" class="btn-primary" @click="handlePlay">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              开始游戏
            </button>
            <button v-else class="btn-primary" @click="handleInstall">
              <svg viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              安装游戏
            </button>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="info-section">
          <h3>游戏介绍</h3>
          <p class="description">
            {{
              game.description ||
              '这是一款精彩的游戏，带给您无与伦比的游戏体验。沉浸式的剧情、精美的画面、流畅的操作，让您享受游戏的乐趣。'
            }}
          </p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">开发商</span>
            <span class="info-value">{{ game.developer || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发行商</span>
            <span class="info-value">{{ game.publisher || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发行日期</span>
            <span class="info-value">{{ game.releaseDate || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">游戏时长</span>
            <span class="info-value">{{ game.playtime || '未知' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.game-detail-modal {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn svg {
  width: 20px;
  height: 20px;
  fill: rgba(255, 255, 255, 0.7);
}

.detail-header {
  display: flex;
  gap: 32px;
  padding: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-cover {
  flex-shrink: 0;
  width: 240px;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder svg {
  width: 80px;
  height: 80px;
  fill: rgba(255, 255, 255, 0.1);
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.game-category {
  font-size: 13px;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border-radius: 20px;
  font-weight: 500;
}

.favorite-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.favorite-btn svg {
  width: 22px;
  height: 22px;
  fill: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.favorite-btn.active svg {
  fill: #f43f5e;
}

.game-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.game-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.stars {
  display: flex;
  gap: 4px;
}

.stars svg {
  width: 20px;
  height: 20px;
  fill: rgba(255, 255, 255, 0.2);
}

.stars svg.filled {
  fill: #fbbf24;
}

.rating-score {
  font-size: 18px;
  font-weight: 600;
  color: #fbbf24;
}

.game-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 32px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.meta-value.installed {
  color: #4ade80;
}

.action-buttons {
  margin-top: auto;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4);
}

.btn-primary svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.detail-body {
  padding: 32px;
}

.info-section {
  margin-bottom: 32px;
}

.info-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px 0;
}

.description {
  font-size: 15px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-detail-overlay {
    padding: 16px;
  }

  .detail-header {
    flex-direction: column;
    padding: 24px;
  }

  .detail-cover {
    width: 100%;
    height: 200px;
  }

  .game-title {
    font-size: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
