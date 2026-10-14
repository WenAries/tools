<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField :label="t('ui.original')">
        <textarea v-model="left" class="tool__area" spellcheck="false" />
      </ToolField>
      <ToolField :label="t('ui.changed')">
        <textarea v-model="right" class="tool__area" spellcheck="false" />
      </ToolField>
    </div>

    <div class="tool__options">
      <label class="tool__check">
        <input v-model="ignoreCase" type="checkbox" />
        <span>{{ t('ui.ignoreCase') }}</span>
      </label>
      <div class="tool__legend">
        <span class="tool__legend-item tool__legend-item--add">{{ t('ui.added') }} ({{ addCount }})</span>
        <span class="tool__legend-item tool__legend-item--del">{{ t('ui.removed') }} ({{ delCount }})</span>
        <span class="tool__legend-item">{{ t('ui.unchanged') }} ({{ sameCount }})</span>
      </div>
    </div>

    <p v-if="identical" class="tool__identical">✓ {{ t('ui.noDifferences') }}</p>

    <div v-else class="tool__diff">
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="tool__row"
        :class="{ 'is-add': row.type === 'add', 'is-del': row.type === 'del' }"
      >
        <span class="tool__row-type" aria-hidden="true">
          {{ row.type === 'add' ? '+' : row.type === 'del' ? '−' : ' ' }}
        </span>
        <code>{{ row.text || '\u00a0' }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { diffLines } from 'diff'

const { t } = useI18n()

const left = ref(`The quick brown fox\njumps over the lazy dog.\nLine three stays.\nLine four is removed.`)
const right = ref(`The quick brown fox\nleaps over the lazy dog.\nLine three stays.\nA new line was added.`)

const ignoreCase = ref(false)

const identical = computed(() => normalize(left.value) === normalize(right.value))

function normalize(s: string) {
  let out = s
  if (ignoreCase.value) out = out.toLowerCase()
  return out
}

const rows = computed(() => {
  if (identical.value) return []
  const diff = diffLines(left.value, right.value, { ignoreCase: ignoreCase.value })
  const out: Array<{ text: string; type: 'add' | 'del' | 'same' }> = []
  for (const part of diff) {
    const type = part.added ? 'add' : part.removed ? 'del' : 'same'
    const lines = part.value.replace(/\n$/, '').split('\n')
    for (const line of lines) out.push({ text: line, type })
  }
  return out
})

const addCount = computed(() => rows.value.filter((r) => r.type === 'add').length)
const delCount = computed(() => rows.value.filter((r) => r.type === 'del').length)
const sameCount = computed(() => rows.value.filter((r) => r.type === 'same').length)
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__area {
  @include input-base;
  min-height: 150px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.6;
}

.tool__options {
  @include flex-between;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__legend {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.tool__legend-item {
  font-size: $font-size-xs;
  padding: 2px 9px;
  border-radius: $radius-full;
  background: $bg-subtle;
  color: $text-secondary;

  &--add {
    background: $success-bg;
    color: $success-color;
  }

  &--del {
    background: $error-bg;
    color: $error-color;
  }
}

.tool__identical {
  padding: $spacing-md;
  text-align: center;
  border-radius: $radius-sm;
  background: $success-bg;
  color: $success-color;
  font-size: $font-size-sm;
}

.tool__diff {
  @include surface;
  padding: $spacing-sm;
  max-height: 55vh;
  overflow: auto;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.6;
}

.tool__row {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $spacing-xs;

  code {
    font-family: inherit;
    color: $text-primary;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &.is-add {
    background: rgba(5, 150, 105, 0.1);

    .tool__row-type {
      color: $success-color;
      font-weight: 700;
    }

    code {
      color: $success-color;
    }
  }

  &.is-del {
    background: rgba(220, 38, 38, 0.08);
    text-decoration: line-through;
    text-decoration-color: rgba(220, 38, 38, 0.35);

    .tool__row-type {
      color: $error-color;
      font-weight: 700;
    }

    code {
      color: $error-color;
    }
  }
}

.tool__row-type {
  width: 12px;
  flex-shrink: 0;
  text-align: center;
  color: $text-placeholder;
  user-select: none;
}
</style>
