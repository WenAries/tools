<template>
  <div class="tool">
    <div class="tool__now">
      <span class="tool__now-label">{{ t('ui.now') }}</span>
      <code class="tool__now-value">{{ nowSeconds }}</code>
      <span class="tool__now-sub">{{ t('ui.seconds') }} · {{ nowMs }} ms</span>
      <button type="button" class="tool__btn tool__btn--ghost" @click="useNow">
        {{ t('ui.now') }}
      </button>
    </div>

    <div class="tool__grid">
      <ToolField :label="t('ui.timestamp')">
        <input v-model="tsInput" class="tool__input" type="text" inputmode="numeric" spellcheck="false" />
      </ToolField>

      <ToolField :label="t('ui.format')">
        <div class="tool__btns">
          <label class="tool__radio">
            <input v-model="unit" type="radio" value="s" name="unit" />
            <span>{{ t('ui.seconds') }}</span>
          </label>
          <label class="tool__radio">
            <input v-model="unit" type="radio" value="ms" name="unit" />
            <span>{{ t('ui.milliseconds') }}</span>
          </label>
        </div>
      </ToolField>

      <ToolField :label="t('ui.timezone')">
        <select v-model="tz" class="tool__select">
          <option v-for="z in timezones" :key="z" :value="z">{{ z }}</option>
        </select>
      </ToolField>
    </div>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <template v-if="date">
      <div class="tool__outputs">
        <div v-for="row in rows" :key="row.label" class="tool__row">
          <span class="tool__row-label">{{ row.label }}</span>
          <code class="tool__row-value">{{ row.value }}</code>
          <CopyButton :value="row.value" />
        </div>
      </div>

      <p class="tool__relative">🕘 {{ relative }}</p>
    </template>

    <ToolField class="tool__date-field" :label="t('ui.dateTime')">
      <input v-model="dateInput" class="tool__input" type="datetime-local" />
    </ToolField>

    <ResultBox v-if="date" :value="String(timestamp)" :title="t('ui.timestamp')" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const nowTick = ref(Date.now())
let raf: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  raf = setInterval(() => (nowTick.value = Date.now()), 1000)
})
onUnmounted(() => {
  if (raf) clearInterval(raf)
})

const nowSeconds = computed(() => Math.floor(nowTick.value / 1000))
const nowMs = computed(() => nowTick.value % 1000)

const timezones = computed(() => {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  const list = ['UTC', 'Etc/GMT', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland', 'America/Sao_Paulo']
  return Array.from(new Set([local, ...list]))
})

const tsInput = ref(String(Math.floor(Date.now() / 1000)))
const unit = ref<'s' | 'ms'>('s')
const tz = ref('UTC')
const dateInput = ref('')

const timestamp = computed(() => {
  const n = Number(tsInput.value.replace(/[^\d-]/g, ''))
  if (!Number.isFinite(n) || tsInput.value.trim() === '') return null
  return unit.value === 's' ? n : n
})

const date = computed(() => {
  error.value = ''
  if (tsInput.value.trim() === '') return null
  const n = Number(tsInput.value.replace(/[^\d-]/g, ''))
  if (!Number.isFinite(n)) {
    error.value = t('ui.invalidInput')
    return null
  }
  const ms = unit.value === 's' ? n * 1000 : n
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) {
    error.value = t('ui.invalidInput')
    return null
  }
  return d
})

function formatter(opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz.value, ...opts })
}

const rows = computed(() => {
  const d = date.value
  if (!d) return []
  const ms = d.getTime()
  return [
    { label: 'ISO 8601', value: d.toISOString() },
    { label: 'RFC 2822', value: d.toUTCString() },
    { label: `${t('ui.local')} · ${tz.value}`, value: formatter({ dateStyle: 'full', timeStyle: 'long' }).format(d) },
    { label: `${t('ui.seconds')}`, value: String(Math.floor(ms / 1000)) },
    { label: `${t('ui.milliseconds')}`, value: String(ms) },
    { label: 'Locale', value: formatter({ dateStyle: 'medium', timeStyle: 'medium' }).format(d) }
  ]
})

const relative = computed(() => {
  const d = date.value
  if (!d) return ''
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const fmt = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  let text: string
  if (abs < 60_000) text = fmt(Math.round(abs / 1000), t('ui.seconds').toLowerCase())
  else if (abs < 3_600_000) text = fmt(Math.round(abs / 60_000), 'min')
  else if (abs < 86_400_000) text = fmt(Math.round(abs / 3_600_000), 'h')
  else text = fmt(Math.round(abs / 86_400_000), 'd')
  return diff > 0 ? `${t('ui.relative')}: +${text}` : `${t('ui.relative')}: -${text} ${t('ui.ago')}`
})

const error = ref('')

function useNow() {
  unit.value = 's'
  tsInput.value = String(Math.floor(Date.now() / 1000))
}

watch(dateInput, (v) => {
  if (!v) return
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return
  unit.value = 's'
  tsInput.value = String(Math.floor(d.getTime() / 1000))
})

watch(date, (d) => {
  if (!d) return
  const pad = (n: number) => String(n).padStart(2, '0')
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  const next = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
  if (dateInput.value !== next) dateInput.value = next
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__now {
  @include flex-start;
  flex-wrap: wrap;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $brand-50, rgba(6, 182, 212, 0.08));
  border: 1px solid $brand-100;
}

.tool__now-label {
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $accent-color;
}

.tool__now-value {
  font-family: $font-family-mono;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.tool__now-sub {
  font-size: $font-size-xs;
  color: $text-muted;
  font-family: $font-family-mono;
}

.tool__now .tool__btn {
  margin-left: auto;
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__input,
.tool__select {
  @include input-base;
  height: 40px;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
}

.tool__btns {
  display: flex;
  gap: $spacing-sm;
  height: 40px;
  align-items: center;
}

.tool__radio {
  @include flex-start;
  gap: 5px;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__btn {
  @include button-ghost;
  font-size: $font-size-sm;
}

.tool__outputs {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tool__row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  gap: $spacing-sm;
  padding: 7px $spacing-sm;
  border-radius: $radius-sm;
  background: $bg-subtle;

  @include mobile {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.tool__row-label {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $text-muted;
}

.tool__row-value {
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  color: $text-primary;
  word-break: break-all;
}

.tool__relative {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
}

.tool__date-field :deep(input) {
  max-width: 260px;
}
</style>
