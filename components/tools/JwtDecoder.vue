<template>
  <div class="tool">
    <ToolField class="tool__full" :label="t('ui.token')">
      <textarea
        v-model="token"
        class="tool__area"
        spellcheck="false"
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTcwMDAwMDAwMH0.5hbS..."
      />
    </ToolField>

    <div v-if="error" class="tool__error" role="alert">{{ error }}</div>

    <template v-else-if="decoded">
      <div class="tool__grid">
        <ToolField :label="t('ui.header')">
          <ResultBox :value="decoded.header" :title="t('ui.header')" />
        </ToolField>

        <ToolField :label="t('ui.payload')">
          <ResultBox :value="decoded.payload" :title="t('ui.payload')" />
        </ToolField>
      </div>

      <ToolField :label="t('ui.signature')">
        <div class="tool__sig">
          <code>{{ decoded.signature || '—' }}</code>
        </div>
      </ToolField>

      <div v-if="claims.length" class="tool__claims">
        <div v-for="c in claims" :key="c.key" class="tool__claim">
          <span class="tool__claim-key">{{ c.key }}</span>
          <span class="tool__claim-value">{{ c.value }}</span>
        </div>
      </div>

      <div class="tool__exp" :class="expired ? 'is-expired' : 'is-valid'">
        {{ expired ? t('ui.expired') : t('ui.notExpired') }}
        <template v-if="expLabel"> · {{ t('ui.expiresAt') }}: {{ expLabel }}</template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()

const token = ref('')

const error = ref('')
const decoded = computed(() => {
  error.value = ''
  const raw = token.value.trim()
  if (!raw) return null
  const parts = raw.split('.')
  if (parts.length < 2) {
    error.value = t('ui.invalidInput')
    return null
  }
  const b64 = (s: string) => {
    const norm = s.replace(/-/g, '+').replace(/_/g, '/')
    const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : ''
    const bytes = Uint8Array.from(atob(norm + pad), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  try {
    const headerJson = b64(parts[0])
    const payloadJson = b64(parts[1])
    const header = JSON.stringify(JSON.parse(headerJson), null, 2)
    const payload = JSON.stringify(JSON.parse(payloadJson), null, 2)
    return { header, payload, signature: parts[2] || '', payloadJson: JSON.parse(payloadJson) }
  } catch {
    error.value = t('ui.invalidInput')
    return null
  }
})

const CLAIM_KEYS: Record<string, string[]> = {
  time: ['exp', 'iat', 'nbf'],
  who: ['iss', 'sub', 'aud', 'jti'],
  other: ['alg', 'typ', 'kid', 'scope', 'role']
}

const claims = computed(() => {
  const p = decoded.value?.payloadJson as Record<string, unknown> | undefined
  if (!p) return []
  const order = [...CLAIM_KEYS.time, ...CLAIM_KEYS.who, ...CLAIM_KEYS.other]
  const keys = Object.keys(p).sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
  })
  return keys.map((key) => {
    const v = p[key]
    let value = ''
    if ((key === 'exp' || key === 'iat' || key === 'nbf') && typeof v === 'number') {
      try {
        value = new Date(v * 1000).toLocaleString(locale.value)
      } catch {
        value = String(v)
      }
    } else if (typeof v === 'object') {
      value = JSON.stringify(v)
    } else {
      value = String(v)
    }
    return { key, value }
  })
})

const expired = computed(() => {
  const p = decoded.value?.payloadJson as Record<string, unknown> | undefined
  if (!p || typeof p.exp !== 'number') return false
  return p.exp * 1000 < Date.now()
})

const expLabel = computed(() => {
  const p = decoded.value?.payloadJson as Record<string, unknown> | undefined
  if (!p || typeof p.exp !== 'number') return ''
  try {
    return new Date(p.exp * 1000).toLocaleString(locale.value)
  } catch {
    return String(p.exp)
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tool__full {
  grid-column: 1 / -1;
}

.tool__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__grid :deep(.result-box) {
  min-height: 140px;
}

.tool__area {
  @include input-base;
  min-height: 110px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  line-height: 1.6;
  word-break: break-all;
}

.tool__error {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: $error-bg;
  color: $error-color;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
}

.tool__sig {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-subtle;
  overflow: auto;

  code {
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $text-secondary;
    word-break: break-all;
  }
}

.tool__claims {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-xs;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__claim {
  display: flex;
  gap: $spacing-sm;
  padding: 6px $spacing-sm;
  border-radius: $radius-sm;
  background: $bg-subtle;
  font-size: $font-size-xs;
}

.tool__claim-key {
  font-family: $font-family-mono;
  font-weight: 700;
  color: $accent-color;
  flex-shrink: 0;
  min-width: 54px;
}

.tool__claim-value {
  font-family: $font-family-mono;
  color: $text-secondary;
  word-break: break-all;
}

.tool__exp {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: 600;

  &.is-valid {
    background: $success-bg;
    color: $success-color;
  }

  &.is-expired {
    background: $error-bg;
    color: $error-color;
  }
}
</style>
