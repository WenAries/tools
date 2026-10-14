<template>
  <div class="tool">
    <div class="tool__grid">
      <div class="tool__left">
        <ToolField :label="t('ui.contentType')">
          <div class="tool__btns">
            <button
              v-for="k in kinds"
              :key="k"
              type="button"
              class="tool__btn"
              :class="{ 'is-active': kind === k }"
              @click="kind = k"
            >
              {{ t(`ui.${k}`) }}
            </button>
          </div>
        </ToolField>

        <ToolField v-if="kind === 'text' || kind === 'url'" :label="t('common.input')">
          <textarea v-if="kind === 'text'" v-model="fields.text" class="tool__area tool__area--sm" spellcheck="false" />
          <input v-else v-model="fields.url" class="tool__input" type="url" spellcheck="false" />
        </ToolField>

        <template v-if="kind === 'wifi'">
          <ToolField :label="t('ui.wifiSsid')">
            <input v-model="fields.ssid" class="tool__input" type="text" spellcheck="false" />
          </ToolField>
          <ToolField :label="t('ui.wifiPassword')">
            <input v-model="fields.password" class="tool__input" type="text" spellcheck="false" />
          </ToolField>
          <div class="tool__row">
            <ToolField :label="t('ui.encryption')">
              <select v-model="fields.encryption" class="tool__select">
                <option value="WPA">{{ t('ui.encryptionWpa') }}</option>
                <option value="WEP">{{ t('ui.encryptionWep') }}</option>
                <option value="nopass">{{ t('ui.encryptionNone') }}</option>
              </select>
            </ToolField>
            <label class="tool__check">
              <input v-model="fields.hidden" type="checkbox" />
              <span>{{ t('ui.hiddenNetwork') }}</span>
            </label>
          </div>
        </template>

        <template v-if="kind === 'email'">
          <ToolField :label="t('ui.email')">
            <input v-model="fields.email" class="tool__input" type="email" />
          </ToolField>
          <ToolField :label="t('ui.textInput')">
            <input v-model="fields.subject" class="tool__input" type="text" />
          </ToolField>
        </template>

        <ToolField v-if="kind === 'phone'" :label="t('ui.phone')">
          <input v-model="fields.phone" class="tool__input" type="tel" />
        </ToolField>

        <div class="tool__row">
          <ToolField :label="t('ui.imageSize')">
            <input v-model.number="size" class="tool__input" type="number" min="128" max="1024" step="16" />
          </ToolField>
          <ToolField :label="t('ui.margin')">
            <input v-model.number="margin" class="tool__input" type="number" min="0" max="8" />
          </ToolField>
          <ToolField :label="t('ui.errorCorrection')">
            <select v-model="level" class="tool__select">
              <option value="L">{{ t('ui.level') }} L</option>
              <option value="M">{{ t('ui.level') }} M</option>
              <option value="Q">{{ t('ui.level') }} Q</option>
              <option value="H">{{ t('ui.level') }} H</option>
            </select>
          </ToolField>
        </div>

        <div class="tool__row">
          <ToolField :label="t('ui.foregroundColor')">
            <input v-model="dark" class="tool__color" type="color" />
          </ToolField>
          <ToolField :label="t('ui.backgroundColor')">
            <input v-model="light" class="tool__color" type="color" />
          </ToolField>
          <div class="tool__row-end">
            <button type="button" class="tool__btn tool__btn--ghost" @click="randomize">
              🎲 {{ t('ui.random') }}
            </button>
          </div>
        </div>
      </div>

      <div class="tool__right">
        <div class="tool__qr">
          <canvas ref="canvasRef" :width="size" :height="size" aria-label="QR code" />
        </div>
        <div class="tool__qr-actions">
          <button type="button" class="tool__btn tool__btn--primary" @click="downloadPng">
            {{ t('ui.downloadPng') }}
          </button>
          <button type="button" class="tool__btn tool__btn--ghost" @click="downloadSvg">
            {{ t('ui.downloadSvg') }}
          </button>
        </div>
        <p v-if="error" class="tool__error" role="alert">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

