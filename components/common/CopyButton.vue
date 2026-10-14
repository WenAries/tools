<template>
  <button class="copy-btn" type="button" :class="{ 'is-copied': copied }" @click="onCopy">
    <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
    <span>{{ copied ? t('common.copied') : label || t('common.copy') }}</span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ value: string | (() => string); label?: string }>(), {
  label: ''
})

const { t } = useI18n()
const { copy, copied } = useCopy()

async function onCopy() {
  const text = typeof props.value === 'function' ? props.value() : props.value
  await copy(text)
}
</script>

<style scoped lang="scss">
.copy-btn {
  @include button-ghost;
  font-size: $font-size-sm;
  padding: 5px $spacing-sm;

  svg {
    width: 14px;
    height: 14px;
  }

  &.is-copied {
    color: $success-color;
    border-color: rgba(5, 150, 105, 0.35);
    background: $success-bg;
  }
}
</style>
