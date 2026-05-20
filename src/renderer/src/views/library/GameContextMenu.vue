<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { GameStatus } from '../../../../shared/types'

const props = defineProps<{
  show: boolean
  x: number
  y: number
  statusFilters: { id: GameStatus; label: string }[]
  gameStatus: GameStatus | null
}>()

const emit = defineEmits<{
  (e: 'viewDetail'): void
  (e: 'addToCollection'): void
  (e: 'statusChange', status: GameStatus): void
  (e: 'delete'): void
  (e: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(0)
const adjustedY = ref(0)
const menuVisible = ref(false)

watch(
  () => props.show,
  async (val) => {
    if (!val) {
      menuVisible.value = false
      return
    }
    adjustedX.value = 0
    adjustedY.value = 0
    menuVisible.value = false
    await nextTick()
    const el = menuRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const gap = 8
    let x = props.x
    let y = props.y
    if (x + rect.width > vw - gap) {
      const flipX = props.x - rect.width
      x = flipX >= gap ? flipX : vw - rect.width - gap
    }
    if (y + rect.height > vh - gap) {
      const flipY = props.y - rect.height
      y = flipY >= gap ? flipY : vh - rect.height - gap
    }
    if (x < gap) x = gap
    if (y < gap) y = gap
    adjustedX.value = x
    adjustedY.value = y
    await nextTick()
    menuVisible.value = true
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="ctx">
      <div
        v-if="show"
        class="context-overlay"
        @click="emit('close')"
        @contextmenu.prevent="emit('close')"
      />
    </Transition>
    <div
      v-if="show"
      ref="menuRef"
      class="context-menu"
      :class="{ visible: menuVisible }"
      :style="{ left: adjustedX + 'px', top: adjustedY + 'px' }"
    >
      <button class="ctx-item" @click="emit('viewDetail')">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path
            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          />
        </svg>
        查看详情
      </button>
      <div class="ctx-divider" />
      <button class="ctx-item" @click="emit('addToCollection')">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path
            d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
          />
        </svg>
        添加到收藏夹
      </button>
      <div class="ctx-divider" />
      <div class="ctx-label">更改状态</div>
      <button
        v-for="s in statusFilters"
        :key="s.id"
        class="ctx-item"
        :class="{ current: gameStatus === s.id }"
        @click="emit('statusChange', s.id)"
      >
        {{ s.label }}
      </button>
      <div class="ctx-divider" />
      <button class="ctx-item danger" @click="emit('delete')">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
        删除
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.ctx-enter-active {
  animation: overlay-in 0.1s ease;
}

.ctx-leave-active {
  animation: overlay-out 0.1s ease forwards;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
  pointer-events: none;
}

.context-menu.visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition:
    background-color 0.1s,
    border-color 0.1s,
    color 0.1s,
    box-shadow 0.1s;
  text-align: left;
}

.ctx-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.ctx-item.current {
  color: var(--accent-primary);
  font-weight: 600;
}

.ctx-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.ctx-divider {
  height: 1px;
  background: var(--border-color-light);
  margin: 4px 6px;
}

.ctx-label {
  padding: 6px 10px 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
