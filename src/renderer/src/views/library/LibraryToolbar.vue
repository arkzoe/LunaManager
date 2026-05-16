<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  searchQuery: string
  viewMode: 'grid' | 'list'
  showImportMenu: boolean
  batchMode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:viewMode', val: 'grid' | 'list'): void
  (e: 'toggleImportMenu'): void
  (e: 'manualImport'): void
  (e: 'batchImport'): void
  (e: 'toggleBatchMode'): void
}>()

const importBtnRef = ref<HTMLElement | null>(null)
void importBtnRef.value /* TODO: 用于后续下拉菜单定位 */
</script>

<template>
  <div class="toolbar">
    <div class="search-box">
      <svg
        viewBox="0 0 24 24"
        class="search-icon"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        :value="searchQuery"
        placeholder="搜索游戏名称..."
        class="search-input"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="tb-actions">
      <div class="view-toggle">
        <button
          class="vt-btn"
          :class="{ active: viewMode === 'grid' }"
          title="网格视图"
          @click="emit('update:viewMode', 'grid')"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
          </svg>
        </button>
        <button
          class="vt-btn"
          :class="{ active: viewMode === 'list' }"
          title="列表视图"
          @click="emit('update:viewMode', 'list')"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
            <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
          </svg>
        </button>
      </div>

      <button
        class="bb-btn"
        :class="{ active: batchMode }"
        title="批量操作"
        @click="emit('toggleBatchMode')"
      >
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
        </svg>
      </button>

      <div class="import-dropdown">
        <button ref="importBtnRef" class="btn-primary btn-sm" @click="emit('toggleImportMenu')">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          导入
          <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current dropdown-arrow">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <Transition name="dropdown">
          <div v-if="showImportMenu" class="import-menu-local">
            <button class="ctx-item" @click="emit('manualImport')">
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              手动导入
            </button>
            <button class="ctx-item" @click="emit('batchImport')">
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                <path
                  d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm0-4H6v-2h8v2z"
                />
              </svg>
              批量导入
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 34px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.view-toggle {
  display: flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.vt-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.vt-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.vt-btn.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.import-dropdown {
  position: relative;
}

.dropdown-arrow {
  margin-left: 2px;
}

.import-menu-local {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 100;
  min-width: 140px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  overflow: hidden;
}

.dropdown-enter-active {
  animation: dropdown-in 0.18s ease;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease forwards;
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
  transition: all 0.1s;
  text-align: left;
}

.ctx-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.bb-btn {
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bb-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.bb-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}
</style>
