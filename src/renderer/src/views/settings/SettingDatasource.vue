<script setup lang="ts">
defineProps<{
  metadataSource: string
  autoSyncMetadata: boolean
  vndbApiKey: string
  bangumiToken: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:metadataSource': [value: string]
  'update:autoSyncMetadata': [value: boolean]
  'update:vndbApiKey': [value: string]
  'update:bangumiToken': [value: string]
  'testBangumi': []
  'testVndb': []
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
        <select
          :value="metadataSource"
          class="sselect"
          @change="emit('update:metadataSource', ($event.target as HTMLSelectElement).value)"
        >
          <option value="vndb">VNDB</option>
          <option value="bangumi">Bangumi</option>
        </select>
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
          <input
            :value="vndbApiKey"
            type="password"
            placeholder="输入 API Key"
            class="sinput token"
            @input="emit('update:vndbApiKey', ($event.target as HTMLInputElement).value)"
          />
          <button class="sbtn sbtn-secondary" @click="emit('testVndb')">测试</button>
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">Bangumi Token</span>
          <span class="setting-desc">用于访问 Bangumi API 的用户令牌</span>
        </div>
        <div class="setting-actions">
          <input
            :value="bangumiToken"
            type="password"
            placeholder="输入 Token"
            class="sinput token"
            @input="emit('update:bangumiToken', ($event.target as HTMLInputElement).value)"
          />
          <button class="sbtn sbtn-secondary" @click="emit('testBangumi')">测试</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
