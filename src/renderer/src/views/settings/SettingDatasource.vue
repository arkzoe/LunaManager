<script setup lang="ts">
import SelectDropdown from '../../shared/SelectDropdown.vue'

interface TestResult {
  source: 'vndb' | 'bangumi'
  loading: boolean
  ok?: boolean
  message?: string
}

defineProps<{
  metadataSource: string
  autoSyncMetadata: boolean
  vndbApiKey: string
  bangumiToken: string
  testResult: TestResult | null
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:metadataSource': [value: string]
  'update:autoSyncMetadata': [value: boolean]
  'update:vndbApiKey': [value: string]
  'update:bangumiToken': [value: string]
  testBangumi: []
  testVndb: []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="datasource" class="setting-group">
    <h3 class="group-title">数据源</h3>
    <div class="group-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认数据源</span>
          <span class="setting-desc">元数据刮削的首选数据源</span>
        </div>
        <SelectDropdown
          :model-value="metadataSource"
          :options="[
            { value: 'vndb', label: 'VNDB' },
            { value: 'bangumi', label: 'Bangumi' }
          ]"
          class="sselect"
          @update:model-value="emit('update:metadataSource', $event as string)"
        />
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自动同步元数据</span>
          <span class="setting-desc">导入游戏时自动从数据源获取信息</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="autoSyncMetadata"
            @change="emit('update:autoSyncMetadata', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">VNDB API Key</span>
          <span class="setting-desc">用于访问 VNDB 数据库的 API 密钥</span>
        </div>
        <div class="setting-actions">
          <div class="input-with-clear">
            <input
              :value="vndbApiKey"
              type="password"
              placeholder="输入 API Key"
              class="sinput token"
              @input="emit('update:vndbApiKey', ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="vndbApiKey"
              class="clear-btn"
              tabindex="-1"
              @click="emit('update:vndbApiKey', '')"
            >
              &times;
            </button>
          </div>
          <button class="sbtn sbtn-secondary" @click="emit('testVndb')">
            {{ vndbApiKey ? '测试' : '获取令牌' }}
          </button>
        </div>
      </div>
      <div
        v-if="testResult?.source === 'vndb'"
        class="test-feedback"
        :class="{ ok: testResult.ok, err: !testResult.ok && !testResult.loading }"
      >
        <svg v-if="testResult.loading" viewBox="0 0 24 24" class="w-4 h-4 spin">
          <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
        </svg>
        <svg v-else-if="testResult.ok" viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          />
        </svg>
        <span>{{ testResult.loading ? '测试中...' : testResult.message }}</span>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">Bangumi Token</span>
          <span class="setting-desc">用于访问 Bangumi API 的用户令牌</span>
        </div>
        <div class="setting-actions">
          <div class="input-with-clear">
            <input
              :value="bangumiToken"
              type="password"
              placeholder="输入 Token"
              class="sinput token"
              @input="emit('update:bangumiToken', ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="bangumiToken"
              class="clear-btn"
              tabindex="-1"
              @click="emit('update:bangumiToken', '')"
            >
              &times;
            </button>
          </div>
          <button class="sbtn sbtn-secondary" @click="emit('testBangumi')">
            {{ bangumiToken ? '测试' : '获取令牌' }}
          </button>
        </div>
      </div>
      <div
        v-if="testResult?.source === 'bangumi'"
        class="test-feedback"
        :class="{ ok: testResult.ok, err: !testResult.ok && !testResult.loading }"
      >
        <svg v-if="testResult.loading" viewBox="0 0 24 24" class="w-4 h-4 spin">
          <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
        </svg>
        <svg v-else-if="testResult.ok" viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
          />
        </svg>
        <span>{{ testResult.loading ? '测试中...' : testResult.message }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import './shared.css';

.test-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  margin-left: 0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.test-feedback.ok {
  background: rgba(34, 197, 94, 0.08);
  color: #22c55e;
}

.test-feedback.err {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.input-with-clear {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-clear .sinput.token {
  padding-right: 28px;
}

.clear-btn {
  position: absolute;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  line-height: 1;
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
