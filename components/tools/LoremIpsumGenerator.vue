<template>
  <div class="tool">
    <div class="tool__grid">
      <ToolField :label="t('ui.quantity')">
        <input v-model.number="count" class="tool__input" type="number" min="1" max="200" />
      </ToolField>

      <ToolField :label="t('ui.format')">
        <div class="tool__btns">
          <label v-for="u in units" :key="u" class="tool__radio">
            <input v-model="unit" type="radio" :value="u" name="lorem-unit" />
            <span>{{ t(`ui.${u}`) }}</span>
          </label>
        </div>
      </ToolField>

      <ToolField :label="t('common.options')">
        <div class="tool__checks">
          <label class="tool__check">
            <input v-model="startLorem" type="checkbox" />
            <span>{{ t('ui.startWithLorem') }}</span>
          </label>
          <label class="tool__check">
            <input v-model="htmlTags" type="checkbox" />
            <span>{{ t('ui.htmlTags') }}</span>
          </label>
        </div>
      </ToolField>
    </div>

    <button type="button" class="tool__btn tool__btn--primary" @click="regenerate">
      {{ t('common.generate') }}
    </button>

    <ResultBox
      :value="output"
      downloadable
      download-name="lorem-ipsum.txt"
      :download-mime="htmlTags ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8'"
      :title="htmlTags ? 'HTML' : t('ui.plainText')"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
]

const count = ref(3)
const unit = ref<'paragraphs' | 'sentences' | 'words'>('paragraphs')
const units = ['paragraphs', 'sentences', 'words'] as const
const startLorem = ref(true)
const htmlTags = ref(false)

const seed = ref(0)
const regenerate = () => seed.value++

const output = computed(() => {
  void seed.value
  const rnd = mulberry32(0x9e3779b9 ^ seed.value)

  const word = () => WORDS[Math.floor(rnd() * WORDS.length)]
  const sentence = () => {
    const len = 8 + Math.floor(rnd() * 12)
    const parts: string[] = []
    for (let i = 0; i < len; i++) parts.push(word())
    const s = parts.join(' ')
    return s.charAt(0).toUpperCase() + s.slice(1) + '.'
  }

  let body = ''
  if (unit.value === 'words') {
    const n = Math.min(2000, Math.max(1, count.value))
    const list: string[] = []
    for (let i = 0; i < n; i++) list.push(word())
    body = list.join(' ')
  } else if (unit.value === 'sentences') {
    const n = Math.min(500, Math.max(1, count.value))
    body = Array.from({ length: n }, sentence).join(' ')
  } else {
    const n = Math.min(200, Math.max(1, count.value))
    body = Array.from({ length: n }, () => {
      const sc = 3 + Math.floor(rnd() * 4)
      return Array.from({ length: sc }, sentence).join(' ')
    }).join('\n\n')
  }

  let text = body
  if (startLorem.value) {
    const opener = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    if (unit.value === 'paragraphs') text = opener + body.replace(/^(\S)/, (m) => m)
    else text = opener + body
    if (unit.value === 'paragraphs') text = body.replace(/^([A-Z])/, (m) => m)
  }

  if (startLorem.value && unit.value === 'paragraphs') {
    text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + body
  }

  if (htmlTags.value) {
    return text
      .split(/\n\s*\n/)
      .map((p) => `<p>${p}</p>`)
      .join('\n')
  }
  return text
})

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let tt = Math.imul(a ^ (a >>> 15), 1 | a)
    tt = (tt + Math.imul(tt ^ (tt >>> 7), 61 | tt)) ^ tt
    return ((tt ^ (tt >>> 14)) >>> 0) / 4294967296
  }
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

.tool__btns {
  display: flex;
  flex-wrap: wrap;
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

.tool__checks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  height: 40px;
}

.tool__check {
  @include flex-start;
  gap: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-secondary;
  cursor: pointer;
}

.tool__btn {
  align-self: flex-start;
}
</style>
