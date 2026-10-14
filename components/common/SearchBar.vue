<template>
  <div class="search-bar" :class="{ 'is-compact': compact }">
    <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
    <input
      :value="modelValue"
      class="search-bar__input"
      type="search"
      autocomplete="off"
      :placeholder="placeholder"
      :aria-label="placeholder"
      @input="onInput"
      @keydown.enter="emit('submit', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      class="search-bar__clear"
      type="button"
      :aria-label="t('common.clear')"
      @click="clear"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    compact?: boolean
  }>(),
  { placeholder: '', compact: false }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', value: string): void
}>()

const { t } = useI18n()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
  emit('submit', '')
}
</script>

<style scoped lang="scss">
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-bar__icon {
  position: absolute;
  left: 12px;
  width: 17px;
  height: 17px;
  color: $text-placeholder;
  pointer-events: none;
}

.search-bar__input {
  width: 100%;
  height: 42px;
  padding: 0 38px 0 38px;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: $font-size-base;
  font-family: inherit;
  color: $text-primary;
  background: $bg-white;
  transition: border-color $transition-fast, box-shadow $transition-fast;

  &::placeholder {
    color: $text-placeholder;
  }

  &:focus {
    outline: none;
    border-color: $accent-color;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
}

.search-bar.is-compact .search-bar__input {
  height: 36px;
  font-size: $font-size-sm;
}

.search-bar__clear {
  position: absolute;
  right: 10px;
  @include flex-center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: $radius-full;
  background: $bg-subtle;
  color: $text-secondary;
  cursor: pointer;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: $border-strong;
  }
}
</style>
