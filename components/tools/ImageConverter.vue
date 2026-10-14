<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="image/*" multiple hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M4 7h11l3 3h2a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1z" />
        <circle cx="11" cy="14" r="3" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div class="tool__opts">
      <ToolField :label="t('ui.format')">
        <div class="tool__btns">
          <button
            v-for="f in formats"
            :key="f.value"
            type="button"
            class="tool__btn"
            :class="{ 'is-active': type === f.value }"
            @click="type = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </ToolField>

      <ToolField v-if="type !== 'image/png'" :label="t('ui.quality')" :hint="String(Math.round(quality * 100)) + '%'">
        <input v-model.number="quality" type="range" min="0.3" max="1" step="0.05" />
      </ToolField>

      <ToolField v-if="type === 'image/jpeg'" :label="t('ui.backgroundColor')">
        <input v-model="background" class="tool__color" type="color" />
      </ToolField>
    </div>

    <div class="tool__actions">
      <button type="button" class="tool__btn tool__btn--primary" :disabled="isBusy" @click="runAll">
        {{ t('ui.convert') }}
      </button>
      <button v-if="results.length" type="button" class="tool__btn" @click="downloadAll">
        {{ t('ui.downloadAll') }}
      </button>
      <button v-if="items.length" type="button" class="tool__btn tool__btn--ghost" @click="clearAll">
        {{ t('common.clear') }}
      </button>
    </div>

    <ToolStatus :state="statusState" :message="statusMessage" :progress="statusProgress" />

    <div v-if="results.length" class="tool__grid">
      <figure v-for="(r, i) in results" :key="i" class="tool__card">
        <img :src="r.url" :alt="r.name" loading="lazy" />
        <figcaption>
          <span class="tool__card-name">{{ r.name }}</span>
          <span class="tool__card-size">{{ formatSize(r.blob.size) }}</span>
          <button type="button" class="tool__btn" @click="download(r)">{{ t('common.download') }}</button>
        </figcaption>
      </figure>
    </div>

    <p class="tool__note">{{ t('ui.supportedFormats') }}: JPG · PNG · WebP · BMP</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { loadFile, processImage, downloadBlob, replaceExt, formatSize } = useImageUtils()

const formats = [
  { value: 'image/png' as const, label: 'PNG', ext: 'png' },
  { value: 'image/jpeg' as const, label: 'JPG', ext: 'jpg' },
  { value: 'image/webp' as const, label: 'WebP', ext: 'webp' }
]

const items = ref<Array<{ file: File; img: HTMLImageElement }>>([])
const results = ref<Array<{ name: string; blob: Blob; url: string }>>([])
const type = ref<'image/png' | 'image/jpeg' | 'image/webp'>('image/png')
const quality = ref(0.9)
const background = ref('#ffffff')
const fileRef = ref<HTMLInputElement | null>(null)

const {
  state: statusState,
  message: statusMessage,
  progress: statusProgress,
  isBusy,
  setBusy,
  setProgress,
  setSuccess,
  setError,
  setWarning,
  reset
} = useToolStatus()

const formatsExt = () => formats.find((f) => f.value === type.value)?.ext || 'png'

function pick() {
  fileRef.value?.click()
}

function onFiles(e: Event) {
  addFiles(Array.from((e.target as HTMLInputElement).files || []))
}

function onDrop(e: DragEvent) {
  addFiles(Array.from(e.dataTransfer?.files || []))
}

async function addFiles(files: File[]) {
  if (!files.length) return
  const imgs = files.filter((f) => f.type.startsWith('image/'))
  const skipped = files.length - imgs.length
  let loaded = 0

  for (const file of imgs) {
    try {
      const { img } = await loadFile(file)
      items.value.push({ file, img })
      loaded++
    } catch {
      /* 解码失败的文件计入下方统一提示 */
    }
  }

  if (loaded) {
    runAll()
    return
  }
  if (skipped) setWarning('skippedUnsupported', { count: skipped })
  else setError(files.length)
}

async function runAll() {
  if (!items.value.length) {
    setWarning('selectImagesFirst')
    return
  }

  results.value.forEach((r) => URL.revokeObjectURL(r.url))
  results.value = []

  setBusy(items.value.length)
  let ok = 0
  let failed = 0
  const total = items.value.length

  for (let i = 0; i < total; i++) {
    const item = items.value[i]
    try {
      const out = await processImage(item.img, {
        type: type.value,
        quality: quality.value,
        background: type.value === 'image/jpeg' ? background.value : ''
      })
      results.value.push({
        name: replaceExt(item.file.name, formatsExt()),
        blob: out.blob,
        url: out.url
      })
      ok++
    } catch {
      failed++
    }
    setProgress(i + 1, total)
    await nextTick()
  }

  if (failed && !ok) setError(failed)
  else if (failed) setWarning('processedFail', { count: failed })
  else setSuccess(ok)
}

function download(r: { name: string; blob: Blob }) {
  downloadBlob(r.blob, r.name)
}

function downloadAll() {
  results.value.forEach((r, i) => setTimeout(() => download(r), i * 250))
}

function clearAll() {
  items.value = []
  results.value.forEach((r) => URL.revokeObjectURL(r.url))
  results.value = []
  if (fileRef.value) fileRef.value.value = ''
  reset()
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__drop {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-xl;
  border: 1px dashed $border-strong;
  border-radius: $radius-md;
  background: $bg-subtle;
  color: $text-muted;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: border-color $transition-fast, color $transition-fast;

  &:hover {
    border-color: $accent-color;
    color: $accent-color;
  }

  svg {
    width: 26px;
    height: 26px;
  }
}

.tool__opts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;
  align-items: end;

  @include mobile {
    grid-template-columns: 1fr;
  }
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

input[type='range'] {
  width: 100%;
  height: 40px;
  accent-color: $accent-color;
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

.tool__actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.tool__card {
  margin: 0;
  @include surface;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 150px;
    object-fit: contain;
    background: repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 14px 14px;
  }

  figcaption {
    @include flex-between;
    gap: $spacing-xs;
    padding: 6px $spacing-sm;
    border-top: 1px solid $border-color;
  }
}

.tool__card-name {
  font-size: $font-size-xs;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__card-size {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
  flex-shrink: 0;
}

.tool__note {
  font-size: $font-size-xs;
  color: $text-placeholder;
}
</style>
