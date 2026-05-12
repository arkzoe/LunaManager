<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="stat-card">
    <div class="value">{{ value }}</div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 14px 16px;
}

.value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.label {
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
