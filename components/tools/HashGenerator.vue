<template>
  <div class="tool">
    <ToolField :label="t('common.input')">
      <textarea v-model="input" class="tool__area" spellcheck="false" :placeholder="t('ui.pasteOrType')" />
    </ToolField>

    <ToolField :label="t('ui.hmacSecret')" :hint="t('common.optional')">
      <input v-model="hmacKey" class="tool__input" type="text" spellcheck="false" autocomplete="off" />
    </ToolField>

    <ToolField :label="t('ui.compare')" :hint="t('common.optional')">
      <input v-model="compareHash" class="tool__input" type="text" spellcheck="false" />
    </ToolField>

    <div class="tool__hashes">
      <div v-for="h in hashes" :key="h.alg" class="tool__hash">
        <div class="tool__hash-head">
          <span class="tool__hash-alg">{{ h.alg }}</span>
          <CopyButton :value="h.value" />
        </div>
        <code class="tool__hash-value" :class="{ 'is-match': isMatch(h.value), 'is-empty': !h.value }">
          {{ h.value || '—' }}
        </code>
      </div>
    </div>

    <label class="tool__check">
      <input v-model="uppercase" type="checkbox" />
      <span>{{ t('ui.uppercaseHash') }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const input = ref('')
const hmacKey = ref('')
const compareHash = ref('')
const uppercase = ref(false)

const ALGS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

const digests = ref<Record<string, string>>({})

// ---- 纯 JS MD5（Web Crypto 不支持） ----
function md5(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const msgLen = bytes.length
  const withPad = new Uint8Array((((msgLen + 8) >> 6) + 1) * 64)
  withPad.set(bytes)
  withPad[msgLen] = 0x80
  const dv = new DataView(withPad.buffer)
  dv.setUint32(withPad.length - 8, msgLen * 8, true)

  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476

  for (let off = 0; off < withPad.length; off += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true)

    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0
    }
    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const out = new DataView(new ArrayBuffer(16))
  out.setUint32(0, a0, true)
  out.setUint32(4, b0, true)
  out.setUint32(8, c0, true)
  out.setUint32(12, d0, true)
  return [...new Uint8Array(out.buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmac(alg: string, key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: alg },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function compute() {
  const text = input.value

  const results: Record<string, string> = {}
  results['MD5'] = text ? md5(text) : ''
  for (const alg of ALGS) {
    if (!text) {
      results[alg] = ''
      continue
    }
    if (hmacKey.value) {
      results[alg] = await hmac(alg, hmacKey.value, text)
    } else {
      // Web Crypto 算法名必须保留连字符（'SHA-256'），'sha256' 会抛 Unrecognized name
      const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(text))
      results[alg] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  }
  digests.value = results
}

let timer: ReturnType<typeof setTimeout> | null = null
watch([input, hmacKey], () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(compute, 200)
})
onMounted(compute)

const hashes = computed(() =>
  ['MD5', ...ALGS].map((alg) => ({
    alg,
    value: uppercase.value ? (digests.value[alg] || '').toUpperCase() : digests.value[alg] || ''
  }))
)

function isMatch(value: string) {
  const cmp = compareHash.value.trim().toLowerCase()
  return Boolean(cmp && value && value.toLowerCase() === cmp)
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__area {
  @include input-base;
  min-height: 120px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
}

.tool__input {
  @include input-base;
  height: 40px;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
}

.tool__check {
  @include flex-start;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
}

.tool__hashes {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tool__hash {
  @include surface;
  overflow: hidden;
}

.tool__hash-head {
  @include flex-between;
  padding: 5px $spacing-sm;
  background: $bg-subtle;
  border-bottom: 1px solid $border-color;
}

.tool__hash-alg {
  font-size: $font-size-xs;
  font-weight: 700;
  font-family: $font-family-mono;
  color: $accent-color;
}

.tool__hash-value {
  display: block;
  padding: $spacing-sm $spacing-md;
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  color: $text-primary;
  word-break: break-all;
  line-height: 1.6;

  &.is-empty {
    color: $text-placeholder;
  }

  &.is-match {
    background: $success-bg;
    color: $success-color;
    font-weight: 600;
  }
}
</style>
