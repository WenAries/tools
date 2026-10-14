<template>
  <div class="tool">
    <div class="tool__preview" :style="{ background: css.hex }">
      <span class="tool__preview-label" :style="{ color: readable ? '#0f172a' : '#f8fafc' }">
        {{ css.hex }}
      </span>
    </div>

    <div class="tool__grid">
      <ToolField :label="t('ui.colorPicker')">
        <input v-model="picker" class="tool__color" type="color" @input="onPicker" />
      </ToolField>
      <ToolField label="HEX">
        <input v-model="hexInput" class="tool__input" type="text" spellcheck="false" />
      </ToolField>
      <ToolField :label="t('ui.rgb')">
        <input :value="css.rgb" class="tool__input" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
      </ToolField>
      <ToolField :label="t('ui.hsl')">
        <input :value="css.hsl" class="tool__input" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
      </ToolField>
    </div>

    <div class="tool__rows">
      <div v-for="row in rows" :key="row.label" class="tool__rrow">
        <span class="tool__rrow-label">{{ row.label }}</span>
        <code>{{ row.value }}</code>
        <CopyButton :value="row.value" label="" />
      </div>
    </div>

    <div class="tool__scales">
      <div>
        <h2 class="tool__scale-title">{{ t('ui.shades') }}</h2>
        <div class="tool__swatches">
          <div
            v-for="c in shades"
            :key="c"
            class="tool__swatch"
            :style="{ background: c }"
            :title="c"
            @click="pick(c)"
          >
            <span>{{ c }}</span>
          </div>
        </div>
      </div>
      <div>
        <h2 class="tool__scale-title">{{ t('ui.tints') }}</h2>
        <div class="tool__swatches">
          <div
            v-for="c in tints"
            :key="c"
            class="tool__swatch"
            :style="{ background: c }"
            :title="c"
            @click="pick(c)"
          >
            <span>{{ c }}</span>
          </div>
        </div>
      </div>
    </div>

    <p class="tool__contrast">
      {{ t('ui.contrast') }} —
      <span class="tool__contrast-chip" :style="{ background: '#ffffff', color: css.hex }">Aa</span>
      <span class="tool__contrast-chip" :style="{ background: '#000000', color: css.hex }">Aa</span>
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const hexInput = ref('#4f46e5')
const picker = ref('#4f46e5')

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n))
}

function parseHex(input: string) {
  let s = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) s = [...s].map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(s)) return null
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16)
  }
}

function toHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0)
        break
      case gg:
        h = (bb - rr) / d + 2
        break
      default:
        h = (rr - gg) / d + 4
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number) {
  const S = s / 100
  const L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = L - c / 2
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

const rgb = computed(() => parseHex(hexInput.value) || { r: 79, g: 70, b: 229 })

const css = computed(() => {
  const { r, g, b } = rgb.value
  const hsl = rgbToHsl(r, g, b)
  return {
    hex: toHex(r, g, b),
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgbArr: `${r}, ${g}, ${b}`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hslArr: `${hsl.h}, ${hsl.s}%, ${hsl.l}%`,
    luma: 0.2126 * (r / 255) ** 2.2 + 0.7152 * (g / 255) ** 2.2 + 0.0722 * (b / 255) ** 2.2
  }
})

const readable = computed(() => css.value.luma > 0.4)

const rows = computed(() => [
  { label: 'HEX', value: css.value.hex },
  { label: 'RGB', value: css.value.rgbArr },
  { label: 'HSL', value: css.value.hslArr },
  { label: 'CSS', value: `${css.value.rgb}` }
])

const shades = computed(() => {
  const { r, g, b } = rgb.value
  const { h, s } = rgbToHsl(r, g, b)
  const l = rgbToHsl(r, g, b).l
  return [0.85, 0.7, 0.55, 0.4, 0.25].map((f) => {
    const c = hslToRgb(h, s, Math.max(2, Math.round(l * f)))
    return toHex(c.r, c.g, c.b)
  })
})

const tints = computed(() => {
  const { r, g, b } = rgb.value
  const { h, s, l } = rgbToHsl(r, g, b)
  return [1.2, 1.4, 1.6, 1.8, 1.95].map((f) => {
    const c = hslToRgb(h, Math.min(100, s), Math.min(97, Math.round(l * f + (f - 1) * 40)))
    return toHex(c.r, c.g, c.b)
  })
})

function pick(c: string) {
  hexInput.value = c
  picker.value = c
}

function onPicker(e: Event) {
  hexInput.value = (e.target as HTMLInputElement).value
}

watch(hexInput, (v) => {
  if (parseHex(v)) picker.value = parseHex(v) ? toHex(rgb.value.r, rgb.value.g, rgb.value.b) : v
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__preview {
  display: grid;
  place-items: center;
  height: 130px;
  border-radius: $radius-lg;
  border: 1px solid $border-color;
  transition: background $transition-base;
}

.tool__preview-label {
  font-family: $font-family-mono;
  font-weight: 700;
  font-size: $font-size-lg;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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

.tool__input {
  @include input-base;
  height: 40px;
  font-family: $font-family-mono;
}

.tool__rows {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tool__rrow {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  align-items: center;
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

.tool__rrow-label {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $text-muted;
  text-transform: uppercase;
}

.tool__scales {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__scale-title {
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $text-muted;
  margin-bottom: $spacing-sm;
}

.tool__swatches {
  display: flex;
  gap: $spacing-xs;
}

.tool__swatch {
  flex: 1;
  height: 58px;
  border-radius: $radius-sm;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: end center;
  cursor: pointer;
  transition: transform $transition-fast;

  &:hover {
    transform: translateY(-2px);
  }

  span {
    font-size: 9px;
    font-family: $font-family-mono;
    color: rgba(255, 255, 255, 0.85);
    mix-blend-mode: difference;
    margin-bottom: 3px;
  }
}

.tool__contrast {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.tool__contrast-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: $radius-sm;
  font-weight: 700;
  margin: 0 3px;
}
</style>
