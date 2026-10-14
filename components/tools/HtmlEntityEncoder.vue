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
      <label class="tool__check">
        <input v-model="namedOnly" type="checkbox" />
        <span>named entities</span>
      </label>
    </div>

    <ToolField :label="t('common.input')">
      <textarea
        v-model="input"
        class="tool__area"
        spellcheck="false"
        :placeholder="mode === 'encode' ? '<div class=&quot;box&quot;>Text & more</div>' : '&lt;div&gt;Text &amp; more&lt;/div&gt;'"
      />
    </ToolField>

    <ResultBox :value="output" downloadable download-name="entities.txt" />

    <div class="tool__table">
      <h2 class="tool__table-title">{{ t('ui.supportedFormats') }}</h2>
      <table>
        <thead>
          <tr><th>Char</th><th>Entity</th><th>Unicode</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in reference" :key="r.entity">
            <td class="tool__table-char">{{ r.char }}</td>
            <td><code>&amp;{{ r.entity }};</code></td>
            <td><code>&amp;#x{{ r.code }};</code></td>
            <td class="tool__table-desc">{{ r.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const NAMED: Record<string, string> = {
  '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos',
  '\u00a0': 'nbsp', '\u00a9': 'copy', '\u00ae': 'reg', '\u2122': 'trade',
  '\u2014': 'mdash', '\u2013': 'ndash', '\u2026': 'hellip', '\u20ac': 'euro',
  '\u00a3': 'pound', '\u00a5': 'yen', '\u00b0': 'deg', '\u00b7': 'middot'
}
const NAMED_REV: Record<string, string> = Object.fromEntries(
  Object.entries(NAMED).map(([char, name]) => [name, char])
)

function escapeNamed(s: string) {
  return s.replace(/[&<>"'\u00a0-\u00ff\u2013\u2014\u2026\u20ac\u2122]/g, (ch) =>
    NAMED[ch] ? `&${NAMED[ch]};` : ch
  )
}

function unescapeEntities(s: string) {
  const el = document.createElement('textarea')
  return s.replace(/&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity) => {
    el.innerHTML = entity
    return el.value
  })
}

const mode = ref<'encode' | 'decode'>('encode')
const namedOnly = ref(true)
const input = ref('<div class="box">Tom & Jerry — "friends"</div>')
const error = ref('')

// 仅使用语言包中已有的 key，描述用中立符号
const reference = [
  { char: '&', entity: 'amp', code: '26', desc: '&' },
  { char: '<', entity: 'lt', code: '3C', desc: '<' },
  { char: '>', entity: 'gt', code: '3E', desc: '>' },
  { char: '"', entity: 'quot', code: '22', desc: '"' },
  { char: "'", entity: 'apos', code: '27', desc: "'" },
  { char: ' ', entity: 'nbsp', code: 'A0', desc: 'space' },
  { char: '©', entity: 'copy', code: 'A9', desc: '(c)' },
  { char: '®', entity: 'reg', code: 'AE', desc: '(r)' },
  { char: '™', entity: 'trade', code: '2122', desc: 'TM' },
  { char: '—', entity: 'mdash', code: '2014', desc: '—' },
  { char: '…', entity: 'hellip', code: '2026', desc: '...' },
  { char: '€', entity: 'euro', code: '20AC', desc: 'EUR' }
]

const output = computed(() => {
  error.value = ''
  const raw = input.value
  if (!raw) return ''
  try {
    if (mode.value === 'encode') {
      return namedOnly.value ? escapeNamed(raw) : encodeNumeric(raw)
    }
    return unescapeEntities(raw)
  } catch {
    error.value = t('ui.invalidInput')
    return ''
  }
})

function encodeNumeric(s: string) {
  return [...s]
    .map((ch) => {
      const code = ch.codePointAt(0) || 0
      if (ch === '&') return '&amp;'
      if (ch === '<') return '&lt;'
      if (ch === '>') return '&gt;'
      if (ch === '"') return '&quot;'
      if (code < 0x80) return ch
      return `&#x${code.toString(16).toUpperCase()};`
    })
    .join('')
}
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

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__area {
  @include input-base;
  min-height: 140px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
}

.tool__table {
  @include surface;
  overflow: hidden;
}

.tool__table-title {
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $text-muted;
  background: $bg-subtle;
  border-bottom: 1px solid $border-color;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: 7px $spacing-md;
    text-align: left;
    border-bottom: 1px solid $border-color;
  }

  th {
    font-size: $font-size-xs;
    color: $text-muted;
    background: $bg-white;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.tool__table-char {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: 600;
}

.tool__table-desc {
  color: $text-muted;
}

code {
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  color: $accent-color;
}
</style>
