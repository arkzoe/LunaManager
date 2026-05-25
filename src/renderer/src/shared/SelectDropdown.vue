<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt ? opt.label : ''
})

const updateMenuPosition = (): void => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const gap = 4
  const spaceBelow = window.innerHeight - rect.bottom - gap
  const menuHeight = Math.min(props.options.length * 36 + 8, 240)

  let top: number
  if (spaceBelow >= menuHeight) {
    top = rect.bottom + gap
  } else {
    top = rect.top - gap - menuHeight
  }

  menuStyle.value = {
    top: `${top}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`
  }
}

let tick = false
const throttledHandleResize = (): void => {
  if (!tick) {
    tick = true
    requestAnimationFrame(() => {
      if (isOpen.value) updateMenuPosition()
      tick = false
    })
  }
}

const open = (): void => {
  if (props.disabled || props.options.length === 0) return
  isOpen.value = true
  nextTick(updateMenuPosition)
}

const close = (): void => {
  isOpen.value = false
}

const toggleOpen = (): void => {
  if (isOpen.value) close()
  else open()
}

const select = (value: string | number): void => {
  emit('update:modelValue', value)
  close()
}

const handleTriggerClick = (e: MouseEvent): void => {
  e.stopPropagation()
  toggleOpen()
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') close()
}

// 模块级单例：所有 SelectDropdown 实例共享全局 scroll/resize 监听
const globalCallbacks = new Set<() => void>()
let globalListenersAttached = false

function registerGlobalListener(cb: () => void): void {
  globalCallbacks.add(cb)
  if (!globalListenersAttached) {
    window.addEventListener('scroll', cb, true)
    window.addEventListener('resize', cb)
    globalListenersAttached = true
  }
}

function unregisterGlobalListener(cb: () => void): void {
  globalCallbacks.delete(cb)
  if (globalCallbacks.size === 0) {
    window.removeEventListener('scroll', cb, true)
    window.removeEventListener('resize', cb)
    globalListenersAttached = false
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  registerGlobalListener(throttledHandleResize)

  if (triggerRef.value) {
    resizeObserver = new ResizeObserver(throttledHandleResize)
    resizeObserver.observe(triggerRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unregisterGlobalListener(throttledHandleResize)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="sd-root">
    <button
      ref="triggerRef"
      class="sd-trigger"
      :class="{ disabled: disabled }"
      :disabled="disabled"
      @click="handleTriggerClick"
    >
      <span class="sd-value" :class="{ placeholder: !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <svg class="sd-arrow" :class="{ open: isOpen }" viewBox="0 0 24 24" width="12" height="12">
        <path d="M7 10l5 5 5-5z" fill="currentColor" />
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" class="sd-overlay" @click="close" @keydown="handleKeydown" />
      <Transition name="sd">
        <div v-if="isOpen" class="sd-menu" :style="menuStyle">
          <div
            v-for="opt in options"
            :key="opt.value"
            class="sd-option"
            :class="{ selected: modelValue === opt.value }"
            @click.stop="select(opt.value)"
          >
            {{ opt.label }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.sd-root {
  position: relative;
  display: inline-block;
}

.sd-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  line-height: 1;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.sd-trigger:focus-visible,
.sd-trigger:hover:not(.disabled) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.sd-trigger.disabled {
  opacity: 0.5;
  cursor: default;
}

.sd-value {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd-value.placeholder {
  color: var(--text-muted);
}

.sd-arrow {
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: transform 0.2s;
}

.sd-arrow.open {
  transform: rotate(180deg);
}

/* overlay */
.sd-overlay {
  position: fixed;
  inset: 0;
  z-index: 1099;
  background: transparent;
}

/* dropdown menu */
.sd-menu {
  position: fixed;
  z-index: 1100;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
}

.sd-option {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: inherit;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
  white-space: nowrap;
}

.sd-option:hover {
  background: var(--bg-hover);
}

.sd-option.selected {
  background: rgba(59, 130, 246, 0.08);
  color: var(--accent-primary);
  font-weight: 600;
}

/* transition */
.sd-enter-active {
  animation: dropdown-in 0.15s ease;
}

.sd-leave-active {
  animation: dropdown-out 0.1s ease forwards;
}
</style>
