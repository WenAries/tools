<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField :label="t('ui.pattern')">
        <div class="tool__pattern">
          <span class="tool__slash" aria-hidden="true">/</span>
          <input v-model="pattern" class="tool__input tool__input--bare" type="text" spellcheck="false" />
          <span class="tool__slash" aria-hidden="true">/</span>
        </div>
      </ToolField>

      <ToolField :label="t('ui.flags')">
        <div class="tool__flags">
          <label v-for="f in flagList" :key="f.char" class="tool__flag">
            <input v-model="flags" type="checkbox" :value="f.char" />
            <span :title="f.desc">{{ f.char }}</span>
          </label>
        </div>
      </ToolField>

      <ToolField class="tool__full" :label="t('ui.testString')">
        <textarea v-model="testString" class="tool__area tool__area--sm" spellcheck="false" />
      </ToolField>
    </div>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <template v-else>
      <div class="tool__meta">
        <span><strong>{{ matches.length }}</strong> {{ t('ui.matches') }}</span>
        <span v-if="groups.length"><strong>{{ groups.length }}</strong> {{ t('ui.matchGroups') }}</span>
      </div>

      <ToolField :label="t('ui.matches')">
        <p v-if="highlight.length === 0" class="tool__nomatch">{{ t('ui.noMatches') }}</p>
        <p v-else class="tool__highlight" aria-live="polite">
          <template v-for="(seg, i) in highlight" :key="i">
            <mark v-if="seg.hit" class="tool__mark">{{ seg.text }}</mark>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </ToolField>

      <div v-if="matches.length" class="tool__list">
        <div v-for="(m, i) in matches.slice(0, 50)" :key="i" class="tool__match">
          <span class="tool__match-idx">#{{ i + 1 }}</span>
          <code class="tool__match-text">{{ m[0] }}</code>
          <span v-if="m.length > 1" class="tool__match-groups">
            <code v-for="(g, gi) in m.slice(1)" :key="gi" :class="{ 'is-empty': g === undefined }">
              {{ gi + 1 }}: {{ g === undefined ? '—' : g }}
            </code>
          </span>
        </div>
      </div>

      <ToolField :label="t('ui.replaceWith')">
        <input v-model="replacement" class="tool__input" type="text" spellcheck="false" />
      </ToolField>

      <ResultBox v-if="matches.length" :value="replaced" :title="t('ui.replaceWith')" />
    </template>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const pattern = ref('(\\w+)@(\\w+)\\.(com|dev)')
const testString = ref('Contact ada@lovelace.dev or grace@hopper.com for details.')
const replacement = ref('$1 at $2 dot $3')

const flagList = [
  { char: 'g', desc: 'global' },
  { char: 'i', desc: 'ignore case' },
  { char: 'm', desc: 'multiline' },
  { char: 's', desc: 'dot all' },
  { char: 'u', desc: 'unicode' },
  { char: 'y', desc: 'sticky' }
]
const flags = ref<string[]>(['g', 'i'])

const error = ref('')

const regex = computed(() => {
  error.value = ''
  if (!pattern.value) return null
  try {
    return new RegExp(pattern.value, [...new Set(flags.value)].join(''))
  } catch (e) {
    error.value = (e as Error).message
    return null
  }
})

const matches = computed(() => {
  const re = regex.value
  if (!re || !testString.value) return []
  const out: RegExpExecArray[] = []
  const source = re.global || re.sticky ? re : new RegExp(re.source, re.flags + 'g')
  source.lastIndex = re.sticky ? re.lastIndex : 0
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = source.exec(testString.value)) !== null) {
    out.push(m)
    if (m.index === source.lastIndex) source.lastIndex++
    if (++guard > 1000) break
  }
  return out
})

const groups = computed(() => (matches.value[0] ? Math.max(0, matches.value[0].length - 1) : 0))

type Seg = { text: string; hit: boolean }
const highlight = computed<Seg[]>(() => {
  const re = regex.value
  if (!re || !testString.value) return []
  const segs: Seg[] = []
  let last = 0
  for (const m of matches.value) {
    if (m.index > last) segs.push({ text: testString.value.slice(last, m.index), hit: false })
    segs.push({ text: m[0], hit: true })
    last = m.index + m[0].length
    if (!m[0].length) last++
  }
  if (last < testString.value.length) segs.push({ text: testString.value.slice(last), hit: false })
  return segs
})

const replaced = computed(() => {
  const re = regex.value
  if (!re) return ''
  try {
    const source = re.global || re.sticky ? re : new RegExp(re.source, re.flags + 'g')
    return testString.value.replace(source, replacement.value)
  } catch {
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

.tool__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__full {
  grid-column: 1 / -1;
}

.tool__pattern {
  @include flex-start;
  height: 40px;
  padding: 0 $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
  transition: border-color $transition-fast, box-shadow $transition-fast;

  &:focus-within {
    border-color: $accent-color;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }
}

.tool__slash {
  font-family: $font-family-mono;
  color: $accent-color;
  font-weight: 700;
}

.tool__input {
  @include input-base;
  height: 40px;

  &--bare {
    border: none;
    box-shadow: none;
    height: 100%;
    padding: 0 $spacing-xs;
    font-family: $font-family-mono;
  }
}

.tool__flags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  height: 40px;
  align-items: center;
}

.tool__flag {
  display: inline-flex;

  input {
    display: none;
  }

  span {
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 30px;
    padding: 0 6px;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    color: $text-muted;
    cursor: pointer;
    transition: all $transition-fast;
  }

  input:checked + span {
    background: $accent-color;
    border-color: $accent-color;
    color: #fff;
    font-weight: 700;
  }
}

.tool__area {
  @include input-base;
  min-height: 200px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.6;

  &--sm {
    min-height: 120px;
  }
}

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
}

.tool__meta {
  @include flex-start;
  gap: $spacing-md;
  font-size: $font-size-sm;
  color: $text-secondary;

  strong {
    color: $accent-color;
    font-family: $font-family-mono;
  }
}

.tool__highlight {
  padding: $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 260px;
  overflow: auto;
}

.tool__mark {
  background: rgba(250, 204, 21, 0.45);
  color: inherit;
  border-radius: 3px;
  padding: 1px 2px;
}

.tool__nomatch {
  color: $text-placeholder;
  font-size: $font-size-sm;
  padding: $spacing-md;
  border: 1px dashed $border-strong;
  border-radius: $radius-sm;
  text-align: center;
}

.tool__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 260px;
  overflow: auto;
}

.tool__match {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;
  padding: 6px $spacing-sm;
  border-radius: $radius-sm;
  background: $bg-subtle;
  font-size: $font-size-xs;
}

.tool__match-idx {
  color: $accent-color;
  font-family: $font-family-mono;
  font-weight: 700;
  flex-shrink: 0;
}

.tool__match-text {
  font-family: $font-family-mono;
  color: $text-primary;
  word-break: break-all;
}

.tool__match-groups {
  @include flex-start;
  gap: $spacing-xs;
  flex-wrap: wrap;

  code {
    padding: 1px 5px;
    border-radius: 3px;
    background: $bg-white;
    border: 1px solid $border-color;
    font-family: $font-family-mono;

    &.is-empty {
      color: $text-placeholder;
    }
  }
}
</style>
