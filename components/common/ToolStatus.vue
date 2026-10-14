<template>
  <p v-if="message" class="tool-status" :class="`tool-status--${state}`" role="status" aria-live="polite">
    <span v-if="state === 'busy'" class="tool-status__spinner" aria-hidden="true" />
    <span v-else class="tool-status__icon" aria-hidden="true">{{ icon }}</span>
    <span class="tool-status__text">{{ message }}</span>
    <span v-if="progress" class="tool-status__progress">{{ progress }}</span>
  </p>
</template>

<script setup lang="ts">
import type { ToolStatusState } from '~/composables/useToolStatus'

const props = withDefaults(
  defineProps<{
    state?: ToolStatusState
    message?: string
    progress?: string
  }>(),
  { state: 'busy', message: '', progress: '' }
)

const icon = computed(() => {
  if (props.state === 'success') return '✓'
  if (props.state === 'error') return '✕'
  return '!'
})
</script>

<style scoped lang="scss">
.tool-status {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin: 0;
  padding: $spacing-sm $spacing-md;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  line-height: 1.4;
}

.tool-status__icon {
  flex-shrink: 0;
  font-weight: 700;
}

.tool-status__text {
  min-width: 0;
}

.tool-status__progress {
  margin-left: auto;
  flex-shrink: 0;
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  color: $text-muted;
}

.tool-status__spinner {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: tool-status-spin 0.7s linear infinite;
}

@keyframes tool-status-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-status__spinner {
    animation-duration: 1.6s;
  }
}

.tool-status--busy {
  background: $brand-50;
  border-color: $brand-200;
  color: $brand-700;
}

.tool-status--success {
  background: $success-bg;
  border-color: $success-color;
  color: $success-color;
}

.tool-status--error {
  background: $error-bg;
  border-color: $error-color;
  color: $error-color;
}

.tool-status--warning {
  background: $warning-bg;
  border-color: $warning-color;
  color: $warning-color;
}
</style>
