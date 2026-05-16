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
      @click.self="emit('close')"
    >
      <div class="w-90% max-w-100 bg-bg-primary rounded-2xl p-6 modal-card">
        <template v-if="mode === 'create'">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">新建收藏夹</h3>
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入收藏夹名称"
            class="w-full h-11 px-4 bg-bg-secondary rounded-xl text-text-primary text-15px mb-1 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            @keyup.enter="handleConfirm"
          />
          <p v-if="nameError" class="text-xs text-danger-500 m-0 mb-4 ml-1">{{ nameError }}</p>
          <p v-else class="text-xs m-0 mb-4">&nbsp;</p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
              :class="
                canSubmit
                  ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand hover:shadow-brand-lg'
                  : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
              "
              :disabled="!canSubmit"
              @click="handleConfirm"
            >
              创建
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'rename'">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">重命名收藏夹</h3>
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入新名称"
            class="w-full h-11 px-4 bg-bg-secondary rounded-xl text-text-primary text-15px mb-1 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            @keyup.enter="handleConfirm"
          />
          <p v-if="nameError" class="text-xs text-danger-500 m-0 mb-4 ml-1">{{ nameError }}</p>
          <p v-else class="text-xs m-0 mb-4">&nbsp;</p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200"
              :class="
                canSubmit
                  ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand hover:shadow-brand-lg'
                  : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
              "
              :disabled="!canSubmit"
              @click="handleConfirm"
            >
              确认
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'delete'">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">删除收藏夹</h3>
          <p class="text-sm text-text-secondary m-0 mb-5 leading-relaxed">
            确定要删除 "{{ collection?.name }}" 吗？收藏夹中的游戏不会被删除。
          </p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-danger-500 text-white hover:bg-danger-600 shadow-danger hover:shadow-danger-lg"
              @click="handleConfirm"
            >
              删除
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'move'">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">移动到收藏夹</h3>
          <div class="max-h-75 overflow-y-auto mb-5">
            <button
              v-for="col in collections"
              :key="col.id"
              class="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-xl cursor-pointer transition-all duration-200 hover:bg-bg-secondary"
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
              <span class="flex-1 text-sm text-text-primary text-left">{{ col.name }}</span>
            </button>
          </div>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
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
</style>
