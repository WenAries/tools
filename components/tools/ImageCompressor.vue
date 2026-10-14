<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="image/*" multiple hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M4 17l4.5-4.5 3 3 3-3L20 17" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div class="tool__opts">
      <ToolField :label="t('ui.quality')" :hint="String(Math.round(quality * 100)) + '%'">
        <input v-model.number="quality" type="range" min="0.3" max="1" step="0.05" />
      </ToolField>
      <ToolField :label="t('ui.width')" :hint="t('ui.auto')">
        <input v-model.number="maxWidth" class="tool__input" type="number" min="0" step="50" />
      </ToolField>
      <ToolField :label="t('ui.height')" :hint="t('ui.auto')">
        <input v-model.number="maxHeight" class="tool__input" type="number" min="0" step="50" />
      </ToolField>
      <div class="tool__opts-actions">
        <button type="button" class="tool__btn tool__btn--primary" :disabled="isBusy" @click="runAll">
          {{ t('ui.compress') }}
        </button>
        <button v-if="items.length" type="button" class="tool__btn" @click="downloadAll">
          {{ t('ui.downloadAll') }}
        </button>
        <button v-if="items.length" type="button" class="tool__btn tool__btn--ghost" @click="clearAll">
          {{ t('common.clear') }}
        </button>
      </div>
    </div>

    <ToolStatus :state="statusState" :message="statusMessage" :progress="statusProgress" />

    <div v-if="items.length" class="tool__list">
      <div v-for="(item, i) in items" :key="i" class="tool__item">
        <div class="tool__thumbs">
          <figure>
            <img :src="item.srcUrl" :alt="item.name" loading="lazy" />
            <figcaption>{{ t('ui.before') }} · {{ formatSize(item.size) }}</figcaption>
          </figure>
          <figure>
            <img v-if="item.out" :src="item.out.url" :alt="item.name" loading="lazy" />
            <span v-else class="tool__pending">{{ t('common.loading') }}</span>
            <figcaption>
              {{ t('ui.after') }} ·
              <template v-if="item.out">
                {{ formatSize(item.out.blob.size) }}
                <em class="is-saved">{{ t('ui.saved') }} {{ savedPct(item) }}%</em>
              </template>
            </figcaption>
          </figure>
        </div>
        <div class="tool__item-foot">
          <span class="tool__item-name">{{ item.name }}</span>
          <span v-if="item.out" class="tool__item-dims">{{ item.out.width }}×{{ item.out.height }}</span>
          <button v-if="item.out" type="button" class="tool__btn" @click="download(item)">
            {{ t('common.download') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { downloadBlob, formatSize, loadFile, processImage, replaceExt } = useImageUtils()

interface Item {
  file: File
  name: string
  size: number
  srcUrl: string
  img?: HTMLImageElement
  out?: { blob: Blob; url: string; width: number; height: number }
}

const items = ref<Item[]>([])
const quality = ref(0.7)
const maxWidth = ref(0)
const maxHeight = ref(0)
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

function pick() {
  fileRef.value?.click()
}

function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  addFiles(files)
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
      const { img, url } = await loadFile(file)
      items.value.push({ file, name: file.name, size: file.size, srcUrl: url, img })
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
  const targets = items.value.filter((i) => i.img)
  if (!targets.length) {
    setWarning('selectImagesFirst')
    return
  }

  setBusy(targets.length)
  let ok = 0
  let failed = 0
  let sizeBefore = 0
  let sizeAfter = 0

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i]
    try {
      item.out = await processImage(item.img as HTMLImageElement, {
        quality: quality.value,
        type: 'image/jpeg',
        maxWidth: maxWidth.value || undefined,
        maxHeight: maxHeight.value || undefined,
        background: '#ffffff'
      })
      ok++
      sizeBefore += item.size
      sizeAfter += item.out.blob.size
    } catch {
      item.out = undefined
      failed++
    }
    setProgress(i + 1, targets.length)
    await nextTick()
  }

  if (failed) {
    setError(failed)
    return
  }
  const pct = sizeBefore > 0 ? Math.max(0, Math.round((1 - sizeAfter / sizeBefore) * 100)) : 0
  setSuccess(ok, t('ui.totalSaved', { percent: pct }))
}

function savedPct(item: Item) {
  if (!item.out) return 0
  const pct = Math.round((1 - item.out.blob.size / item.size) * 100)
  return Math.max(0, pct)
}

function download(item: Item) {
  if (!item.out) return
  downloadBlob(item.out.blob, replaceExt(item.name, 'jpg'))
}

function downloadAll() {
  items.value.forEach((item, i) => setTimeout(() => download(item), i * 250))
}

function clearAll() {
  items.value.forEach((i) => {
    URL.revokeObjectURL(i.srcUrl)
    if (i.out) URL.revokeObjectURL(i.out.url)
  })
  items.value = []
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
  grid-template-columns: 1.4fr 1fr 1fr auto;
  align-items: end;
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr 1fr;
  }
}

.tool__input {
  @include input-base;
  height: 40px;
}

input[type='range'] {
  width: 100%;
  height: 40px;
  accent-color: $accent-color;
}

.tool__opts-actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
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

.tool__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__item {
  @include surface;
  overflow: hidden;
}

.tool__thumbs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tool__thumbs figure {
  margin: 0;
  position: relative;
  background: repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px;

  img {
    display: block;
    width: 100%;
    height: 180px;
    object-fit: contain;
  }
}

.tool__pending {
  display: grid;
  place-items: center;
  height: 180px;
  color: $text-placeholder;
  font-size: $font-size-sm;
}

.tool__thumbs figcaption {
  padding: 5px $spacing-sm;
  font-size: 11px;
  color: $text-muted;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid $border-color;
}

.is-saved {
  color: $success-color;
  font-weight: 600;
  margin-left: $spacing-xs;
}

.tool__item-foot {
  @include flex-between;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-top: 1px solid $border-color;
  background: $bg-white;
}

.tool__item-name {
  font-size: $font-size-sm;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__item-dims {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
}
</style>
