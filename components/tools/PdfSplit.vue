<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="application/pdf" hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div v-if="info" class="tool__info">
      <span class="tool__info-name">{{ info.name }}</span>
      <span class="tool__info-meta">{{ info.pages }} {{ t('ui.pageCount') }} · {{ formatSize(info.size) }}</span>
    </div>

    <div v-if="info" class="tool__opts">
      <ToolField :label="t('ui.format')">
        <div class="tool__btns">
          <label class="tool__radio">
            <input v-model="mode" type="radio" value="every" name="split-mode" />
            <span>{{ t('ui.splitEveryPage') }}</span>
          </label>
          <label class="tool__radio">
            <input v-model="mode" type="radio" value="range" name="split-mode" />
            <span>{{ t('ui.pageRange') }}</span>
          </label>
        </div>
      </ToolField>

      <ToolField v-if="mode === 'range'" :label="t('ui.pageRange')" :hint="t('ui.rangesHint')">
        <input v-model="ranges" class="tool__input" type="text" spellcheck="false" />
      </ToolField>

      <div class="tool__actions">
        <button type="button" class="tool__btn tool__btn--primary" :disabled="busy" @click="run">
          {{ busy ? t('common.processing') : t('common.apply') }}
        </button>
        <button v-if="outputs.length" type="button" class="tool__btn" @click="downloadAll">
          {{ t('ui.downloadAll') }}
        </button>
      </div>
    </div>

    <div v-if="outputs.length" class="tool__outputs">
      <div v-for="(o, i) in outputs" :key="i" class="tool__out">
        <span class="tool__out-name">{{ o.name }}</span>
        <span class="tool__out-meta">{{ formatSize(o.blob.size) }} · {{ o.pages }}p</span>
        <button type="button" class="tool__btn" @click="download(o)">{{ t('common.download') }}</button>
      </div>
    </div>

    <div v-if="message" class="tool__msg" :class="{ 'is-error': isError }">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

const { t } = useI18n()
const { downloadBlob } = useFileDownload()

const info = ref<{ name: string; size: number; pages: number; bytes: ArrayBuffer } | null>(null)
const mode = ref<'every' | 'range'>('every')
const ranges = ref('1-3, 5')
const busy = ref(false)
const message = ref('')
const isError = ref(false)
const fileRef = ref<HTMLInputElement | null>(null)

const outputs = ref<Array<{ name: string; blob: Blob; pages: number }>>([])

function pick() {
  fileRef.value?.click()
}
function onFiles(e: Event) {
  load(Array.from((e.target as HTMLInputElement).files || [])[0])
}
function onDrop(e: DragEvent) {
  load(Array.from(e.dataTransfer?.files || [])[0])
}

async function load(file?: File) {
  message.value = ''
  isError.value = false
  outputs.value = []
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    message.value = t('ui.unsupportedFile')
    isError.value = true
    return
  }
  try {
    const bytes = await file.arrayBuffer()
    const doc = await PDFDocument.load(bytes)
    info.value = { name: file.name, size: file.size, pages: doc.getPageCount(), bytes }
    mode.value = 'every'
  } catch {
    message.value = t('ui.unsupportedFile')
    isError.value = true
  }
}

function parseRanges(input: string, max: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (const part of input.split(',')) {
    const seg = part.trim()
    if (!seg) continue
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(seg)
    if (m) {
      const a = Math.max(1, Number(m[1]))
      const b = Math.min(max, Number(m[2]))
      if (a <= b) out.push([a - 1, b - 1])
    } else if (/^\d+$/.test(seg)) {
      const n = Number(seg)
      if (n >= 1 && n <= max) out.push([n - 1, n - 1])
    }
  }
  return out
}

async function run() {
  if (!info.value) return
  busy.value = true
  message.value = ''
  outputs.value = []
  const base = info.value.name.replace(/\.pdf$/i, '')
  try {
    const src = await PDFDocument.load(info.value.bytes)

    const groups: Array<[number, number]> =
      mode.value === 'every'
        ? src.getPageIndices().map((i) => [i, i])
        : parseRanges(ranges.value, src.getPageCount())

    if (!groups.length) {
      message.value = t('ui.invalidInput')
      isError.value = true
      return
    }

    for (const [from, to] of groups) {
      const out = await PDFDocument.create()
      const indices = Array.from({ length: to - from + 1 }, (_, k) => from + k)
      const pages = await out.copyPages(src, indices)
      pages.forEach((p) => out.addPage(p))
      const bytes = await out.save({ useObjectStreams: true })
      const label =
        groups.length > 1 || mode.value === 'every'
          ? from === to
            ? `${base}-p${from + 1}.pdf`
            : `${base}-p${from + 1}-${to + 1}.pdf`
          : `${base}-split.pdf`
      outputs.value.push({
        name: label,
        blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
        pages: indices.length
      })
    }
    message.value = `✓ ${t('common.done')} (${outputs.value.length})`
  } catch (e) {
    message.value = `${t('common.error')}: ${(e as Error).message}`
    isError.value = true
  } finally {
    busy.value = false
  }
}

function download(o: { name: string; blob: Blob }) {
  downloadBlob(o.blob, o.name)
}
function downloadAll() {
  outputs.value.forEach((o, i) => setTimeout(() => download(o), i * 250))
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

.tool__info {
  @include flex-between;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $bg-subtle;
}

.tool__info-name {
  font-size: $font-size-sm;
  font-weight: 600;
}

.tool__info-meta {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
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

.tool__input {
  @include input-base;
  height: 40px;
  font-family: $font-family-mono;
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

.tool__actions {
  display: flex;
  gap: $spacing-xs;
  align-items: flex-end;
}

.tool__outputs {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tool__out {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
}

.tool__out-name {
  flex: 1;
  font-size: $font-size-sm;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__out-meta {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
  flex-shrink: 0;
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