const { t } = useI18n()
const { downloadBlob } = useFileDownload()

const kinds = ['text', 'url', 'wifi', 'email', 'phone'] as const
const kind = ref<(typeof kinds)[number]>('url')

const fields = reactive({
  text: 'Hello from FreeTools!',
  url: 'https://www.freetools.fun',
  ssid: 'MyWiFi',
  password: '',
  encryption: 'WPA',
  hidden: false,
  email: 'hello@example.com',
  subject: 'Hello',
  phone: '+15551234567'
})

const size = ref(320)
const margin = ref(2)
const level = ref<'L' | 'M' | 'Q' | 'H'>('M')
const dark = ref('#0f172a')
const light = ref('#ffffff')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const error = ref('')

const payload = computed(() => {
  switch (kind.value) {
    case 'text':
      return fields.text
    case 'url':
      return fields.url
    case 'wifi': {
      const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
      const enc = fields.encryption === 'nopass' ? '' : `T:${fields.encryption};P:${esc(fields.password)};`
      return `WIFI:S:${esc(fields.ssid)};${enc}${fields.hidden ? 'H:true;' : ''};`
    }
    case 'email':
      return `mailto:${fields.email}?subject=${encodeURIComponent(fields.subject)}`
    case 'phone':
      return `tel:${fields.phone.replace(/\s/g, '')}`
    default:
      return ''
  }
})

let svgCache = ''

async function render() {
  error.value = ''
  const canvas = canvasRef.value
  if (!canvas || !payload.value) return
  try {
    await QRCode.toCanvas(canvas, payload.value, {
      width: size.value,
      margin: margin.value,
      errorCorrectionLevel: level.value,
      color: { dark: dark.value, light: light.value }
    })
    svgCache = await QRCode.toString(payload.value, {
      type: 'svg',
      margin: margin.value,
      errorCorrectionLevel: level.value,
      color: { dark: dark.value, light: light.value }
    })
  } catch (e) {
    error.value = (e as Error).message
  }
}

onMounted(render)
watch([payload, size, margin, level, dark, light], render)
watch(kind, () => nextTick(render))

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, 'qrcode.png')
  }, 'image/png')
}

function downloadSvg() {
  if (!svgCache) return
  downloadBlob(new Blob([svgCache], { type: 'image/svg+xml' }), 'qrcode.svg')
}

function randomize() {
  const hue = Math.floor(Math.random() * 360)
  dark.value = `hsl(${hue}, 60%, 22%)`
  light.value = '#ffffff'
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: $spacing-xl;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.tool__left {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__btns {
  @include flex-start;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tool__btn {
  @include button-ghost;
  font-size: $font-size-sm;

  &.is-active {
    background: $accent-color;
    border-color: $accent-color;
    color: #fff;
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

.tool__area {
  @include input-base;
  min-height: 90px;
  resize: vertical;

  &--sm {
    min-height: 90px;
  }
}

.tool__input,
.tool__select {
  @include input-base;
  height: 40px;
}

.tool__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__row-end {
  display: flex;
  align-items: flex-end;
}

.tool__color {
  width: 100%;
  height: 40px;
  padding: 2px;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
  cursor: pointer;
}

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  height: 40px;
  cursor: pointer;
}

.tool__right {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  align-items: center;
}

.tool__qr {
  @include surface;
  padding: $spacing-md;
  display: grid;
  place-items: center;
  width: 100%;

  canvas {
    max-width: 100%;
    height: auto;
    border-radius: $radius-sm;
  }
}

.tool__qr-actions {
  display: flex;
  gap: $spacing-xs;
  width: 100%;

  .tool__btn {
    flex: 1;
  }
}

.tool__error {
  font-size: $font-size-sm;
  color: $error-color;
}
</style>
