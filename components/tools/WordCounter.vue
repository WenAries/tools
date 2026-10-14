<template>
  <div class="tool">
    <ToolField :label="t('common.input')">
      <textarea
        v-model="text"
        class="tool__area"
        :placeholder="t('ui.pasteOrType')"
      />
    </ToolField>

    <div class="tool__stats">
      <div v-for="s in mainStats" :key="s.label" class="tool__stat">
        <span class="tool__stat-value">{{ s.value }}</span>
        <span class="tool__stat-label">{{ s.label }}</span>
      </div>
    </div>

    <div class="tool__extra">
      <div v-for="s in extraStats" :key="s.label" class="tool__extra-item">
        <span class="tool__extra-label">{{ s.label }}</span>
        <span class="tool__extra-value">{{ s.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()

const text = ref('')

const words = computed(() => (text.value.trim().match(/[\p{L}\p{N}'’_-]+/gu) || []) as string[])
const sentences = computed(() => (text.value.match(/[.!?…。！？]+(?=\s|$)/g) || []).length)
const paragraphs = computed(() =>
  text.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length
)
const lines = computed(() => (text.value === '' ? 0 : text.value.split('\n').length))
const noSpaces = computed(() => text.value.replace(/\s/g, '').length)
const readingTime = computed(() => Math.max(1, Math.round(words.value.length / 225)))
const speakingTime = computed(() => Math.max(1, Math.round(words.value.length / 130)))
const uniqueWords = computed(() => new Set(words.value.map((w) => w.toLowerCase())).size)
const longestWord = computed(() =>
  words.value.reduce((a, b) => (b.length > a.length ? b : a), '')
)
const avgWordsPerSentence = computed(() =>
  sentences.value ? (words.value.length / sentences.value).toFixed(1) : '0'
)

const mainStats = computed(() => [
  { label: t('ui.words'), value: words.value.length.toLocaleString(locale.value) },
  { label: t('ui.characters'), value: text.value.length.toLocaleString(locale.value) },
  { label: t('ui.charactersNoSpaces'), value: noSpaces.value.toLocaleString(locale.value) },
  { label: t('ui.readingTime'), value: `${readingTime.value} ${t('ui.minutes')}` },
  { label: t('ui.speakingTime'), value: `${speakingTime.value} ${t('ui.minutes')}` },
  { label: t('ui.sentences'), value: sentences.value.toLocaleString(locale.value) }
])

const extraStats = computed(() => [
  { label: t('ui.paragraphs'), value: paragraphs.value.toLocaleString(locale.value) },
  { label: t('ui.lines'), value: lines.value.toLocaleString(locale.value) },
  { label: t('ui.uniqueWords'), value: uniqueWords.value.toLocaleString(locale.value) },
  { label: t('ui.avgWordsPerSentence'), value: avgWordsPerSentence.value },
  { label: t('ui.longestWord'), value: longestWord.value || '—' },
  { label: 'Bytes', value: new TextEncoder().encode(text.value).length.toLocaleString(locale.value) }
])
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
  min-height: 200px;
  resize: vertical;
  font-size: $font-size-base;
  line-height: 1.7;
}

.tool__stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: $spacing-sm;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @include mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.tool__stat {
  @include surface;
  padding: $spacing-sm $spacing-md;
  text-align: center;
}

.tool__stat-value {
  display: block;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $accent-color;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.tool__stat-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: $text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool__extra {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-xs;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__extra-item {
  @include flex-between;
  padding: 6px $spacing-sm;
  border-radius: $radius-sm;
  background: $bg-subtle;
  font-size: $font-size-xs;
}

.tool__extra-label {
  color: $text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__extra-value {
  font-family: $font-family-mono;
  color: $text-primary;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
