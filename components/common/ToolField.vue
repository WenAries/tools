<template>
  <div class="tool-field" :class="{ 'tool-field--wide': wide }">
    <label v-if="label" class="tool-field__label" :for="id">
      {{ label }}
      <span v-if="hint" class="tool-field__hint">{{ hint }}</span>
    </label>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ label?: string; hint?: string; wide?: boolean }>(), {
  label: '',
  hint: '',
  wide: false
})

const id = useId()
</script>

<style scoped lang="scss">
.tool-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tool-field--wide {
  grid-column: 1 / -1;
}

.tool-field__label {
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: $text-muted;
}

.tool-field__hint {
  margin-left: $spacing-xs;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: $text-placeholder;
}
</style>
