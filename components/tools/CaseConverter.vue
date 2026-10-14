<template>
  <div class="tool">
    <ToolField :label="t('common.input')">
      <textarea v-model="text" class="tool__area" :placeholder="t('ui.pasteOrType')" />
    </ToolField>

    <div class="tool__list">
      <div v-for="item in results" :key="item.key" class="tool__item">
        <span class="tool__item-label">{{ item.label }}</span>
        <code class="tool__item-value">{{ item.value }}</code>
        <CopyButton :value="item.value" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const text = ref('The quick brown fox jumps over the lazy dog')

const toWords = (s: string) => (s.trim().match(/[\p{L}\p{N}'’_-]+/gu) || []) as string[]

function capitalizeWord(w: string) {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

const results = computed(() => {
  const s = text.value
  const words = toWords(s)
  const lower = s.toLowerCase()
  const upper = s.toUpperCase()
  const title = words.map(capitalizeWord).join(' ')
  const sentence = lower
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
  const camel = words
    .map((w, i) => (i === 0 ? w.toLowerCase() : capitalizeWord(w.toLowerCase())))
    .join('')
  const pascal = words.map((w) => capitalizeWord(w.toLowerCase())).join('')
  const snake = words.map((w) => w.toLowerCase()).join('_')
  const constant = words.map((w) => w.toUpperCase()).join('_')
  const kebab = words.map((w) => w.toLowerCase()).join('-')
  const alternating = [...s]
    .map((ch, i) => (i % 2 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')

  return [
    { key: 'upper', label: t('ui.uppercase'), value: upper },
    { key: 'lower', label: t('ui.lowercase'), value: lower },
    { key: 'title', label: t('ui.titleCase'), value: title },
    { key: 'sentence', label: t('ui.sentenceCase'), value: sentence },
    { key: 'camel', label: t('ui.camelCase'), value: camel },
    { key: 'pascal', label: t('ui.pascalCase'), value: pascal },
    { key: 'snake', label: t('ui.snakeCase'), value: snake },
    { key: 'constant', label: t('ui.constantCase'), value: constant },
    { key: 'kebab', label: t('ui.kebabCase'), value: kebab },
    { key: 'alternating', label: t('ui.alternatingCase'), value: alternating }
  ]
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__area {
  @include input-base;
  min-height: 130px;
  resize: vertical;
}

.tool__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tool__item {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) auto;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
  transition: border-color $transition-fast;

  &:hover {
    border-color: $border-strong;
  }

  @include mobile {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.tool__item-label {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $text-muted;
}

.tool__item-value {
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  color: $text-primary;
  word-break: break-all;
  max-height: 3.2em;
  overflow: hidden;
}
</style>
