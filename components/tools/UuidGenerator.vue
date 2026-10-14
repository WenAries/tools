<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField :label="t('ui.quantity')">
        <input v-model.number="count" class="tool__input" type="number" min="1" max="500" />
      </ToolField>

      <ToolField :label="t('common.options')">
        <div class="tool__checks">
          <label class="tool__check"><input v-model="upper" type="checkbox" /><span>{{ t('ui.uppercaseFormat') }}</span></label>
          <label class="tool__check"><input v-model="noHyphens" type="checkbox" /><span>{{ t('ui.noHyphens') }}</span></label>
          <label class="tool__check"><input v-model="braces" type="checkbox" /><span>{{ t('ui.braces') }}</span></label>
        </div>
      </ToolField>

      <ToolField :label="t('common.output')">
        <div class="tool__btns">
          <button type="button" class="tool__btn tool__btn--primary" @click="regenerate">
            {{ t('common.generate') }}
          </button>
          <button type="button" class="tool__btn tool__btn--ghost" @click="download">
            {{ t('common.download') }}
          </button>
        </div>
      </ToolField>
    </div>

    <ResultBox :value="list" copyable :title="t('common.output')" />

    <div class="tool__note">
      <code>RFC 4122 · version 4 · {{ uuidCount }} {{ t('common.none') === '' ? '' : 'UUIDs' }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { downloadText } = useFileDownload()

const count = ref(10)
const upper = ref(false)
const noHyphens = ref(false)
const braces = ref(false)

const seed = ref(0)
const regenerate = () => seed.value++
const list = computed(() => {
  void seed.value
  const n = Math.min(500, Math.max(1, Math.floor(count.value) || 1))
  return Array.from({ length: n }, make).join('\n')
})

function make() {
  // crypto.getRandomValues：浏览器安全随机源
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  let s = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  if (noHyphens.value) s = s.replace(/-/g, '')
  if (upper.value) s = s.toUpperCase()
  if (braces.value) s = `{${s}}`
  return s
}

const uuidCount = computed(() => Math.min(500, Math.max(1, Math.floor(count.value) || 1)))

function download() {
  downloadText(list.value, 'uuids.txt')
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

.tool__input {
  @include input-base;
  height: 40px;
}

.tool__checks {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  height: 40px;
  align-items: center;
}

.tool__check {
  @include flex-start;
  gap: 5px;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__btns {
  @include flex-start;
  gap: $spacing-xs;
  height: 40px;
}

.tool__btn {
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

  &--ghost {
    @include button-ghost;
  }
}

.tool__note {
  text-align: center;

  code {
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $text-placeholder;
  }
}
</style>
