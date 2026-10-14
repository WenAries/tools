<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField class="tool__full" :label="t('common.input')">
        <textarea
          v-model="input"
          class="tool__area"
          spellcheck="false"
          :placeholder="t('ui.pasteOrType')"
        />
      </ToolField>

      <ToolField :label="t('ui.indent')">
        <select v-model.number="indent" class="tool__select">
          <option :value="2">2 {{ t('ui.pixels') }}</option>
          <option :value="4">4 {{ t('ui.pixels') }}</option>
          <option value="-1">Tab</option>
        </select>
      </ToolField>

      <ToolField :label="t('common.options')">
        <label class="tool__check">
          <input v-model="sortKeys" type="checkbox" />
          <span>{{ t('ui.sortKeys') }}</span>
        </label>
      </ToolField>

      <ToolField :label="t('common.output')">
        <div class="tool__btns">
          <button type="button" class="tool__btn tool__btn--primary" @click="mode = 'pretty'">
            {{ t('ui.beautify') }}
          </button>
          <button type="button" class="tool__btn" @click="mode = 'minify'">
            {{ t('ui.minify') }}
          </button>
          <button type="button" class="tool__btn" @click="mode = 'validate'">
            {{ t('ui.validate') }}
          </button>
          <button type="button" class="tool__btn tool__btn--ghost" @click="clearAll">
            {{ t('common.clear') }}
          </button>
        </div>
      </ToolField>
    </div>

    <div v-if="error" class="tool__error" role="alert">
      <strong>{{ t('ui.invalidJson') }}</strong>
      <span>{{ error }}</span>
    </div>
    <div v-else-if="input.trim() && !error" class="tool__ok" role="status">
      ✓ {{ t('ui.validJson') }}
    </div>

    <ResultBox
      :value="output"
      copyable
      downloadable
      :download-name="mode === 'minify' ? 'data.min.json' : 'data.json'"
      download-mime="application/json;charset=utf-8"
    >
      <template #actions>
        <span v-if="sizes" class="tool__sizes">
          {{ t('ui.originalSize') }} {{ sizes.in }} → {{ t('ui.outputSize') }} {{ sizes.out }}
          <em v-if="sizes.savedPct > 0">{{ t('ui.saved') }} {{ sizes.savedPct }}%</em>
        </span>
      </template>
    </ResultBox>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const input = ref('')
const mode = ref<'pretty' | 'minify' | 'validate'>('pretty')
const indent = ref(2)
const sortKeys = ref(false)

const parsed = ref<unknown>(null)
const error = ref('')

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortDeep(v)])
    )
  }
  return value
}

const output = computed(() => {
  error.value = ''
  if (!input.value.trim()) {
    parsed.value = null
    return ''
  }
  try {
    parsed.value = JSON.parse(input.value)
    error.value = ''
  } catch (e) {
    const err = e as Error
    const m = /position (\d+)/.exec(err.message)
    const loc = m
      ? (() => {
          const before = input.value.slice(0, Number(m[1]))
          return ` · L${before.split('\n').length}:C${Number(m[1]) - before.lastIndexOf('\n')}`
        })()
      : ''
    error.value = `${err.message}${loc}`
    return ''
  }

  if (mode.value === 'validate') {
    return JSON.stringify(parsed.value, null, indent.value === -1 ? '\t' : indent.value)
  }

  const data = sortKeys.value ? sortDeep(parsed.value) : parsed.value
  return mode.value === 'minify'
    ? JSON.stringify(data)
    : JSON.stringify(data, null, indent.value === -1 ? '\t' : indent.value)
})

const sizes = computed(() => {
  if (!input.value.trim() || !output.value) return null
  const inB = new TextEncoder().encode(input.value).length
  const outB = new TextEncoder().encode(output.value).length
  return {
    in: formatBytes(inB),
    out: formatBytes(outB),
    savedPct: inB > 0 && outB < inB ? Math.round((1 - outB / inB) * 100) : 0
  }
})

function clearAll() {
  input.value = ''
  error.value = ''
}
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__full {
  grid-column: 1 / -1;
}

.tool__area {
  @include input-base;
  min-height: 180px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.6;
}

.tool__select {
  @include input-base;
  height: 40px;
}

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  height: 40px;
  font-size: $font-size-base;
  color: $text-secondary;
  cursor: pointer;
}

.tool__btns {
  @include flex-start;
  flex-wrap: wrap;
  gap: $spacing-xs;
  height: 40px;
}

.tool__btn {
  @include button-ghost;
  font-size: $font-size-sm;

  &--primary {
    background: $accent-color;
    border-color: $accent-color;
    color: #fff;

    &:hover:not(:disabled) {
      background: $accent-hover;
      color: #fff;
    }
  }
}

.tool__error {
  @include flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
  overflow: auto;
}

.tool__ok {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $success-bg;
  color: $success-color;
  font-size: $font-size-sm;
}

.tool__sizes {
  font-size: $font-size-xs;
  color: $text-muted;

  em {
    font-style: normal;
    color: $success-color;
    font-weight: 600;
    margin-left: $spacing-xs;
  }
}
</style>
