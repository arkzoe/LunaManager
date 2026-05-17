<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { UICollection } from '../../composables/useCollections'
import { getIconSvg } from './icons'
import type { GameRecord } from '../../../../shared/types'

const props = defineProps<{
  show: boolean
  mode: 'create' | 'rename' | 'delete' | 'move'
  collection?: UICollection
  collections?: UICollection[]
  collectionName?: string
  game?: GameRecord
}>()

const emit = defineEmits<{
  (e: 'create', name: string): void
  (e: 'rename', id: string, name: string): void
  (e: 'delete', id: string): void
  (e: 'move', gameId: string, targetId: string): void
  (e: 'close'): void
}>()

const inputValue = ref('')

const existingNames = computed(
  () => new Set((props.collections || []).map((c) => c.name.toLowerCase()))
)

const nameError = computed(() => {
  const v = inputValue.value.trim()
  if (!v) return ''
  if (props.mode === 'rename' && v.toLowerCase() === props.collection?.name?.toLowerCase())
    return ''
  if (existingNames.value.has(v.toLowerCase())) return '已存在同名收藏夹'
  return ''
})

const canSubmit = computed(() => {
  if (props.mode !== 'create' && props.mode !== 'rename') return true
  return !!inputValue.value.trim() && !nameError.value
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.mode === 'rename') {
        inputValue.value = props.collection?.name || ''
      } else if (props.mode === 'create') {
        inputValue.value = props.collectionName || ''
      } else {
        inputValue.value = ''
      }
    }
  }
)

const handleConfirm = (): void => {
  if (props.mode === 'create') {
    emit('create', inputValue.value)
  } else if (props.mode === 'rename' && props.collection) {
    emit('rename', props.collection.id, inputValue.value)
  } else if (props.mode === 'delete' && props.collection) {
    emit('delete', props.collection.id)
  }
}

const handleMoveTarget = (targetId: string): void => {
  if (props.game) emit('move', props.game.id, targetId)
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 backdrop-blur-sm modal-overlay"
    >
      <div class="w-90% max-w-100 rounded-2xl p-6 modal-card">
        <template v-if="mode === 'create'">
          <h3 class="text-lg font-semibold m-0 mb-4 modal-title">新建收藏夹</h3>
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入收藏夹名称"
            class="w-full h-11 px-4 rounded-xl text-15px mb-1 transition-all duration-200 modal-input"
            @keyup.enter="handleConfirm"
          />
          <p v-if="nameError" class="text-xs m-0 mb-4 ml-1 error-text">{{ nameError }}</p>
          <p v-else class="text-xs m-0 mb-4">&nbsp;</p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 btn-cancel"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
              :class="canSubmit ? 'btn-primary' : 'btn-disabled cursor-not-allowed'"
              :disabled="!canSubmit"
              @click="handleConfirm"
            >
              创建
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'rename'">
          <h3 class="text-lg font-semibold m-0 mb-4 modal-title">重命名收藏夹</h3>
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入新名称"
            class="w-full h-11 px-4 rounded-xl text-15px mb-1 transition-all duration-200 modal-input"
            @keyup.enter="handleConfirm"
          />
          <p v-if="nameError" class="text-xs m-0 mb-4 ml-1 error-text">{{ nameError }}</p>
          <p v-else class="text-xs m-0 mb-4">&nbsp;</p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 btn-cancel"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
              :class="canSubmit ? 'btn-primary' : 'btn-disabled cursor-not-allowed'"
              :disabled="!canSubmit"
              @click="handleConfirm"
            >
              确认
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'delete'">
          <h3 class="text-lg font-semibold m-0 mb-4 modal-title">删除收藏夹</h3>
          <p class="text-sm m-0 mb-5 leading-relaxed delete-desc">
            确定要删除 "{{ collection?.name }}" 吗？收藏夹中的游戏不会被删除。
          </p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 btn-cancel"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 btn-danger"
              @click="handleConfirm"
            >
              删除
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'move'">
          <h3 class="text-lg font-semibold m-0 mb-4 modal-title">移动到收藏夹</h3>
          <div class="max-h-75 overflow-y-auto mb-5">
            <button
              v-for="col in collections"
              :key="col.id"
              class="w-full flex items-center gap-3 p-3 border-none rounded-xl cursor-pointer transition-all duration-200 move-option"
              @click="handleMoveTarget(col.id)"
            >
              <div
                class="w-9 h-9 flex items-center justify-center rounded-lg"
                :style="{ backgroundColor: col.iconColor + '20' }"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" :style="{ fill: col.iconColor }">
                  <path :d="getIconSvg(col.icon)" />
                </svg>
              </div>
              <span class="flex-1 text-sm text-left move-label">{{ col.name }}</span>
            </button>
          </div>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 btn-cancel"
              @click="emit('close')"
            >
              取消
            </button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active {
  animation: overlay-in 0.2s ease;
}

.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
}

.modal-enter-active .modal-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .modal-card {
  animation: modal-out 0.15s ease forwards;
}

.modal-card {
  background: var(--bg-primary);
}

.modal-title {
  color: var(--text-primary);
}

.modal-input {
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  border: 1px solid var(--border-color);
}
.modal-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 20%, transparent);
}

.error-text {
  color: var(--danger);
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-primary {
  background: var(--accent-primary-dark);
  color: white;
}
.btn-primary:hover {
  background: var(--accent-primary);
}

.btn-disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.delete-desc {
  color: var(--text-secondary);
}

.btn-danger {
  background: var(--danger);
  color: white;
}
.btn-danger:hover {
  filter: brightness(0.9);
}

.move-option {
  background: transparent;
}
.move-option:hover {
  background: var(--bg-secondary);
}

.move-label {
  color: var(--text-primary);
}
</style>
