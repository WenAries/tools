<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="image/*" multiple hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M4 4h6l2 2h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <path d="M12 16v-6M9 12.5L12 9.5l3 3" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div class="tool__opts">
      <ToolField :label="t('ui.resizeBy')">
        <div class="tool__btns">
          <label class="tool__radio">
            <input v-model="mode" type="radio" value="pixels" name="resize-mode" />
            <span>{{ t('ui.pixels') }}</span>
          </label>
          <label class="tool__radio">
            <input v-model="mode" type="radio" value="percent" name="resize-mode" />
            <span>{{ t('ui.percent') }}</span>
          </label>
        </div>
      </ToolField>

      <template v-if="mode === 'pixels'">
        <ToolField :label="t('ui.width')">
          <input v-model.number="width" class="tool__input" type="number" min="1" />
        </ToolField>
        <ToolField :label="t('ui.height')">
          <input v-model.number="height" class="tool__input" type="number" min="1" />
        </ToolField>
      </template>
      <template v-else>
        <ToolField :label="t('ui.percent')">
          <input v-model.number="percent" class="tool__input" type="number" min="1" max="400" />
        </ToolField>
      </template>

      <ToolField :label="t('ui.format')">
        <select v-model="type" class="tool__select">
          <option value="">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </select>
      </ToolField>

      <div class="tool__opts-actions">
        <button type="button" class="tool__btn tool__btn--primary" :disabled="isBusy" @click="runAll">
          {{ t('ui.resize') }}
        </button>
        <button v-if="results.length" type="button" class="tool__btn" @click="downloadAll">
          {{ t('ui.downloadAll') }}
        </button>
      </div>
    </div>

    <ToolStatus :state="statusState" :message="statusMessage" :progress="statusProgress" />

    <div v-if="results.length" class="tool__grid">
      <figure v-for="(r, i) in results" :key="i" class="tool__card">
        <img :src="r.url" :alt="r.name" loading="lazy" />
        <figcaption>
          <span class="tool__card-name">{{ r.name }}</span>
          <span class="tool__card-dims">{{ r.width }}×{{ r.height }}</span>
          <button type="button" class="tool__btn" @click="download(r)">{{ t('common.download') }}</button>
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { loadFile, processImage, downloadBlob, formatSize } = useImageUtils()

const items = ref<Array<{ file: File; img: HTMLImageElement; w: number; h: number }>>([])
const results = ref<Array<{ name: string; blob: Blob; url: string; width: number; height: number }>>([])

const mode = ref<'pixels' | 'percent'>('percent')
const width = ref(800)
const height = ref(600)
const percent = ref(50)
const type = ref<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')
const quality = ref(0.9)
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
  setWarning
} = useToolStatus()

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
      items.value.push({ file, img, w: img.naturalWidth, h: img.naturalHeight })
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
      let mw: number | undefined
      let mh: number | undefined
      if (mode.value === 'percent') {
        mw = Math.max(1, Math.round((item.w * percent.value) / 100))
      } else {
        mw = width.value > 0 ? width.value : undefined
        mh = height.value > 0 ? height.value : undefined
      }
      const out = await processImage(item.img, { type: type.value, quality: quality.value, maxWidth: mw, maxHeight: mh })
      const ext = type.value === 'image/png' ? 'png' : type.value === 'image/webp' ? 'webp' : 'jpg'
      results.value.push({
        name: `${item.file.name.replace(/\.[^.]+$/, '')}-${out.width}x${out.height}.${ext}`,
        blob: out.blob,
        url: out.url,
        width: out.width,
        height: out.height
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
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: $spacing-md;
  align-items: end;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__btns {
  @include flex-start;
  gap: $spacing-md;
  height: 40px;
}

.tool__radio {
  @include flex-start;
  gap: 5px;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__input,
.tool__select {
  @include input-base;
  height: 40px;
}

.tool__btn {
  @include button-ghost;
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
}

.tool__opts-actions {
  display: flex;
  gap: $spacing-xs;
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
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

.tool__card-dims {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
  flex-shrink: 0;
}
</style>
