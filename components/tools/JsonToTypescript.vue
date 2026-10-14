<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField class="tool__full" label="JSON">
        <textarea
          v-model="input"
          class="tool__area"
          spellcheck="false"
          :placeholder="t('ui.pasteOrType')"
        />
      </ToolField>

      <ToolField :label="t('common.name')">
        <input v-model="rootName" class="tool__input" type="text" spellcheck="false" />
      </ToolField>

      <ToolField :label="t('common.options')">
        <label class="tool__check">
          <input v-model="useAlias" type="checkbox" />
          <span>type alias</span>
        </label>
      </ToolField>

      <ToolField :label="t('common.options')">
        <label class="tool__check">
          <input v-model="optional" type="checkbox" />
          <span>optional (?)</span>
        </label>
      </ToolField>
    </div>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <ResultBox :value="code" download-name="types.ts" download-mime="text/plain;charset=utf-8" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const input = ref(
  '{\n  "id": 1,\n  "name": "Ada",\n  "email": null,\n  "tags": ["math", "code"],\n  "address": { "city": "London", "zip": "10001" }\n}'
)
const rootName = ref('Root')
const useAlias = ref(false)
const optional = ref(true)
const error = ref('')

type Ty = { name: string; optional: boolean }

function scalarType(v: unknown): Ty {
  if (v === null) return { name: 'null', optional: true }
  if (Array.isArray(v)) return { name: 'never[]', optional: false }
  switch (typeof v) {
    case 'string':
      return { name: 'string', optional: false }
    case 'number':
      return { name: 'number', optional: false }
    case 'boolean':
      return { name: 'boolean', optional: false }
    case 'object':
      return { name: 'Record<string, unknown>', optional: false }
    default:
      return { name: 'unknown', optional: false }
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function pascal(s: string) {
  const clean = s.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ''))
  return clean.charAt(0).toUpperCase() + clean.slice(1) || 'Anon'
}

function generate(value: unknown, name: string, out: string[], seen = new Set<unknown>()): Ty {
  if (Array.isArray(value)) {
    if (value.length === 0) return { name: 'unknown[]', optional: false }
    const kinds = new Map<string, Ty>()
    for (const item of value) {
      const t2 = isPlainObject(item) ? generate(item, `${name}Item`, out, seen) : scalarType(item)
      kinds.set(t2.name, t2)
    }
    const names = [...kinds.keys()]
    return { name: names.length === 1 ? `${names[0]}[]` : `Array<${names.join(' | ')}>`, optional: false }
  }

  if (!isPlainObject(value)) return scalarType(value)
  if (seen.has(value)) return { name: name, optional: false }
  seen.add(value)

  const lines: string[] = []
  for (const [key, val] of Object.entries(value)) {
    const ty = isPlainObject(val) || Array.isArray(val) ? generate(val, pascal(key), out, seen) : scalarType(val)
    const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
    const opt = ty.optional && optional.value ? '?' : ''
    const nullSuffix = ty.name === 'null' ? '' : ''
    lines.push(`  ${safeKey}${opt}: ${ty.name === 'null' ? 'null' : ty.name.replace('never[]', 'unknown[]')}${nullSuffix};`)
  }

  const kw = useAlias.value ? 'type' : 'interface'
  const head = kw === 'type' ? `export type ${name} = {` : `export interface ${name} {`
  out.push(`${head}\n${lines.join('\n')}\n}`)
  return { name, optional: false }
}

const code = computed(() => {
  error.value = ''
  if (!input.value.trim()) return ''
  let data: unknown
  try {
    data = JSON.parse(input.value)
  } catch (e) {
    error.value = `${t('common.error')}: ${(e as Error).message}`
    return ''
  }
  const out: string[] = []
  const rootTy = generate(data, rootName.value.trim() || 'Root', out)
  if (out.length === 0) {
    const t0 = rootTy.name
    return `export type ${rootName.value.trim() || 'Root'} = ${t0};`
  }
  return out.reverse().join('\n\n') + '\n'
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

.tool__input {
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

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
}
</style>
