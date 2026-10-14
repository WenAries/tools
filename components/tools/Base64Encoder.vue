<template>
  <div class="tool">
    <div class="tool__mode">
      <div class="tool__tabs">
        <button type="button" class="tool__tab" :class="{ 'is-active': mode === 'encode' }" @click="mode = 'encode'">
          {{ t('ui.encode') }}
        </button>
        <button type="button" class="tool__tab" :class="{ 'is-active': mode === 'decode' }" @click="mode = 'decode'">
          {{ t('ui.decode') }}
        </button>
      </div>
      <label class="tool__check">
        <input v-model="urlSafe" type="checkbox" />
        <span>URL-safe (-_)</span>
      </label>
    </div>

    <ToolField :label="t('common.input')">
      <textarea
        v-model="input"
        class="tool__area"
        spellcheck="false"
        :placeholder="mode === 'encode' ? t('ui.pasteOrType') : 'aGVsbG8='"
      />
    </ToolField>

    <div v-if="mode === 'encode' && file" class="tool__file">
      <div class="tool__file-head">
        <span class="tool__file-name">{{ file.name }}</span>
        <span class="tool__file-size">{{ file.sizeLabel }}</span>
        <button type="button" class="tool__btn tool__btn--ghost" @click="clearFile">{{ t('common.remove') }}</button>
      </div>
      <button type="button" class="tool__btn" @click="downloadDataUrl(output, file.name + '.base64.txt')">
        {{ t('common.download') }} .txt
      </button>
    </div>

    <div class="tool__upload" @click="pickFile" @dragover.prevent @drop.prevent="onDrop">
      <input ref="fileRef" type="file" accept="*/*" hidden @change="onFile" />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      </svg>
      <span>{{ t('ui.dropFiles') }}</span>
    </div>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <ResultBox
      :value="output"
      downloadable
      :download-name="mode === 'encode' ? 'encoded.txt' : 'decoded.txt'"
    >
      <template #actions>
        <span v-if="output" class="tool__sizes">{{ byteLength(output) }} {{ t('common.bytes') }}</span>
      </template>
    </ResultBox>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { readFileAsDataURL, downloadDataUrl } = useFileDownload()

const mode = ref<'encode' | 'decode'>('encode')
const urlSafe = ref(false)
const input = ref('')
const error = ref('')
const file = ref<{ name: string; sizeLabel: string; dataUrl: string } | null>(null)
const fileRef = ref<HTMLInputElement | null>(null)

function byteLength(s: string) {
  return new TextEncoder().encode(s).length
}

function b64encode(bytes: Uint8Array, safe: boolean) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  let out = btoa(bin)
  if (safe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return out
}

function b64decode(str: string): Uint8Array {
  const norm = str.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : ''
  const bin = atob(norm + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const output = computed(() => {
  error.value = ''
  if (file.value) return file.value.dataUrl
  const raw = input.value
  if (!raw) return ''
  try {
    if (mode.value === 'encode') {
      return b64encode(new TextEncoder().encode(raw), urlSafe.value)
    }
    return new TextDecoder().decode(b64decode(raw))
  } catch {
    error.value = t('ui.invalidInput')
    return ''
  }
})

function pickFile() {
  fileRef.value?.click()
}

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) loadFile(f)
}

function onDrop(e: DragEvent) {
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}

async function loadFile(f: File) {
  error.value = ''
  const dataUrl = await readFileAsDataURL(f)
  file.value = { name: f.name, sizeLabel: formatBytes(f.size), dataUrl }
}

function clearFile() {
  file.value = null
  if (fileRef.value) fileRef.value.value = ''
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__mode {
  @include flex-between;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.tool__tabs {
  @include flex-start;
  gap: 2px;
  padding: 3px;
  background: $bg-subtle;
  border-radius: $radius-sm;
}

.tool__tab {
  @include button-base;
  padding: 5px $spacing-md;
  font-size: $font-size-sm;
  background: transparent;
  color: $text-secondary;

  &.is-active {
    background: $bg-white;
    color: $accent-color;
    box-shadow: $shadow-xs;
  }
}

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__area {
  @include input-base;
  min-height: 140px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
}

.tool__upload {
  @include flex-center;
  gap: $spacing-sm;
  padding: $spacing-md;
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
    width: 20px;
    height: 20px;
  }
}

.tool__file {
  @include flex-between;
  gap: $spacing-sm;
  flex-wrap: wrap;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $bg-subtle;
}

.tool__file-head {
  @include flex-start;
  gap: $spacing-sm;
}

.tool__file-name {
  font-size: $font-size-sm;
  font-weight: 600;
}

.tool__file-size {
  font-size: $font-size-xs;
  color: $text-muted;
  font-family: $font-family-mono;
}

.tool__btn {
  @include button-ghost;
  font-size: $font-size-sm;
  padding: 5px $spacing-sm;
}

.tool__sizes {
  font-size: $font-size-xs;
  color: $text-muted;
  font-family: $font-family-mono;
}

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
}
</style>
