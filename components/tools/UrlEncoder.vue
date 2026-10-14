<template>
  <div class="tool">
    <div class="tool__mode">
      <div class="tool__tabs">
        <button type="button" class="tool__tab" :class="{ 'is-active': mode === 'encode' }" @click="mode = 'encode'">
          {{ t('ui.encode') }}
        </button>
        <button type="button" class="tool__tab" :class="{ 'is-active': mode === 'decode' }" @click="mode = 'decode'">
          {{ t('ui.decode') }}
        </button>
      </div>
      <div class="tool__btns">
        <label v-for="c in components" :key="c" class="tool__radio">
          <input v-model="component" type="radio" :value="c" name="url-comp" />
          <span>{{ c === 'component' ? t('ui.queryString') : t('ui.fullUrl') }}</span>
        </label>
      </div>
    </div>

    <ToolField :label="t('common.input')">
      <textarea
        v-model="input"
        class="tool__area"
        spellcheck="false"
        :placeholder="mode === 'encode' ? 'https://example.com/search?q=free tools&page=1' : 'https%3A%2F%2Fexample.com'"
      />
    </ToolField>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <ResultBox :value="output" downloadable download-name="url.txt" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const mode = ref<'encode' | 'decode'>('encode')
const component = ref<'component' | 'full'>('component')
const components = ['component', 'full'] as const
const input = ref('https://example.com/search?q=free online tools&page=1')
const error = ref('')

const output = computed(() => {
  error.value = ''
  const raw = input.value
  if (!raw) return ''
  try {
    if (mode.value === 'encode') {
      return component.value === 'component' ? encodeURIComponent(raw) : encodeURI(raw)
    }
    return component.value === 'component' ? decodeURIComponent(raw) : decodeURI(raw)
  } catch {
    error.value = t('ui.invalidInput')
    return ''
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__mode {
  @include flex-between;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.tool__tabs {
  @include flex-start;
  gap: 2px;
  padding: 3px;
  background: $bg-subtle;
  border-radius: $radius-sm;
}

.tool__tab {
  @include button-base;
  padding: 5px $spacing-md;
  font-size: $font-size-sm;
  background: transparent;
  color: $text-secondary;

  &.is-active {
    background: $bg-white;
    color: $accent-color;
    box-shadow: $shadow-xs;
  }
}

.tool__btns {
  display: flex;
  gap: $spacing-md;
}

.tool__radio {
  @include flex-start;
  gap: 5px;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__area {
  @include input-base;
  min-height: 150px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  word-break: break-all;
}

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
}
</style>
