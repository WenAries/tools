<template>
  <div class="result-box" :class="{ 'result-box--empty': !hasContent }">
    <div class="result-box__head">
      <span class="result-box__title">{{ title || t('common.output') }}</span>
      <div class="result-box__actions">
        <slot name="actions" />
        <CopyButton v-if="hasContent && copyable" :value="() => stringValue" />
        <button
          v-if="hasContent && downloadable"
          class="result-box__dl"
          type="button"
          @click="download"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 19h14" />
          </svg>
          {{ downloadLabel || t('common.download') }}
        </button>
      </div>
    </div>

    <div class="result-box__body">
      <slot>{{ stringValue || t('ui.resultPlaceholder') }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value?: string
    title?: string
    copyable?: boolean
    downloadable?: boolean
    downloadName?: string
    downloadMime?: string
    downloadLabel?: string
  }>(),
  {
    value: '',
    title: '',
    copyable: true,
    downloadable: false,
    downloadName: 'result.txt',
    downloadMime: 'text/plain;charset=utf-8',
    downloadLabel: ''
  }
)

const { t } = useI18n()
const { downloadText } = useFileDownload()
const slot = useSlots()

const stringValue = computed(() => props.value ?? '')
const hasContent = computed(() => Boolean(stringValue.value) || Boolean(slot.default))

function download() {
  if (!stringValue.value) return
  downloadText(stringValue.value, props.downloadName, props.downloadMime)
}
</script>

<style scoped lang="scss">
.result-box {
  @include surface;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-box__head {
  @include flex-between;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-subtle;
  border-bottom: 1px solid $border-color;
}

.result-box__title {
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: $text-muted;
}

.result-box__actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.result-box__dl {
  @include button-ghost;
  font-size: $font-size-sm;
  padding: 5px $spacing-sm;

  svg {
    width: 14px;
    height: 14px;
  }
}

.result-box__body {
  flex: 1;
  padding: $spacing-md;
  font-size: $font-size-base;
  font-family: $font-family-mono;
  color: $text-primary;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 60vh;
}

.result-box--empty .result-box__body {
  color: $text-placeholder;
  font-family: $font-family;
  font-style: italic;
}
</style>
