<template>
  <div class="tool">
    <div class="tool__drop" @click="pick" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="application/pdf" multiple hidden @change="onFiles" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5" />
        <path d="M8 15l2.5 2.5L16 12" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div class="tool__opts">
      <ToolField :label="t('ui.compressionLevel')">
        <div class="tool__btns">
          <label v-for="l in levels" :key="l.value" class="tool__radio">
            <input v-model="level" type="radio" :value="l.value" name="pdf-level" />
            <span>{{ t(`ui.level${l.label}`) }}</span>
          </label>
        </div>
      </ToolField>

      <ToolField :label="t('common.options')">
        <label class="tool__check">
          <input v-model="stripMetadata" type="checkbox" />
          <span>{{ t('ui.stripMetadata') }}</span>
        </label>
      </ToolField>

      <div class="tool__actions">
        <button type="button" class="tool__btn tool__btn--primary" :disabled="!files.length || busy" @click="run">
          {{ busy ? t('common.processing') : t('ui.compress') }}
        </button>
      </div>
    </div>

    <div v-if="results.length" class="tool__results">
      <div v-for="(r, i) in results" :key="i" class="tool__res">
        <span class="tool__res-name">{{ r.name }}</span>
        <span class="tool__res-meta">
          {{ formatSize(r.before) }} → {{ formatSize(r.after) }}
          <em v-if="r.saved > 0" class="is-saved">−{{ r.saved }}%</em>
          <em v-else class="is-flat">0%</em>
        </span>
        <button type="button" class="tool__btn" @click="download(r)">{{ t('ui.downloadPdf') }}</button>
      </div>
    </div>

    <div v-if="message" class="tool__msg" :class="{ 'is-error': isError }">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

const { t } = useI18n()
const { downloadBlob } = useFileDownload()

const levels = [
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' }
]

const files = ref<Array<{ name: string; bytes: ArrayBuffer }>>([])
const level = ref<'low' | 'medium' | 'high'>('medium')
const stripMetadata = ref(true)
const busy = ref(false)
const message = ref('')
const isError = ref(false)
const fileRef = ref<HTMLInputElement | null>(null)

const results = ref<Array<{ name: string; blob: Blob; before: number; after: number; saved: number }>>([])

function pick() {
  fileRef.value?.click()
}
function onFiles(e: Event) {
  add(Array.from((e.target as HTMLInputElement).files || []))
}
function onDrop(e: DragEvent) {
  add(Array.from(e.dataTransfer?.files || []))
}

async function add(list: File[]) {
  message.value = ''
  isError.value = false
  for (const file of list) {
    if (!file.name.toLowerCase().endsWith('.pdf')) continue
    files.value.push({ name: file.name, bytes: await file.arrayBuffer() })
  }
}

async function run() {
  if (!files.value.length) return
  busy.value = true
  results.value = []
  message.value = ''
  try {
    for (const f of files.value) {
      const doc = await PDFDocument.load(f.bytes, { ignoreEncryption: true, updateMetadata: false })

      if (stripMetadata.value) {
        doc.setTitle('')
        doc.setAuthor('')
        doc.setSubject('')
        doc.setKeywords([])
        doc.setProducer('FreeTools')
        doc.setCreator('FreeTools')
      }

      // 高级别时重复序列化并清理无用对象流，获得更紧凑的结构
      let bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      if (level.value === 'high') {
        const again = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
        bytes = await again.save({ useObjectStreams: true, addDefaultPage: false })
      }

      const before = f.bytes.byteLength
      const after = bytes.byteLength
      results.value.push({
        name: f.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
        blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
        before,
        after,
        saved: before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0
      })
    }
    message.value = `✓ ${t('common.done')} (${results.value.length})`
  } catch (e) {
    message.value = `${t('common.error')}: ${(e as Error).message}`
    isError.value = true
  } finally {
    busy.value = false
  }
}

function download(r: { name: string; blob: Blob }) {
  downloadBlob(r.blob, r.name)
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
  grid-template-columns: 1.6fr 1fr auto;
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

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  height: 40px;
  cursor: pointer;
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

.tool__results {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tool__res {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
}

.tool__res-name {
  flex: 1;
  font-size: $font-size-sm;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool__res-meta {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-muted;
  flex-shrink: 0;

  .is-saved {
    color: $success-color;
    font-style: normal;
    font-weight: 700;
  }

  .is-flat {
    color: $text-placeholder;
    font-style: normal;
  }
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
