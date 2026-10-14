<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="application/pdf" multiple hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div v-if="files.length" class="tool__list">
      <div v-for="(f, i) in files" :key="i" class="tool__row">
        <span class="tool__row-idx">{{ i + 1 }}</span>
        <span class="tool__row-name">{{ f.name }}</span>
        <span class="tool__row-meta">{{ formatSize(f.size) }} · {{ f.pages }} {{ t('ui.pageCount') }}</span>
        <div class="tool__row-actions">
          <button type="button" class="tool__btn tool__btn--icon" :disabled="i === 0" :title="t('ui.moveUp')" @click="move(i, -1)">↑</button>
          <button type="button" class="tool__btn tool__btn--icon" :disabled="i === files.length - 1" :title="t('ui.moveDown')" @click="move(i, 1)">↓</button>
          <button type="button" class="tool__btn tool__btn--icon" :title="t('common.remove')" @click="remove(i)">×</button>
        </div>
      </div>
    </div>

    <div class="tool__actions">
      <ToolField :label="t('ui.outputFilename')">
        <input v-model="filename" class="tool__input" type="text" spellcheck="false" />
      </ToolField>
      <button
        type="button"
        class="tool__btn tool__btn--primary"
        :disabled="files.length < 2 || busy"
        @click="merge"
      >
        {{ busy ? t('common.processing') : t('ui.downloadPdf') }}
      </button>
    </div>

    <div v-if="message" class="tool__msg" :class="{ 'is-error': isError }">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

const { t } = useI18n()
const { downloadBlob } = useFileDownload()

interface PdfFile {
  file: File
  name: string
  size: number
  bytes: ArrayBuffer
  pages: number
}

const files = ref<PdfFile[]>([])
const filename = ref('merged.pdf')
const busy = ref(false)
const message = ref('')
const isError = ref(false)
const fileRef = ref<HTMLInputElement | null>(null)

function pick() {
  fileRef.value?.click()
}
function onFiles(e: Event) {
  addFiles(Array.from((e.target as HTMLInputElement).files || []))
}
function onDrop(e: DragEvent) {
  addFiles(Array.from(e.dataTransfer?.files || []))
}

async function addFiles(list: File[]) {
  message.value = ''
  isError.value = false
  for (const file of list) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      message.value = t('ui.unsupportedFile')
      isError.value = true
      continue
    }
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false })
      files.value.push({
        file,
        name: file.name,
        size: file.size,
        bytes,
        pages: doc.getPageCount()
      })
    } catch {
      message.value = t('ui.unsupportedFile')
      isError.value = true
    }
  }
}

function move(i: number, dir: number) {
  const j = i + dir
  if (j < 0 || j >= files.value.length) return
  const arr = [...files.value]
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  files.value = arr
}

function remove(i: number) {
  files.value.splice(i, 1)
}

async function merge() {
  if (files.value.length < 2) return
  busy.value = true
  message.value = ''
  try {
    const out = await PDFDocument.create()
    for (const f of files.value) {
      const src = await PDFDocument.load(f.bytes, { ignoreEncryption: true })
      const pages = await out.copyPages(src, src.getPageIndices())
      pages.forEach((p) => out.addPage(p))
    }
    out.setProducer('FreeTools')
    out.setCreator('FreeTools (freetools.fun)')
    const bytes = await out.save({ useObjectStreams: true })
    downloadBlob(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }), safeName())
    message.value = `✓ ${t('common.done')} · ${formatSize(bytes.byteLength)}`
    isError.value = false
  } catch (e) {
    message.value = `${t('common.error')}: ${(e as Error).message}`
    isError.value = true
  } finally {
    busy.value = false
  }
}

function safeName() {
  const n = filename.value.trim() || 'merged.pdf'
  return n.endsWith('.pdf') ? n : `${n}.pdf`
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

.tool__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tool__row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
}

.tool__row-idx {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: $radius-full;
  background: $brand-50;
  color: $accent-color;
  font-size: $font-size-xs;
  font-weight: 700;
  flex-shrink: 0;
}

.tool__row-name {
  flex: 1;
  font-size: $font-size-sm;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__row-meta {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
  flex-shrink: 0;
}

.tool__row-actions {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
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

  &--icon {
    padding: 4px 8px;
    font-family: $font-family-mono;
    line-height: 1;
  }
}

.tool__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: $spacing-md;
  align-items: end;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__input {
  @include input-base;
  height: 40px;
}

.tool__msg {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $success-bg;
  color: $success-color;
  font-size: $font-size-sm;

  &.is-error {
    background: $error-bg;
    color: $error-color;
  }
}
</style>
