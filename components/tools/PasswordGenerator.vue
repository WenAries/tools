<template>
  <div class="tool">
    <div class="tool__output">
      <code class="tool__pwd">{{ password }}</code>
      <div class="tool__output-actions">
        <CopyButton :value="password" />
        <button type="button" class="tool__btn tool__btn--primary" @click="generate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />
          </svg>
          {{ t('common.generate') }}
        </button>
      </div>
    </div>

    <div class="tool__strength">
      <div class="tool__strength-bar">
        <span
          v-for="i in 5"
          :key="i"
          class="tool__strength-seg"
          :class="{ 'is-on': i <= strengthLevel }"
          :data-level="strengthLevel"
        />
      </div>
      <span class="tool__strength-label" :data-level="strengthLevel">{{ strengthLabel }}</span>
    </div>

    <div class="tool__grid">
      <ToolField :label="t('ui.length')">
        <div class="tool__length">
          <input v-model.number="length" type="range" min="4" max="64" step="1" />
          <code>{{ length }}</code>
        </div>
      </ToolField>

      <ToolField :label="t('common.options')">
        <div class="tool__checks">
          <label class="tool__check"><input v-model="upper" type="checkbox" /><span>{{ t('ui.includeUppercase') }}</span></label>
          <label class="tool__check"><input v-model="lower" type="checkbox" /><span>{{ t('ui.includeLowercase') }}</span></label>
          <label class="tool__check"><input v-model="numbers" type="checkbox" /><span>{{ t('ui.includeNumbers') }}</span></label>
          <label class="tool__check"><input v-model="symbols" type="checkbox" /><span>{{ t('ui.includeSymbols') }}</span></label>
          <label class="tool__check"><input v-model="excludeSimilar" type="checkbox" /><span>{{ t('ui.excludeSimilar') }}</span></label>
        </div>
      </ToolField>

      <ToolField :label="t('ui.quantity')">
        <div class="tool__multi">
          <input v-model.number="quantity" class="tool__input" type="number" min="1" max="100" />
          <button type="button" class="tool__btn tool__btn--ghost" @click="download">
            {{ t('common.download') }}
          </button>
        </div>
      </ToolField>
    </div>

    <div v-if="multi.length > 1" class="tool__list">
      <div v-for="(p, i) in multi" :key="i" class="tool__item">
        <code>{{ p }}</code>
        <CopyButton :value="p" label="" />
      </div>
    </div>

    <p class="tool__note">🔒 {{ t('toolPage.privacyNote') }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { downloadText } = useFileDownload()

const length = ref(16)
const upper = ref(true)
const lower = ref(true)
const numbers = ref(true)
const symbols = ref(true)
const excludeSimilar = ref(false)
const quantity = ref(1)

const SEEUPS = { upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower: 'abcdefghijkmnopqrstuvwxyz', digits: '23456789' }

const password = ref('')
const multi = ref<string[]>([])

function pool() {
  let s = ''
  const u = excludeSimilar.value ? SEEUPS.upper : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const l = excludeSimilar.value ? SEEUPS.lower : 'abcdefghijklmnopqrstuvwxyz'
  const d = excludeSimilar.value ? SEEUPS.digits : '0123456789'
  if (upper.value) s += u
  if (lower.value) s += l
  if (numbers.value) s += d
  if (symbols.value) s += '!@#$%^&*()-_=+[]{};:,.<>?'
  return s
}

function randomInt(max: number) {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function make(len: number) {
  const chars = pool()
  if (!chars) return ''
  const out: string[] = []
  for (let i = 0; i < len; i++) out.push(chars[randomInt(chars.length)])
  return out.join('')
}

function generate() {
  const n = Math.min(100, Math.max(1, Math.floor(quantity.value) || 1))
  const len = Math.min(64, Math.max(4, Math.floor(length.value) || 16))
  multi.value = Array.from({ length: n }, () => make(len))
  password.value = multi.value[0] || ''
}

function download() {
  downloadText(multi.value.join('\n'), 'passwords.txt')
}

const entropy = computed(() => {
  const chars = pool().length
  return chars > 0 ? Math.round(length.value * Math.log2(chars)) : 0
})

const strengthLevel = computed(() => {
  const e = entropy.value
  if (e < 40) return 1
  if (e < 60) return 2
  if (e < 80) return 3
  if (e < 110) return 4
  return 5
})

const strengthLabel = computed(
  () =>
    [t('ui.veryWeak'), t('ui.weak'), t('ui.fair'), t('ui.strong'), t('ui.veryStrong')][
      strengthLevel.value - 1
    ] + ` · ${entropy.value} bits`
)

onMounted(generate)
watch([length, upper, lower, numbers, symbols, excludeSimilar, quantity], generate)
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__output {
  @include surface;
  padding: $spacing-lg;
  text-align: center;
  background: linear-gradient(135deg, $brand-50, rgba(6, 182, 212, 0.06));
}

.tool__pwd {
  display: block;
  font-family: $font-family-mono;
  font-size: clamp(18px, 4vw, 30px);
  font-weight: 700;
  color: $text-primary;
  word-break: break-all;
  line-height: 1.4;
  margin-bottom: $spacing-md;
}

.tool__output-actions {
  @include flex-center;
  gap: $spacing-sm;
}

.tool__btn {
  font-size: $font-size-sm;

  svg {
    width: 15px;
    height: 15px;
  }

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

.tool__strength {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.tool__strength-bar {
  display: flex;
  gap: 4px;
  flex: 1;
}

.tool__strength-seg {
  height: 6px;
  flex: 1;
  border-radius: $radius-full;
  background: $border-color;
  transition: background $transition-base;

  &.is-on {
    background: $success-color;
  }

  &.is-on[data-level='1'],
  &.is-on[data-level='2'] {
    background: $error-color;
  }

  &.is-on[data-level='3'] {
    background: $warning-color;
  }
}

.tool__strength-label {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-secondary;
  white-space: nowrap;
}

.tool__grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__length {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  height: 40px;

  input[type='range'] {
    flex: 1;
    accent-color: $accent-color;
  }

  code {
    font-family: $font-family-mono;
    font-weight: 700;
    color: $accent-color;
    min-width: 28px;
    text-align: right;
  }
}

.tool__checks {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tool__check {
  @include flex-start;
  gap: 5px;
  font-size: $font-size-xs;
  color: $text-secondary;
  cursor: pointer;
}

.tool__input {
  @include input-base;
  height: 40px;
}

.tool__multi {
  @include flex-start;
  gap: $spacing-xs;
  height: 40px;
}

.tool__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 300px;
  overflow: auto;
}

.tool__item {
  @include flex-between;
  gap: $spacing-sm;
  padding: 6px $spacing-sm;
  border-radius: $radius-sm;
  background: $bg-subtle;

  code {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    color: $text-primary;
    word-break: break-all;
  }
}

.tool__note {
  text-align: center;
  font-size: $font-size-xs;
  color: $text-placeholder;
}
</style>
